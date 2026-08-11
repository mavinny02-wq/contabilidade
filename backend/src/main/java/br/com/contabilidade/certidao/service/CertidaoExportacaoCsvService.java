package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.StatusCertidao;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import br.com.contabilidade.certidao.repository.CertidaoExportacaoLinha;
import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CertidaoExportacaoCsvService {

    private static final ZoneId ZONA_NEGOCIO = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter NOME_ARQUIVO = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
            .withZone(ZONA_NEGOCIO);
    private static final String CABECALHO = String.join(";",
            "ACOMPANHAMENTO_ID",
            "EMPRESA_ID",
            "EMPRESA",
            "CNPJ",
            "TIPO",
            "RESULTADO",
            "SITUACAO_CONSULTA",
            "STATUS",
            "NUMERO_CERTIDAO",
            "EMITIDA_EM",
            "VALIDA_ATE",
            "DOCUMENTO_ID",
            "ULTIMO_PROVEDOR",
            "MODO_AQUISICAO",
            "ULTIMA_EXECUCAO_ID",
            "OBSERVADA_EM",
            "PROXIMA_CONSULTA_EM",
            "ANTECEDENCIA_DIAS",
            "MENSAGEM_FONTE",
            "ATUALIZADO_EM"
    );

    private final CertidaoAcompanhamentoRepository repository;
    private final AuditoriaService auditoriaService;
    private final int tamanhoLote;
    private final int maximoLinhas;

    public CertidaoExportacaoCsvService(
            CertidaoAcompanhamentoRepository repository,
            AuditoriaService auditoriaService,
            @Value("${app.certificate.export-batch-size:500}") int tamanhoLote,
            @Value("${app.certificate.export-max-rows:10000}") int maximoLinhas
    ) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
        this.tamanhoLote = limitar(tamanhoLote, 10, 5_000);
        this.maximoLinhas = limitar(maximoLinhas, 1, 100_000);
    }

    @Transactional
    public ExportacaoCsv exportar(
            UUID empresaId,
            TipoCertidao tipo,
            StatusCertidao status
    ) {
        LocalDate hoje = LocalDate.now(ZONA_NEGOCIO);
        StringBuilder csv = new StringBuilder(Math.min(maximoLinhas, 2_000) * 512);
        csv.append('\uFEFF').append(CABECALHO).append("\r\n");

        UUID cursor = null;
        int quantidade = 0;
        while (true) {
            List<CertidaoExportacaoLinha> lote = cursor == null
                    ? repository.buscarPrimeirasLinhasExportacao(
                            empresaId,
                            tipo,
                            PageRequest.of(0, tamanhoLote)
                    )
                    : repository.buscarLinhasExportacaoApos(
                            empresaId,
                            tipo,
                            cursor,
                            PageRequest.of(0, tamanhoLote)
                    );

            if (lote.isEmpty()) break;

            for (CertidaoExportacaoLinha linha : lote) {
                CertidaoAcompanhamento certidao = linha.certidao();
                StatusCertidao statusAtual = certidao.statusExibicao(hoje);
                if (status != null && statusAtual != status) continue;

                quantidade++;
                if (quantidade > maximoLinhas) {
                    throw new ExcecaoNegocio(
                            "EXPORTACAO_CERTIDOES_LIMITE_EXCEDIDO",
                            "erros.exportacaoCertidoesLimiteExcedido",
                            HttpStatus.PAYLOAD_TOO_LARGE
                    );
                }

                csv.append(linhaCsv(linha, statusAtual)).append("\r\n");
            }

            cursor = lote.get(lote.size() - 1).certidao().getId();
            if (lote.size() < tamanhoLote) break;
        }

        registrarAuditoria(empresaId, tipo, status, quantidade);
        String nome = "certidoes-" + NOME_ARQUIVO.format(Instant.now()) + ".csv";
        return new ExportacaoCsv(csv.toString().getBytes(StandardCharsets.UTF_8), nome, quantidade);
    }

    private String linhaCsv(CertidaoExportacaoLinha linha, StatusCertidao status) {
        CertidaoAcompanhamento item = linha.certidao();
        return String.join(";",
                celula(item.getId()),
                celula(item.getEmpresaId()),
                celula(linha.razaoSocial()),
                celula(formatarCnpj(linha.cnpj())),
                celula(item.getTipo()),
                celula(item.getResultado()),
                celula(item.getSituacaoConsulta()),
                celula(status),
                celula(item.getNumeroCertidao()),
                celula(item.getEmitidaEm()),
                celula(item.getValidaAte()),
                celula(item.getDocumentoId()),
                celula(item.getUltimoProvedorCodigo()),
                celula(item.getUltimoModoAquisicao()),
                celula(item.getUltimaExecucaoId()),
                celula(item.getObservadaEm()),
                celula(item.getProximaConsultaEm()),
                celula(item.getAntecedenciaDias()),
                celula(item.getMensagemFonte()),
                celula(item.getAtualizadoEm())
        );
    }

    private String celula(Object valor) {
        if (valor == null) return "\"\"";
        String texto = String.valueOf(valor)
                .replace("\r\n", " ")
                .replace('\r', ' ')
                .replace('\n', ' ');
        String semEspacosIniciais = texto.stripLeading();
        if (!semEspacosIniciais.isEmpty() && perigosoParaPlanilha(semEspacosIniciais.charAt(0))) {
            texto = "'" + texto;
        }
        return "\"" + texto.replace("\"", "\"\"") + "\"";
    }

    private boolean perigosoParaPlanilha(char primeiro) {
        return primeiro == '='
                || primeiro == '+'
                || primeiro == '-'
                || primeiro == '@'
                || primeiro == '\t';
    }

    private String formatarCnpj(String cnpj) {
        if (cnpj == null || !cnpj.matches("\\d{14}")) return cnpj;
        return cnpj.replaceFirst(
                "^(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{2})$",
                "$1.$2.$3/$4-$5"
        );
    }

    private void registrarAuditoria(
            UUID empresaId,
            TipoCertidao tipo,
            StatusCertidao status,
            int quantidade
    ) {
        Map<String, Object> detalhes = new LinkedHashMap<>();
        detalhes.put("quantidade", quantidade);
        if (empresaId != null) detalhes.put("empresaId", empresaId);
        if (tipo != null) detalhes.put("tipo", tipo.name());
        if (status != null) detalhes.put("status", status.name());
        auditoriaService.registrar("CERTIDOES_EXPORTADAS_CSV", "CERTIDAO_ACOMPANHAMENTO", null, detalhes);
    }

    private int limitar(int valor, int minimo, int maximo) {
        return Math.min(Math.max(valor, minimo), maximo);
    }

    public record ExportacaoCsv(byte[] conteudo, String nomeArquivo, int quantidade) {
        public ExportacaoCsv {
            conteudo = conteudo.clone();
        }

        @Override
        public byte[] conteudo() {
            return conteudo.clone();
        }
    }
}
