package br.com.contabilidade.common.worker;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkerHeartbeatHistoricoService {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    private final WorkerHeartbeatHistoricoRepository repository;
    private final NamedParameterJdbcTemplate jdbc;
    private final Duration intervaloAmostra;
    private final int maximoItens;

    public WorkerHeartbeatHistoricoService(
            WorkerHeartbeatHistoricoRepository repository,
            NamedParameterJdbcTemplate jdbc,
            @Value("${app.worker.heartbeat.history-sample-interval:PT5M}") Duration intervaloAmostra,
            @Value("${app.worker.heartbeat.history-max-rows:5000}") int maximoItens
    ) {
        this.repository = repository;
        this.jdbc = jdbc;
        this.intervaloAmostra = intervaloAmostra.isNegative() || intervaloAmostra.isZero()
                ? Duration.ofMinutes(5)
                : intervaloAmostra;
        this.maximoItens = Math.min(Math.max(maximoItens, 100), 50_000);
    }

    @Transactional
    public void registrarSeNecessario(String workerId, String versao, String status) {
        Instant agora = Instant.now();
        String worker = workerId.trim();
        String versaoNormalizada = versao.trim();
        String statusNormalizado = normalizarStatus(status);

        boolean registrar = repository.findFirstByWorkerIdOrderByObservadoEmDesc(worker)
                .map(ultimo -> mudou(ultimo, versaoNormalizada, statusNormalizado)
                        || Duration.between(ultimo.getObservadoEm(), agora).compareTo(intervaloAmostra) >= 0)
                .orElse(true);
        if (registrar) {
            repository.save(new WorkerHeartbeatHistorico(worker, versaoNormalizada, statusNormalizado, agora));
        }
    }

    @Transactional(readOnly = true)
    public WorkerHeartbeatHistoricoResponse consultar(
            LocalDate inicioInformado,
            LocalDate fimInformado,
            String workerId
    ) {
        LocalDate hoje = LocalDate.now(FUSO);
        LocalDate inicio = inicioInformado == null ? hoje.minusDays(7) : inicioInformado;
        LocalDate fim = fimInformado == null ? hoje : fimInformado;
        validarPeriodo(inicio, fim);

        String worker = workerId == null || workerId.isBlank() ? null : workerId.trim();
        Instant inicioInstant = inicio.atStartOfDay(FUSO).toInstant();
        Instant fimExclusivo = fim.plusDays(1).atStartOfDay(FUSO).toInstant();
        PageRequest pageable = PageRequest.of(0, maximoItens);
        Page<WorkerHeartbeatHistorico> pagina = worker == null
                ? repository.findByObservadoEmGreaterThanEqualAndObservadoEmLessThanOrderByObservadoEmDesc(
                        inicioInstant,
                        fimExclusivo,
                        pageable
                )
                : repository.findByWorkerIdAndObservadoEmGreaterThanEqualAndObservadoEmLessThanOrderByObservadoEmDesc(
                        worker,
                        inicioInstant,
                        fimExclusivo,
                        pageable
                );

        Contagens contagens = contar(inicioInstant, fimExclusivo, worker);
        return new WorkerHeartbeatHistoricoResponse(
                inicio,
                fim,
                worker,
                contagens.total(),
                contagens.saudavel(),
                contagens.degradado(),
                contagens.indisponivel(),
                contagens.inicializando(),
                contagens.desconhecido(),
                pagina.hasNext(),
                pagina.getContent().stream()
                        .map(item -> new WorkerHeartbeatHistoricoResponse.Item(
                                item.getId(),
                                item.getWorkerId(),
                                item.getVersaoWorker(),
                                item.getStatus(),
                                item.getObservadoEm()
                        ))
                        .toList()
        );
    }

    private Contagens contar(Instant inicio, Instant fim, String workerId) {
        String filtroWorker = workerId == null ? "" : " AND worker_id = :workerId";
        String sql = """
                SELECT COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE UPPER(status) = 'SAUDAVEL') AS saudavel,
                       COUNT(*) FILTER (WHERE UPPER(status) = 'DEGRADADO') AS degradado,
                       COUNT(*) FILTER (WHERE UPPER(status) = 'INDISPONIVEL') AS indisponivel,
                       COUNT(*) FILTER (WHERE UPPER(status) = 'INICIALIZANDO') AS inicializando,
                       COUNT(*) FILTER (
                           WHERE UPPER(status) NOT IN ('SAUDAVEL', 'DEGRADADO', 'INDISPONIVEL', 'INICIALIZANDO')
                       ) AS desconhecido
                  FROM worker_heartbeat_historico
                 WHERE observado_em >= :inicio
                   AND observado_em < :fim
                """ + filtroWorker;
        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("inicio", Timestamp.from(inicio))
                .addValue("fim", Timestamp.from(fim));
        if (workerId != null) parametros.addValue("workerId", workerId);
        return jdbc.queryForObject(sql, parametros, (rs, rowNum) -> mapearContagens(rs));
    }

    private Contagens mapearContagens(ResultSet rs) throws SQLException {
        return new Contagens(
                rs.getLong("total"),
                rs.getLong("saudavel"),
                rs.getLong("degradado"),
                rs.getLong("indisponivel"),
                rs.getLong("inicializando"),
                rs.getLong("desconhecido")
        );
    }

    private boolean mudou(WorkerHeartbeatHistorico ultimo, String versao, String status) {
        return !ultimo.getVersaoWorker().equals(versao) || !ultimo.getStatus().equals(status);
    }

    private String normalizarStatus(String status) {
        if (status == null || status.isBlank()) return "DESCONHECIDO";
        String normalizado = status.trim().toUpperCase(Locale.ROOT);
        return switch (normalizado) {
            case "SAUDAVEL", "DEGRADADO", "INDISPONIVEL", "INICIALIZANDO" -> normalizado;
            default -> "DESCONHECIDO";
        };
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (fim.isBefore(inicio)) {
            throw new ExcecaoNegocio(
                    "PERIODO_HEARTBEAT_INVALIDO",
                    "erros.periodoHistoricoHeartbeatInvalido",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (ChronoUnit.DAYS.between(inicio, fim) > 366) {
            throw new ExcecaoNegocio(
                    "PERIODO_HEARTBEAT_EXCEDIDO",
                    "erros.periodoHistoricoHeartbeatExcedido",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private record Contagens(
            long total,
            long saudavel,
            long degradado,
            long indisponivel,
            long inicializando,
            long desconhecido
    ) {
    }
}
