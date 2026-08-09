package br.com.contabilidade.common.integration;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PoliticaAquisicaoRepository extends JpaRepository<PoliticaAquisicao, UUID> {
    Optional<PoliticaAquisicao> findByOperacao(String operacao);
}
