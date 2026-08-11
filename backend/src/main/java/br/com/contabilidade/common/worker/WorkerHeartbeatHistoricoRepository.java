package br.com.contabilidade.common.worker;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkerHeartbeatHistoricoRepository extends JpaRepository<WorkerHeartbeatHistorico, UUID> {

    Optional<WorkerHeartbeatHistorico> findFirstByWorkerIdOrderByObservadoEmDesc(String workerId);

    Page<WorkerHeartbeatHistorico> findByObservadoEmGreaterThanEqualAndObservadoEmLessThanOrderByObservadoEmDesc(
            Instant inicio,
            Instant fim,
            Pageable pageable
    );

    Page<WorkerHeartbeatHistorico> findByWorkerIdAndObservadoEmGreaterThanEqualAndObservadoEmLessThanOrderByObservadoEmDesc(
            String workerId,
            Instant inicio,
            Instant fim,
            Pageable pageable
    );
}
