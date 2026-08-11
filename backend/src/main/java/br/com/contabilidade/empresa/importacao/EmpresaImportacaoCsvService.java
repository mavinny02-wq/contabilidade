package br.com.contabilidade.empresa.importacao;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.empresa.api.EmpresaRequest;
import br.com.contabilidade.empresa.domain.Cnpj;
import br.com.contabilidade.empresa.domain.RegimeTributario;
import br.com.contabilidade.empresa.domain.StatusEmpresa;
import br.com.contabilidade.empresa.repository.EstabelecimentoRepository;
import br.com.contabilidade.empresa.service.EmpresaService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EmpresaImportacaoCsvService {

    private static final String CABECALHO_MODELO = String.join(";",
            "razao_social",
            "nome_fantasia",
            "cnpj",
            "status",
            "cnae_principal",
            "regime_tributario",
            "inscricao_estadual",
            "inscricao_municipal",
            "logradouro",
            "numero",
            "complemento",
            "bairro",
            "municipio",
            "uf",
            "cep",
            "responsavel_nome",
            "responsavel_email"
    );

    private static final Map<String, String> ALIASES = aliases();

    private final EmpresaService empresaService;
    private final EstabelecimentoRepository estabelecimentoRepository;
    private final AuditoriaService auditoriaService;
    private final MessageSource messageSource;
    private final Validator validator;
    private final long maximoBytes;
    private final int maximoLinhas;
    private final int maximoErrosRetornados;

    public EmpresaImportacaoCsvService(
            EmpresaService empresaService,
            EstabelecimentoRepository estabelecimentoRepository,
            AuditoriaService auditoriaService,
            MessageSource messageSource,
            Validator validator,
            @Value("${app.company.csv-import-max-file-size-bytes:2097152}") long maximoBytes,
            @Value("${app.company.csv-import-max-rows:2000}") int maximoLinhas,
            @Value("${app.company.csv-import-max-errors:200}") int maximoErrosRetornados
    ) {
        this.empresaService = empresaService;
        this.estabelecimentoRepository = estabelecimentoRepository;
        this.auditoriaService = auditoriaService;
        this.messageSource = messageSource;
        this.validator = validator;
        this.maximoBytes = limitar(maximoBytes, 1024, 20L * 1024 * 1024);
        this.maximoLinhas = (int) limitar(maximoLinhas, 1, 20_000);
        this.maximoErrosRetornados = (int) limitar(maximoErrosRetornados, 1, 2_000);
    }

    public ResultadoImportacao importar(MultipartFile arquivo, boolean somenteValidar) {
        validarArquivo(arquivo);
        String conteudo = decodificarUtf8(arquivo);
        char separador = detectarSeparador(conteudo);
        List<List<String>> registros = lerRegistros(conteudo, separador);
        removerRegistrosVazios(registros);

        if (registros.isEmpty()) {
            throw erro("IMPORTACAO_CSV_VAZIA", "erros.importacaoCsvVazia", HttpStatus.BAD_REQUEST);
        }
        if (registros.size() - 1 > maximoLinhas) {
            throw erro("IMPORTACAO_CSV_LIMITE_LINHAS", "erros.importacaoCsvLimiteLinhas",
                    HttpStatus.PAYLOAD_TOO_LARGE);
        }

        Map<String, Integer> colunas = mapearCabecalho(registros.get(0));
        exigirColuna(colunas, "razao_social");
        exigirColuna(colunas, "cnpj");

        int total = Math.max(registros.size() - 1, 0);
        int validas = 0;
        int importadas = 0;
        int rejeitadas = 0;
        List<ErroLinha> erros = new ArrayList<>();
        Set<String> cnpjsNoArquivo = new HashSet<>();

        for (int indice = 1; indice < registros.size(); indice++) {
            int linha = indice + 1;
            try {
                EmpresaRequest request = converter(registros.get(indice), colunas);
                String cnpj = Cnpj.normalizarEValidar(request.cnpj());
                if (!cnpjsNoArquivo.add(cnpj)) {
                    throw new ErroImportacaoLinha("CNPJ_DUPLICADO_NO_ARQUIVO",
                            "O CNPJ está repetido no próprio arquivo.");
                }
                validarRequest(request);
                if (estabelecimentoRepository.findByCnpj(cnpj).isPresent()) {
                    throw new ErroImportacaoLinha("CNPJ_JA_CADASTRADO",
                            mensagem("erros.cnpjJaCadastrado"));
                }

                validas++;
                if (!somenteValidar) {
                    empresaService.criar(request);
                    importadas++;
                }
            } catch (ErroImportacaoLinha exception) {
                rejeitadas++;
                adicionarErro(erros, linha, exception.codigo, exception.getMessage());
            } catch (ExcecaoNegocio exception) {
                rejeitadas++;
                adicionarErro(erros, linha, exception.getCodigo(), mensagem(exception.getMensagemKey()));
            } catch (IllegalArgumentException exception) {
                rejeitadas++;
                adicionarErro(erros, linha, "DADOS_INVALIDOS", resumoSeguro(exception));
            } catch (RuntimeException exception) {
                rejeitadas++;
                adicionarErro(erros, linha, "IMPORTACAO_LINHA_FALHOU",
                        mensagem("erros.importacaoCsvLinhaFalhou"));
            }
        }

        if (!somenteValidar) {
            auditoriaService.registrar(
                    "EMPRESAS_IMPORTADAS_CSV",
                    "EMPRESA",
                    null,
                    Map.of(
                            "totalLinhas", total,
                            "linhasValidas", validas,
                            "empresasImportadas", importadas,
                            "linhasRejeitadas", rejeitadas,
                            "separador", String.valueOf(separador)
                    )
            );
        }

        return new ResultadoImportacao(
                somenteValidar,
                total,
                validas,
                importadas,
                rejeitadas,
                erros.size() < rejeitadas,
                List.copyOf(erros)
        );
    }

    public byte[] modelo() {
        return ("\uFEFF" + CABECALHO_MODELO + "\r\n").getBytes(StandardCharsets.UTF_8);
    }

    private EmpresaRequest converter(List<String> valores, Map<String, Integer> colunas) {
        return new EmpresaRequest(
                valor(valores, colunas, "razao_social"),
                valor(valores, colunas, "nome_fantasia"),
                valor(valores, colunas, "cnpj"),
                enumValor(StatusEmpresa.class, valor(valores, colunas, "status"), StatusEmpresa.ATIVA,
                        "STATUS_INVALIDO"),
                valor(valores, colunas, "cnae_principal"),
                enumValor(RegimeTributario.class, valor(valores, colunas, "regime_tributario"),
                        RegimeTributario.NAO_INFORMADO, "REGIME_TRIBUTARIO_INVALIDO"),
                valor(valores, colunas, "inscricao_estadual"),
                valor(valores, colunas, "inscricao_municipal"),
                valor(valores, colunas, "logradouro"),
                valor(valores, colunas, "numero"),
                valor(valores, colunas, "complemento"),
                valor(valores, colunas, "bairro"),
                valor(valores, colunas, "municipio"),
                maiusculo(valor(valores, colunas, "uf")),
                valor(valores, colunas, "cep"),
                valor(valores, colunas, "responsavel_nome"),
                valor(valores, colunas, "responsavel_email")
        );
    }

    private void validarRequest(EmpresaRequest request) {
        Set<ConstraintViolation<EmpresaRequest>> violacoes = validator.validate(request);
        if (violacoes.isEmpty()) return;
        StringBuilder mensagem = new StringBuilder();
        violacoes.stream()
                .sorted((a, b) -> a.getPropertyPath().toString().compareTo(b.getPropertyPath().toString()))
                .limit(5)
                .forEach(violacao -> {
                    if (!mensagem.isEmpty()) mensagem.append("; ");
                    mensagem.append(violacao.getPropertyPath()).append(": ").append(violacao.getMessage());
                });
        throw new ErroImportacaoLinha("VALIDACAO_LINHA", mensagem.toString());
    }

    private <E extends Enum<E>> E enumValor(
            Class<E> tipo,
            String valor,
            E padrao,
            String codigo
    ) {
        if (valor == null || valor.isBlank()) return padrao;
        try {
            return Enum.valueOf(tipo, normalizarEnum(valor));
        } catch (IllegalArgumentException exception) {
            throw new ErroImportacaoLinha(codigo,
                    "Valor não reconhecido: " + valor.trim().substring(0, Math.min(valor.trim().length(), 80)));
        }
    }

    private String valor(List<String> valores, Map<String, Integer> colunas, String coluna) {
        Integer indice = colunas.get(coluna);
        if (indice == null || indice >= valores.size()) return null;
        String limpo = valores.get(indice).trim();
        return limpo.isEmpty() ? null : limpo;
    }

    private Map<String, Integer> mapearCabecalho(List<String> cabecalho) {
        Map<String, Integer> colunas = new LinkedHashMap<>();
        for (int indice = 0; indice < cabecalho.size(); indice++) {
            String normalizado = normalizarCabecalho(cabecalho.get(indice));
            if (normalizado.isBlank()) continue;
            String canonico = ALIASES.getOrDefault(normalizado, normalizado);
            if (colunas.putIfAbsent(canonico, indice) != null) {
                throw erro("IMPORTACAO_CSV_COLUNA_DUPLICADA", "erros.importacaoCsvColunaDuplicada",
                        HttpStatus.BAD_REQUEST);
            }
        }
        return colunas;
    }

    private void exigirColuna(Map<String, Integer> colunas, String coluna) {
        if (!colunas.containsKey(coluna)) {
            throw erro("IMPORTACAO_CSV_CABECALHO_INVALIDO", "erros.importacaoCsvCabecalhoInvalido",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private List<List<String>> lerRegistros(String conteudo, char separador) {
        List<List<String>> registros = new ArrayList<>();
        List<String> registro = new ArrayList<>();
        StringBuilder campo = new StringBuilder();
        boolean entreAspas = false;

        for (int indice = 0; indice < conteudo.length(); indice++) {
            char atual = conteudo.charAt(indice);
            if (atual == '"') {
                if (entreAspas && indice + 1 < conteudo.length() && conteudo.charAt(indice + 1) == '"') {
                    campo.append('"');
                    indice++;
                } else {
                    entreAspas = !entreAspas;
                }
                continue;
            }
            if (atual == separador && !entreAspas) {
                registro.add(campo.toString());
                campo.setLength(0);
                continue;
            }
            if ((atual == '\n' || atual == '\r') && !entreAspas) {
                if (atual == '\r' && indice + 1 < conteudo.length() && conteudo.charAt(indice + 1) == '\n') {
                    indice++;
                }
                registro.add(campo.toString());
                campo.setLength(0);
                registros.add(registro);
                registro = new ArrayList<>();
                continue;
            }
            campo.append(atual);
        }

        if (entreAspas) {
            throw erro("IMPORTACAO_CSV_ASPAS_INVALIDAS", "erros.importacaoCsvAspasInvalidas",
                    HttpStatus.BAD_REQUEST);
        }
        if (!registro.isEmpty() || !campo.isEmpty()) {
            registro.add(campo.toString());
            registros.add(registro);
        }
        return registros;
    }

    private char detectarSeparador(String conteudo) {
        int pontoVirgula = 0;
        int virgula = 0;
        boolean entreAspas = false;
        for (int indice = 0; indice < conteudo.length(); indice++) {
            char atual = conteudo.charAt(indice);
            if (atual == '"') entreAspas = !entreAspas;
            if (!entreAspas && (atual == '\n' || atual == '\r')) break;
            if (!entreAspas && atual == ';') pontoVirgula++;
            if (!entreAspas && atual == ',') virgula++;
        }
        return pontoVirgula >= virgula ? ';' : ',';
    }

    private void removerRegistrosVazios(List<List<String>> registros) {
        registros.removeIf(registro -> registro.stream().allMatch(item -> item == null || item.isBlank()));
    }

    private String decodificarUtf8(MultipartFile arquivo) {
        try {
            byte[] bytes = arquivo.getBytes();
            String texto = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes))
                    .toString();
            return texto.startsWith("\uFEFF") ? texto.substring(1) : texto;
        } catch (CharacterCodingException exception) {
            throw erro("IMPORTACAO_CSV_ENCODING_INVALIDO", "erros.importacaoCsvEncodingInvalido",
                    HttpStatus.BAD_REQUEST);
        } catch (IOException exception) {
            throw new ExcecaoNegocio("IMPORTACAO_CSV_NAO_LIDA", "erros.importacaoCsvNaoLida",
                    HttpStatus.BAD_REQUEST, exception);
        }
    }

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw erro("IMPORTACAO_CSV_VAZIA", "erros.importacaoCsvVazia", HttpStatus.BAD_REQUEST);
        }
        if (arquivo.getSize() > maximoBytes) {
            throw erro("IMPORTACAO_CSV_ARQUIVO_GRANDE", "erros.importacaoCsvArquivoGrande",
                    HttpStatus.PAYLOAD_TOO_LARGE);
        }
        String nome = arquivo.getOriginalFilename();
        if (nome != null && !nome.isBlank() && !nome.toLowerCase(Locale.ROOT).endsWith(".csv")) {
            throw erro("IMPORTACAO_CSV_EXTENSAO_INVALIDA", "erros.importacaoCsvExtensaoInvalida",
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
    }

    private void adicionarErro(List<ErroLinha> erros, int linha, String codigo, String mensagem) {
        if (erros.size() >= maximoErrosRetornados) return;
        erros.add(new ErroLinha(linha, codigo, mensagem));
    }

    private String mensagem(String key) {
        return messageSource.getMessage(key, null, key, Locale.forLanguageTag("pt-BR"));
    }

    private ExcecaoNegocio erro(String codigo, String key, HttpStatus status) {
        return new ExcecaoNegocio(codigo, key, status);
    }

    private String resumoSeguro(Throwable exception) {
        String mensagem = exception.getMessage();
        if (mensagem == null || mensagem.isBlank()) return "Dados inválidos.";
        return mensagem.replace('\r', ' ').replace('\n', ' ').substring(0, Math.min(mensagem.length(), 300));
    }

    private String normalizarCabecalho(String valor) {
        String semAcento = Normalizer.normalize(valor == null ? "" : valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return semAcento.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }

    private String normalizarEnum(String valor) {
        return normalizarCabecalho(valor).toUpperCase(Locale.ROOT);
    }

    private String maiusculo(String valor) {
        return valor == null ? null : valor.toUpperCase(Locale.ROOT);
    }

    private long limitar(long valor, long minimo, long maximo) {
        return Math.min(Math.max(valor, minimo), maximo);
    }

    private static Map<String, String> aliases() {
        Map<String, String> aliases = new HashMap<>();
        aliases.put("razao", "razao_social");
        aliases.put("razao_social_empresa", "razao_social");
        aliases.put("nome", "razao_social");
        aliases.put("fantasia", "nome_fantasia");
        aliases.put("documento", "cnpj");
        aliases.put("situacao", "status");
        aliases.put("regime", "regime_tributario");
        aliases.put("cnae", "cnae_principal");
        aliases.put("ie", "inscricao_estadual");
        aliases.put("im", "inscricao_municipal");
        aliases.put("cidade", "municipio");
        aliases.put("estado", "uf");
        aliases.put("responsavel", "responsavel_nome");
        aliases.put("email", "responsavel_email");
        return Map.copyOf(aliases);
    }

    public record ResultadoImportacao(
            boolean somenteValidacao,
            int totalLinhas,
            int linhasValidas,
            int empresasImportadas,
            int linhasRejeitadas,
            boolean errosTruncados,
            List<ErroLinha> erros
    ) { }

    public record ErroLinha(int linha, String codigo, String mensagem) { }

    private static class ErroImportacaoLinha extends RuntimeException {
        private static final long serialVersionUID = 1L;
        private final String codigo;

        private ErroImportacaoLinha(String codigo, String mensagem) {
            super(mensagem);
            this.codigo = codigo;
        }
    }
}
