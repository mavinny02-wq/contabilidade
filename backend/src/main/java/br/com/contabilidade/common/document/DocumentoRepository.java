package br.com.contabilidade.common.document;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentoRepository extends JpaRepository<Documento, UUID> {

    Page<Documento> findByEmpresaIdAndAtivoTrueOrderByCriadoEmDesc(UUID empresaId, Pageable pageable);

    Optional<Documento> findByIdAndAtivoTrue(UUID id);

    Optional<Documento> findByEmpresaIdAndHashSha256AndAtivoTrue(UUID empresaId, String hashSha256);

    long countByAtivoTrue();

    @Query("""
            select documento.referenciaStorage
              from Documento documento
             order by documento.referenciaStorage
            """)
    List<String> buscarPrimeirasReferenciasStorage(Pageable pageable);

    @Query("""
            select documento.referenciaStorage
              from Documento documento
             where documento.referenciaStorage > :cursor
             order by documento.referenciaStorage
            """)
    List<String> buscarReferenciasStorageApos(@Param("cursor") String cursor, Pageable pageable);
}
