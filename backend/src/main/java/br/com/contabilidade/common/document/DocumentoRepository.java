package br.com.contabilidade.common.document;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentoRepository extends JpaRepository<Documento, UUID> {

    Page<Documento> findByEmpresaIdAndAtivoTrueOrderByCriadoEmDesc(UUID empresaId, Pageable pageable);

    Optional<Documento> findByIdAndAtivoTrue(UUID id);

    Optional<Documento> findByEmpresaIdAndHashSha256AndAtivoTrue(UUID empresaId, String hashSha256);

    long countByAtivoTrue();
}
