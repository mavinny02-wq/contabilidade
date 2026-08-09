package br.com.contabilidade.common.notification;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {

    Page<Notificacao> findAllByOrderByCriadoEmDesc(Pageable pageable);

    long countByLidaEmIsNull();
}
