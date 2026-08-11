package br.com.contabilidade.certidao.repository;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CertidaoAcompanhamentoRepository extends JpaRepository<CertidaoAcompanhamento, UUID> {
    Optional<CertidaoAcompanhamento> findByEstabelecimentoIdAndTipo(UUID estabelecimentoId, TipoCertidao tipo);
    List<CertidaoAcompanhamento> findByEstabelecimentoId(UUID estabelecimentoId);
    List<CertidaoAcompanhamento> findByEmpresaIdAndAtivaTrueOrderByEstabelecimentoIdAscTipoAsc(UUID empresaId);
    List<CertidaoAcompanhamento> findByAtivaTrueOrderByEmpresaIdAscEstabelecimentoIdAscTipoAsc();
    List<CertidaoAcompanhamento> findByAtivaTrueAndProximaConsultaEmBefore(Instant agora);
    long countByAtivaTrue();

    @Query("""
            select certidao.id
              from CertidaoAcompanhamento certidao
             where certidao.ativa = true
               and certidao.proximaConsultaEm < :agora
             order by certidao.id
            """)
    List<UUID> buscarPrimeirosIdsParaAgendamento(@Param("agora") Instant agora, Pageable pageable);

    @Query("""
            select certidao.id
              from CertidaoAcompanhamento certidao
             where certidao.ativa = true
               and certidao.proximaConsultaEm < :agora
               and certidao.id > :cursor
             order by certidao.id
            """)
    List<UUID> buscarIdsParaAgendamentoApos(@Param("agora") Instant agora,
                                            @Param("cursor") UUID cursor,
                                            Pageable pageable);

    @Query("""
            select certidao.id
              from CertidaoAcompanhamento certidao
             where certidao.ativa = true
             order by certidao.id
            """)
    List<UUID> buscarPrimeirosIdsAtivos(Pageable pageable);

    @Query("""
            select certidao.id
              from CertidaoAcompanhamento certidao
             where certidao.ativa = true
               and certidao.id > :cursor
             order by certidao.id
            """)
    List<UUID> buscarIdsAtivosApos(@Param("cursor") UUID cursor, Pageable pageable);
}
