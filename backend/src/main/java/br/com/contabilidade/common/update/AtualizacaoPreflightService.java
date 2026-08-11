package br.com.contabilidade.common.update;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AtualizacaoPreflightService {

    private static final Pattern VERSAO = Pattern.compile("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$");
    private static final Pattern COMPONENTE = Pattern.compile("^[A-Z][A-Z0-9_]{1,39}$");
    private static final Pattern NOME_ARQUIVO = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$");
    private static final Pattern SHA256 = Pattern.compile("^[0-9a-fA-F]{64}$");
    private static final Set<String> COMPONENTES_OBRIGATORIOS = Set.of("BACKEND", "FRONTEND", "WORKER");
    private static final long TAMANHO_MAXIMO_ARTEFATO = 50L * 1024 * 1024 * 1024;

    private final ObjectMapper objectMapper;
    private final AuditoriaService auditoriaService;
    private final String versaoAtual;
    private final long tamanhoMaximoManifesto;

    public AtualizacaoPreflightService(
            ObjectMapper objectMapper,
            AuditoriaService auditoriaService,
            @Value("${app.version:0.5.1}") String versaoAtual,
            @Value("${app.update.preflight-max-manifest-size-bytes:1048576}") long tamanhoMaximoManifesto
    ) {
        this.objectMapper = objectMapper;
        this.auditoriaService = auditoriaService;
        this.versaoAtual = versaoAtual == null ? "0.0.0" : versaoAtual.trim();
        this.tamanhoMaximoManifesto = Math.min(Math.max(tamanhoMaximoManifesto, 1024), 10L * 1024 * 1024);
    }

    public AtualizacaoPreflightResponse validar(MultipartFile arquivo) {
        validarArquivo(arquivo);
        JsonNode raiz = lerJson(arquivo);
        List<AtualizacaoPreflightResponse.Ocorrencia> ocorrencias = new ArrayList<>();

        String schemaVersion = texto(raiz, "schemaVersion");
        String versaoDestino = texto(raiz, "targetVersion");
        String versaoMinima = texto(raiz, "minimumSourceVersion");
        Instant criadoEm = instant(raiz.get("createdAt"), ocorrencias);

        if (!"1.0".equals(schemaVersion)) {
            erro(ocorrencias, "SCHEMA_NAO_SUPORTADO", "O schemaVersion deve ser 1.0.");
        }
        SemVer atual = versao(versaoAtual, "VERSAO_ATUAL_INVALIDA", ocorrencias);
        SemVer destino = versao(versaoDestino, "VERSAO_DESTINO_INVALIDA", ocorrencias);
        SemVer minima = versao(versaoMinima, "VERSAO_MINIMA_INVALIDA", ocorrencias);
        if (atual != null && destino != null && destino.compareTo(atual) <= 0) {
            erro(ocorrencias, "VERSAO_DESTINO_NAO_SUPERIOR", "A versão de destino deve ser superior à versão atual.");
        }
        if (atual != null && minima != null && atual.compareTo(minima) < 0) {
            erro(ocorrencias, "ORIGEM_INCOMPATIVEL", "A versão atual é inferior à versão mínima exigida pelo pacote.");
        }
        if (criadoEm != null && criadoEm.isAfter(Instant.now().plus(24, ChronoUnit.HOURS))) {
            aviso(ocorrencias, "MANIFESTO_DATA_FUTURA", "A data de criação do manifesto está mais de 24 horas no futuro.");
        }

        List<AtualizacaoPreflightResponse.Artefato> artefatos = validarArtefatos(raiz.get("artifacts"), ocorrencias);
        Set<String> componentes = new HashSet<>();
        artefatos.forEach(item -> componentes.add(item.componente()));
        for (String obrigatorio : COMPONENTES_OBRIGATORIOS) {
            if (!componentes.contains(obrigatorio)) {
                erro(ocorrencias, "COMPONENTE_OBRIGATORIO_AUSENTE", "O componente " + obrigatorio + " não foi informado.");
            }
        }
        if (!componentes.contains("COMPOSE")) {
            aviso(ocorrencias, "COMPOSE_NAO_INFORMADO", "O manifesto não inclui um artefato de configuração Compose.");
        }

        boolean aprovado = ocorrencias.stream().noneMatch(item -> "ERRO".equals(item.nivel()));
        auditoriaService.registrar(
                "ATUALIZACAO_PREFLIGHT_EXECUTADO",
                "ATUALIZACAO",
                null,
                Map.of(
                        "versaoDestinoInformada", versaoDestino != null,
                        "quantidadeArtefatos", artefatos.size(),
                        "aprovado", aprovado
                )
        );

        return new AtualizacaoPreflightResponse(
                aprovado ? "APROVADO" : "REPROVADO",
                versaoAtual,
                versaoDestino,
                versaoMinima,
                criadoEm,
                artefatos.size(),
                List.copyOf(artefatos),
                List.copyOf(ocorrencias)
        );
    }

    public byte[] modelo() {
        String json = """
                {
                  "schemaVersion": "1.0",
                  "targetVersion": "0.6.0",
                  "minimumSourceVersion": "0.5.1",
                  "createdAt": "2026-08-11T12:00:00Z",
                  "artifacts": [
                    {
                      "component": "BACKEND",
                      "fileName": "contabilidade-backend-0.6.0.jar",
                      "sizeBytes": 12345678,
                      "sha256": "0000000000000000000000000000000000000000000000000000000000000000"
                    },
                    {
                      "component": "FRONTEND",
                      "fileName": "contabilidade-frontend-0.6.0.tar.gz",
                      "sizeBytes": 2345678,
                      "sha256": "0000000000000000000000000000000000000000000000000000000000000000"
                    },
                    {
                      "component": "WORKER",
                      "fileName": "contabilidade-worker-0.6.0.tar.gz",
                      "sizeBytes": 3456789,
                      "sha256": "0000000000000000000000000000000000000000000000000000000000000000"
                    }
                  ]
                }
                """;
        return json.getBytes(StandardCharsets.UTF_8);
    }

    private List<AtualizacaoPreflightResponse.Artefato> validarArtefatos(
            JsonNode node,
            List<AtualizacaoPreflightResponse.Ocorrencia> ocorrencias
    ) {
        List<AtualizacaoPreflightResponse.Artefato> resultado = new ArrayList<>();
        if (node == null || !node.isArray() || node.isEmpty()) {
            erro(ocorrencias, "ARTEFATOS_AUSENTES", "Informe ao menos um artefato.");
            return resultado;
        }
        if (node.size() > 20) {
            erro(ocorrencias, "ARTEFATOS_EXCEDIDOS", "O manifesto aceita no máximo vinte artefatos.");
        }
        Set<String> nomes = new HashSet<>();
        int limite = Math.min(node.size(), 20);
        for (int indice = 0; indice < limite; indice++) {
            JsonNode item = node.get(indice);
            if (!item.isObject()) {
                erro(ocorrencias, "ARTEFATO_INVALIDO", "O artefato " + (indice + 1) + " deve ser um objeto JSON.");
                continue;
            }
            String componente = texto(item, "component");
            componente = componente == null ? "INVALIDO" : componente.trim().toUpperCase(Locale.ROOT);
            String nomeArquivo = texto(item, "fileName");
            long tamanho = item.path("sizeBytes").canConvertToLong() ? item.path("sizeBytes").asLong() : -1;
            String hash = texto(item, "sha256");

            boolean componenteValido = COMPONENTE.matcher(componente).matches();
            boolean nomeSeguro = nomeArquivo != null
                    && NOME_ARQUIVO.matcher(nomeArquivo).matches()
                    && !nomeArquivo.contains("..")
                    && !nomeArquivo.contains("/")
                    && !nomeArquivo.contains("\\");
            boolean hashValido = hash != null && SHA256.matcher(hash).matches();

            if (!componenteValido) erro(ocorrencias, "COMPONENTE_INVALIDO", "O componente do artefato " + (indice + 1) + " é inválido.");
            if (!nomeSeguro) erro(ocorrencias, "NOME_ARQUIVO_INSEGURO", "O nome do artefato " + (indice + 1) + " é inválido ou contém caminho.");
            if (tamanho <= 0 || tamanho > TAMANHO_MAXIMO_ARTEFATO) {
                erro(ocorrencias, "TAMANHO_ARTEFATO_INVALIDO", "O tamanho do artefato " + (indice + 1) + " é inválido.");
            }
            if (!hashValido) erro(ocorrencias, "SHA256_INVALIDO", "O SHA-256 do artefato " + (indice + 1) + " deve possuir 64 caracteres hexadecimais.");
            if (nomeArquivo != null && !nomes.add(nomeArquivo.toLowerCase(Locale.ROOT))) {
                erro(ocorrencias, "NOME_ARTEFATO_DUPLICADO", "O manifesto possui nomes de artefato duplicados.");
            }
            resultado.add(new AtualizacaoPreflightResponse.Artefato(
                    componente,
                    nomeArquivo,
                    tamanho,
                    nomeSeguro,
                    hashValido
            ));
        }
        return resultado;
    }

    private SemVer versao(
            String valor,
            String codigo,
            List<AtualizacaoPreflightResponse.Ocorrencia> ocorrencias
    ) {
        if (valor == null) {
            erro(ocorrencias, codigo, "Uma versão obrigatória não foi informada.");
            return null;
        }
        Matcher matcher = VERSAO.matcher(valor.trim());
        if (!matcher.matches()) {
            erro(ocorrencias, codigo, "A versão deve seguir o formato major.minor.patch.");
            return null;
        }
        return new SemVer(
                Integer.parseInt(matcher.group(1)),
                Integer.parseInt(matcher.group(2)),
                Integer.parseInt(matcher.group(3))
        );
    }

    private Instant instant(JsonNode node, List<AtualizacaoPreflightResponse.Ocorrencia> ocorrencias) {
        if (node == null || node.isNull() || !node.isTextual() || node.asText().isBlank()) {
            aviso(ocorrencias, "DATA_CRIACAO_AUSENTE", "A data de criação do manifesto não foi informada.");
            return null;
        }
        try {
            return Instant.parse(node.asText().trim());
        } catch (RuntimeException exception) {
            erro(ocorrencias, "DATA_CRIACAO_INVALIDA", "A data de criação do manifesto deve estar em formato ISO-8601 UTC.");
            return null;
        }
    }

    private String texto(JsonNode node, String campo) {
        if (node == null || !node.isObject()) return null;
        JsonNode valor = node.get(campo);
        return valor != null && valor.isTextual() && !valor.asText().isBlank() ? valor.asText().trim() : null;
    }

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ExcecaoNegocio("MANIFESTO_ATUALIZACAO_VAZIO", "erros.manifestoAtualizacaoVazio", HttpStatus.BAD_REQUEST);
        }
        if (arquivo.getSize() > tamanhoMaximoManifesto) {
            throw new ExcecaoNegocio("MANIFESTO_ATUALIZACAO_GRANDE", "erros.manifestoAtualizacaoGrande", HttpStatus.PAYLOAD_TOO_LARGE);
        }
        String nome = arquivo.getOriginalFilename();
        if (nome != null && !nome.isBlank() && !nome.toLowerCase(Locale.ROOT).endsWith(".json")) {
            throw new ExcecaoNegocio("MANIFESTO_ATUALIZACAO_EXTENSAO", "erros.manifestoAtualizacaoExtensao", HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
    }

    private JsonNode lerJson(MultipartFile arquivo) {
        try {
            JsonNode raiz = objectMapper.readTree(arquivo.getInputStream());
            if (raiz == null || !raiz.isObject()) {
                throw new ExcecaoNegocio("MANIFESTO_ATUALIZACAO_INVALIDO", "erros.manifestoAtualizacaoInvalido", HttpStatus.BAD_REQUEST);
            }
            return raiz;
        } catch (IOException exception) {
            throw new ExcecaoNegocio(
                    "MANIFESTO_ATUALIZACAO_INVALIDO",
                    "erros.manifestoAtualizacaoInvalido",
                    HttpStatus.BAD_REQUEST,
                    exception
            );
        }
    }

    private void erro(List<AtualizacaoPreflightResponse.Ocorrencia> ocorrencias, String codigo, String mensagem) {
        ocorrencias.add(new AtualizacaoPreflightResponse.Ocorrencia("ERRO", codigo, mensagem));
    }

    private void aviso(List<AtualizacaoPreflightResponse.Ocorrencia> ocorrencias, String codigo, String mensagem) {
        ocorrencias.add(new AtualizacaoPreflightResponse.Ocorrencia("AVISO", codigo, mensagem));
    }

    private record SemVer(int major, int minor, int patch) implements Comparable<SemVer> {
        @Override
        public int compareTo(SemVer outro) {
            int comparacao = Integer.compare(major, outro.major);
            if (comparacao != 0) return comparacao;
            comparacao = Integer.compare(minor, outro.minor);
            return comparacao != 0 ? comparacao : Integer.compare(patch, outro.patch);
        }
    }
}
