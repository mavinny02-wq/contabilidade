package br.com.contabilidade.common.intervention;

import java.util.Collection;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolicitacaoIntervencaoRepository extends JpaRepository<SolicitacaoIntervencao, UUID> {

    Page<SolicitacaoIntervencao> findByStatusInOrderByCriadoEmDesc(
            Collection<StatusIntervencao> statuses,
            Pageable pageable
    );

    long countByStatusIn(Collection<StatusIntervencao> statuses);
}
