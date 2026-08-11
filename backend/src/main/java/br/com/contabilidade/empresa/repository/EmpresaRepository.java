package br.com.contabilidade.empresa.repository;

import br.com.contabilidade.empresa.domain.Empresa;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmpresaRepository extends JpaRepository<Empresa, UUID> {

    @Query(value = """
            select distinct e
              from Empresa e
              left join e.estabelecimentos est
              left join e.tags tag
             where :termo is null
                or lower(e.razaoSocial) like lower(concat('%', :termo, '%'))
                or lower(coalesce(e.nomeFantasia, '')) like lower(concat('%', :termo, '%'))
                or lower(coalesce(e.grupo, '')) like lower(concat('%', :termo, '%'))
                or lower(tag) like lower(concat('%', :termo, '%'))
                or est.cnpj like concat('%', :termoNumerico, '%')
            """,
            countQuery = """
            select count(distinct e.id)
              from Empresa e
              left join e.estabelecimentos est
              left join e.tags tag
             where :termo is null
                or lower(e.razaoSocial) like lower(concat('%', :termo, '%'))
                or lower(coalesce(e.nomeFantasia, '')) like lower(concat('%', :termo, '%'))
                or lower(coalesce(e.grupo, '')) like lower(concat('%', :termo, '%'))
                or lower(tag) like lower(concat('%', :termo, '%'))
                or est.cnpj like concat('%', :termoNumerico, '%')
            """)
    Page<Empresa> buscar(@Param("termo") String termo,
                         @Param("termoNumerico") String termoNumerico,
                         Pageable pageable);

    @EntityGraph(attributePaths = {"estabelecimentos", "estabelecimentos.inscricoes", "tags"})
    @Query("select distinct e from Empresa e where e.id = :id")
    Optional<Empresa> buscarDetalhada(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"estabelecimentos", "estabelecimentos.inscricoes", "tags"})
    List<Empresa> findByAtivaTrueOrderByRazaoSocialAsc();

    @Query("select empresa.id from Empresa empresa where empresa.ativa = true order by empresa.id")
    List<UUID> buscarPrimeirosIdsAtivos(Pageable pageable);

    @Query("""
            select empresa.id
              from Empresa empresa
             where empresa.ativa = true
               and empresa.id > :cursor
             order by empresa.id
            """)
    List<UUID> buscarIdsAtivosApos(@Param("cursor") UUID cursor, Pageable pageable);

    long countByAtivaTrue();
}
