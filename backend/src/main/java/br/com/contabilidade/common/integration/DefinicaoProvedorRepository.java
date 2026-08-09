package br.com.contabilidade.common.integration;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DefinicaoProvedorRepository extends JpaRepository<DefinicaoProvedor, UUID> {

    Optional<DefinicaoProvedor> findByCodigo(String codigo);

    List<DefinicaoProvedor> findAllByOrderByPrioridadeAscNomeAsc();
}
