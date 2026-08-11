package br.com.contabilidade.common.audit;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditoriaConsultaExportacaoService {

    private static final ZoneId ZONA_NEGOCIO = ZoneId.of("America/Sao_Paulo");
    private static final Sort ORDEM = Sort.by(
            Sort.Order.desc("criadoEm"),
            Sort.Order.desc("id")
    );
    private static final DateTimeFormatter NOME_ARQUIVO = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
            .withZone(ZONA_NEGOCIO);
    private static final String CABECALHO = String.join(";",
            "EVENTO_ID",
            "CRIADO_EM",
            "ACAO",
            "RECURSO_TIPO",
            "RECURSO_ID",
            "ATOR",
            "CORRELATION_ID"
    );

    private final EventoAuditoriaRepository repository;
    private final AuditoriaService auditoriaService;
    private final int tamanhoLote;
    private final int maximoLinhas;

    public AuditoriaConsultaExportacaoService(
            EventoAuditoriaRepository repository,
            AuditoriaService auditoriaService,
            @Value("${app.audit.export-batch-size:500}") int tamanhoLote,
            @Value("${app.audit.export-max-rows:50000}") int maximoLinhas
    ) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
        this.tamanhoLote = limitar(tamanhoLote, 10, 5_000);
        this.maximoLinhas = limitar(maximoLinhas, 1, 200_000);
    }

    @Transactional(readOnly = true)
    public Page<EventoAuditoria> listar(
            int pagina,
            int tamanho,
            String acao,
            String recursoTipo,
            String ator,
            LocalDate inicio,
            LocalDate fim
    ) {
        validarPeriodo(inicio, fim);
        return repository.findAll(
                filtros(acao, recursoTipo, ator, inicio, fim, null),
                PageRequest.of(
                        Math.max(pagina, 0),
                        Math.min(Math.max(tamanho, 1), 100),
                        ORDEM
                )
        );
    }

    @Transactional
    public ExportacaoCsv exportar(
            String acao,
            String recursoTipo,
            String ator,
            LocalDate inicio,
            LocalDate fim
    ) {
        validarPeriodo(inicio, fim);
        Instant observadoEm = Instant.now();
        Specification<EventoAuditoria> filtros = filtros(
                acao,
                recursoTipo,
                ator,
                inicio,
                fim,
                observadoEm
        );
        long quantidade = repository.count(filtros);
        if (quantidade > maximoLinhas) {
            throw new ExcecaoNegocio(
                    "EXPORTACAO_AUDITORIA_LIMITE_EXCEDIDO",
                    "erros.exportacaoAuditoriaLimiteExcedido",
                    HttpStatus.PAYLOAD_TOO_LARGE
            );
        }

        StringBuilder csv = new StringBuilder((int) Math.min(quantidade, 2_000) * 256);
        csv.append('\uFEFF').append(CABECALHO).append("\r\n");
        int pagina = 0;
        int exportadas = 0;
        Page<EventoAuditoria> lote;
        do {
            lote = repository.findAll(
                    filtros,
                    PageRequest.of(pagina, tamanhoLote, ORDEM)
            );
            for (EventoAuditoria evento : lote.getContent()) {
                csv.append(linha(evento)).append("\r\n");
                exportadas++;
            }
            pagina++;
        } while (lote.hasNext());

        registrarAuditoria(acao, recursoTipo, ator, inicio, fim, exportadas);
        String nome = "auditoria-" + NOME_ARQUIVO.format(observadoEm) + ".csv";
        return new ExportacaoCsv(csv.toString().getBytes(StandardCharsets.UTF_8), nome, exportadas);
    }

    private Specification<EventoAuditoria> filtros(
            String acao,
            String recursoTipo,
            String ator,
            LocalDate inicio,
            LocalDate fim,
            Instant observadoAte
    ) {
        Specification<EventoAuditoria> spec = (_root, _query, criteria) -> criteria.conjunction();
        if (temTexto(acao)) spec = spec.and(contemIgnoreCase("acao", acao));
        if (temTexto(recursoTipo)) spec = spec.and(contemIgnoreCase("recursoTipo", recursoTipo));
        if (temTexto(ator)) spec = spec.and(contemIgnoreCase("ator", ator));
        if (inicio != null) {
            Instant inicioInstant = inicio.atStartOfDay(ZONA_NEGOCIO).toInstant();
            spec = spec.and((root, _query, criteria) ->
                    criteria.greaterThanOrEqualTo(root.get("criadoEm"), inicioInstant));
        }
        if (fim != null) {
            Instant fimExclusivo = fim.plusDays(1).atStartOfDay(ZONA_NEGOCIO).toInstant();
            spec = spec.and((root, _query, criteria) ->
                    criteria.lessThan(root.get("criadoEm"), fimExclusivo));
        }
        if (observadoAte != null) {
            spec = spec.and((root, _query, criteria) ->
                    criteria.lessThanOrEqualTo(root.get("criadoEm"), observadoAte));
        }
        return spec;
    }

    private Specification<EventoAuditoria> contemIgnoreCase(String campo, String valor) {
        String padrao = "%" + escaparLike(valor.trim().toLowerCase(Locale.ROOT)) + "%";
        return (root, _query, criteria) -> criteria.like(
                criteria.lower(root.get(campo)),
                padrao,
                '\\'
        );
    }

    private String linha(EventoAuditoria evento) {
        return String.join(";",
                celula(evento.getId()),
                celula(evento.getCriadoEm()),
                celula(evento.getAcao()),
                celula(evento.getRecursoTipo()),
                celula(evento.getRecursoId()),
                celula(evento.getAtor()),
                celula(evento.getCorrelationId())
        );
    }

    private String celula(Object valor) {
        if (valor == null) return "\"\"";
        String texto = String.valueOf(valor)
                .replace('\r', ' ')
                .replace('\n', ' ');
        String significativo = texto.stripLeading();
        if (!significativo.isEmpty() && perigosoParaPlanilha(significativo.charAt(0))) {
            texto = "'" + texto;
        }
        return "\"" + texto.replace("\"", "\"\"") + "\"";
    }

    private boolean perigosoParaPlanilha(char primeiro) {
        return primeiro == '=' || primeiro == '+' || primeiro == '-'
                || primeiro == '@' || primeiro == '\t';
    }

    private String escaparLike(String valor) {
        return valor.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (inicio != null && fim != null && fim.isBefore(inicio)) {
            throw new ExcecaoNegocio(
                    "PERIODO_AUDITORIA_INVALIDO",
                    "erros.periodoAuditoriaInvalido",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private void registrarAuditoria(
            String acao,
            String recursoTipo,
            String ator,
            LocalDate inicio,
            LocalDate fim,
            int quantidade
    ) {
        Map<String, Object> detalhes = new LinkedHashMap<>();
        detalhes.put("quantidade", quantidade);
        detalhes.put("filtroAcao", temTexto(acao));
        detalhes.put("filtroRecursoTipo", temTexto(recursoTipo));
        detalhes.put("filtroAtor", temTexto(ator));
        if (inicio != null) detalhes.put("inicio", inicio);
        if (fim != null) detalhes.put("fim", fim);
        auditoriaService.registrar("AUDITORIA_EXPORTADA_CSV", "EVENTO_AUDITORIA", null, detalhes);
    }

    private boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
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
