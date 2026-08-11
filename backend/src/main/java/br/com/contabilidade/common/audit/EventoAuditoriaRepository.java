package br.com.contabilidade.common.audit;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EventoAuditoriaRepository extends JpaRepository<EventoAuditoria, UUID>,
        JpaSpecificationExecutor<EventoAuditoria> {

    Page<EventoAuditoria> findAllByOrderByCriadoEmDesc(Pageable pageable);
}
