package br.com.contabilidade.empresa.repository;

import br.com.contabilidade.empresa.domain.Estabelecimento;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstabelecimentoRepository extends JpaRepository<Estabelecimento, UUID> {
    boolean existsByCnpj(String cnpj);
    Optional<Estabelecimento> findByCnpj(String cnpj);
}
