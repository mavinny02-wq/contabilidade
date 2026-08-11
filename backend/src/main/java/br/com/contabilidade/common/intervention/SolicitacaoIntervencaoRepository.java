package br.com.contabilidade.common.intervention;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SolicitacaoIntervencaoRepository extends JpaRepository<SolicitacaoIntervencao, UUID> {
    Page<SolicitacaoIntervencao> findByStatusInOrderByCriadoEmDesc(Collection<StatusIntervencao> statuses,
                                                                   Pageable pageable);
    long countByStatusIn(Collection<StatusIntervencao> statuses);
    Optional<SolicitacaoIntervencao> findFirstByExecucaoIdAndStatusIn(UUID execucaoId,
                                                                      Collection<StatusIntervencao> statuses);
    java.util.List<SolicitacaoIntervencao> findByStatusInAndExpiraEmBefore(
            Collection<StatusIntervencao> statuses, Instant agora);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select intervencao from SolicitacaoIntervencao intervencao where intervencao.id = :id")
    Optional<SolicitacaoIntervencao> findByIdForUpdate(@Param("id") UUID id);
}
