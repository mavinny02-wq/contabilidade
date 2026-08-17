package br.com.contabilidade.common.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Exposes bounded aggregate operational signals; no business identifiers become labels. */
@Component
public class TechnicalSignalMetrics {

    private final JdbcTemplate jdbc;
    private final AtomicLong queueDepth = new AtomicLong();
    private final AtomicLong workerHeartbeatAgeSeconds = new AtomicLong();
    private final Counter expiredLeases;

    public TechnicalSignalMetrics(JdbcTemplate jdbc, MeterRegistry registry) {
        this.jdbc = jdbc;
        Gauge.builder("contabilidade.execution.queue.depth", queueDepth, AtomicLong::get)
                .description("Number of executions ready for acquisition")
                .register(registry);
        Gauge.builder("contabilidade.worker.heartbeat.age.seconds", workerHeartbeatAgeSeconds,
                        AtomicLong::get)
                .description("Age in seconds of the freshest worker heartbeat")
                .register(registry);
        expiredLeases = Counter.builder("contabilidade.execution.expired.leases")
                .description("Leases recovered after expiration")
                .register(registry);
    }

    @Scheduled(fixedDelayString = "${app.observability.signal-refresh-ms:30000}")
    public void refresh() {
        Long depth = jdbc.queryForObject("""
                select count(*) from execucoes_integracao
                 where status in ('NA_FILA', 'RETRY_AGENDADO')
                   and (proxima_tentativa_em is null or proxima_tentativa_em <= current_timestamp)
                """, Long.class);
        Long heartbeatAge = jdbc.queryForObject("""
                select coalesce(extract(epoch from current_timestamp - max(observado_em))::bigint, 0)
                  from worker_heartbeats
                """, Long.class);
        queueDepth.set(depth == null ? 0 : depth);
        workerHeartbeatAgeSeconds.set(heartbeatAge == null ? 0 : Math.max(0, heartbeatAge));
    }

    public void recordExpiredLeases(int count) {
        if (count > 0) expiredLeases.increment(count);
    }
}
