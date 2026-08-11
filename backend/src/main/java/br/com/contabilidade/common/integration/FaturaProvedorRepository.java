package br.com.contabilidade.common.integration;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaturaProvedorRepository extends JpaRepository<FaturaProvedor, UUID> {

    Optional<FaturaProvedor> findByProvedorCodigoAndCompetenciaInicioAndCompetenciaFimAndMoeda(
            String provedorCodigo,
            LocalDate competenciaInicio,
            LocalDate competenciaFim,
            String moeda
    );

    Page<FaturaProvedor> findAllByOrderByCompetenciaInicioDescProvedorCodigoAsc(Pageable pageable);

    Page<FaturaProvedor> findByProvedorCodigoOrderByCompetenciaInicioDesc(
            String provedorCodigo,
            Pageable pageable
    );
}
