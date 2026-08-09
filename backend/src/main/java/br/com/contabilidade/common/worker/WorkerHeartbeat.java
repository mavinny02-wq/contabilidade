package br.com.contabilidade.common.worker;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "worker_heartbeats")
public class WorkerHeartbeat extends EntidadeBase {

    @Column(name = "worker_id", nullable = false, unique = true, length = 120)
    private String workerId;

    @Column(name = "worker_versao", nullable = false, length = 80)
    private String versaoWorker;

    @Column(name = "observado_em", nullable = false)
    private Instant observadoEm;

    @Column(nullable = false, length = 40)
    private String status;

    protected WorkerHeartbeat() {
    }

    public WorkerHeartbeat(String workerId, String versao, String status) {
        this.workerId = workerId;
        this.versaoWorker = versao;
        this.status = status;
        this.observadoEm = Instant.now();
    }

    public void atualizar(String versao, String status) {
        this.versaoWorker = versao;
        this.status = status;
        this.observadoEm = Instant.now();
    }

    public String getWorkerId() { return workerId; }
    public String getVersaoWorker() { return versaoWorker; }
    public Instant getObservadoEm() { return observadoEm; }
    public String getStatus() { return status; }
}
