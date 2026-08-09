package br.com.contabilidade.common.execution;

import java.util.Collection;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExecucaoIntegracaoRepository extends JpaRepository<ExecucaoIntegracao, UUID> {

    Page<ExecucaoIntegracao> findAllByOrderByCriadoEmDesc(Pageable pageable);

    long countByStatusIn(Collection<StatusExecucao> statuses);
}
