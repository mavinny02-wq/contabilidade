package br.com.contabilidade.common.worker;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "worker_heartbeat_historico")
public class WorkerHeartbeatHistorico extends EntidadeBase {

    @Column(name = "worker_id", nullable = false, length = 120, updatable = false)
    private String workerId;

    @Column(name = "worker_versao", nullable = false, length = 80, updatable = false)
    private String versaoWorker;

    @Column(nullable = false, length = 40, updatable = false)
    private String status;

    @Column(name = "observado_em", nullable = false, updatable = false)
    private Instant observadoEm;

    protected WorkerHeartbeatHistorico() {
    }

    public WorkerHeartbeatHistorico(String workerId, String versaoWorker, String status, Instant observadoEm) {
        this.workerId = Objects.requireNonNull(workerId, "workerId").trim();
        this.versaoWorker = Objects.requireNonNull(versaoWorker, "versaoWorker").trim();
        this.status = Objects.requireNonNull(status, "status").trim().toUpperCase(java.util.Locale.ROOT);
        this.observadoEm = Objects.requireNonNull(observadoEm, "observadoEm");
    }

    public String getWorkerId() { return workerId; }
    public String getVersaoWorker() { return versaoWorker; }
    public String getStatus() { return status; }
    public Instant getObservadoEm() { return observadoEm; }
}
