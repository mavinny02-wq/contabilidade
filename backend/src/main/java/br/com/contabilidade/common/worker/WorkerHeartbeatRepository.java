package br.com.contabilidade.common.worker;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkerHeartbeatRepository extends JpaRepository<WorkerHeartbeat, UUID> {

    Optional<WorkerHeartbeat> findByWorkerId(String workerId);
}
