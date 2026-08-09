package br.com.contabilidade.certidao.repository;

import br.com.contabilidade.certidao.domain.HistoricoCertidao;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoricoCertidaoRepository extends JpaRepository<HistoricoCertidao, UUID> {
    Page<HistoricoCertidao> findByAcompanhamentoIdOrderByObservadaEmDesc(UUID acompanhamentoId,
                                                                         Pageable pageable);
}
