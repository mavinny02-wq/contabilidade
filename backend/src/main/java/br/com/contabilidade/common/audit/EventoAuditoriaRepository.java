package br.com.contabilidade.common.audit;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventoAuditoriaRepository extends JpaRepository<EventoAuditoria, UUID> {

    Page<EventoAuditoria> findAllByOrderByCriadoEmDesc(Pageable pageable);
}
