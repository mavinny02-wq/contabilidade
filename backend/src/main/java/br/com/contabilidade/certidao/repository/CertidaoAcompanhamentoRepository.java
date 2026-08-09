package br.com.contabilidade.certidao.repository;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertidaoAcompanhamentoRepository extends JpaRepository<CertidaoAcompanhamento, UUID> {
    Optional<CertidaoAcompanhamento> findByEstabelecimentoIdAndTipo(UUID estabelecimentoId, TipoCertidao tipo);
    List<CertidaoAcompanhamento> findByEmpresaIdAndAtivaTrueOrderByEstabelecimentoIdAscTipoAsc(UUID empresaId);
    List<CertidaoAcompanhamento> findByAtivaTrueOrderByEmpresaIdAscEstabelecimentoIdAscTipoAsc();
    List<CertidaoAcompanhamento> findByAtivaTrueAndProximaConsultaEmBefore(Instant agora);
    long countByAtivaTrue();
}
