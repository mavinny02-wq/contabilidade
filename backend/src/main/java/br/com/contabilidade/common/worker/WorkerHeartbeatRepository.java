package br.com.contabilidade.common.worker;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkerHeartbeatRepository extends JpaRepository<WorkerHeartbeat, UUID> {

    Optional<WorkerHeartbeat> findByWorkerId(String workerId);

    Page<WorkerHeartbeat> findAllByOrderByObservadoEmDesc(Pageable pageable);
}
