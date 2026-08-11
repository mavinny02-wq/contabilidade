package br.com.contabilidade.certidao.repository;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import java.time.Instant;
import java.time.LocalDate;
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

    @Query("""
            select count(certidao.id)
              from CertidaoAcompanhamento certidao
             where certidao.ativa = true
               and certidao.validaAte is not null
               and certidao.validaAte between :inicio and :fim
               and (:empresaId is null or certidao.empresaId = :empresaId)
            """)
    long contarAgendaVencimentos(
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim,
            @Param("empresaId") UUID empresaId
    );

    @Query("""
            select new br.com.contabilidade.certidao.repository.CertidaoAgendaLinha(
                    certidao,
                    estabelecimento.cnpj,
                    empresa.razaoSocial
            )
              from CertidaoAcompanhamento certidao,
                   Estabelecimento estabelecimento,
                   Empresa empresa
             where certidao.ativa = true
               and certidao.validaAte is not null
               and certidao.validaAte between :inicio and :fim
               and estabelecimento.id = certidao.estabelecimentoId
               and empresa.id = certidao.empresaId
               and (:empresaId is null or certidao.empresaId = :empresaId)
             order by certidao.validaAte asc, empresa.razaoSocial asc, certidao.tipo asc, certidao.id asc
            """)
    List<CertidaoAgendaLinha> buscarAgendaVencimentos(
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim,
            @Param("empresaId") UUID empresaId,
            Pageable pageable
    );

    @Query("""
            select new br.com.contabilidade.certidao.repository.CertidaoExportacaoLinha(
                    certidao,
                    estabelecimento.cnpj,
                    empresa.razaoSocial
            )
              from CertidaoAcompanhamento certidao,
                   Estabelecimento estabelecimento,
                   Empresa empresa
             where certidao.ativa = true
               and estabelecimento.id = certidao.estabelecimentoId
               and empresa.id = certidao.empresaId
               and (:empresaId is null or certidao.empresaId = :empresaId)
               and (:tipo is null or certidao.tipo = :tipo)
             order by certidao.id
            """)
    List<CertidaoExportacaoLinha> buscarPrimeirasLinhasExportacao(
            @Param("empresaId") UUID empresaId,
            @Param("tipo") TipoCertidao tipo,
            Pageable pageable
    );

    @Query("""
            select new br.com.contabilidade.certidao.repository.CertidaoExportacaoLinha(
                    certidao,
                    estabelecimento.cnpj,
                    empresa.razaoSocial
            )
              from CertidaoAcompanhamento certidao,
                   Estabelecimento estabelecimento,
                   Empresa empresa
             where certidao.ativa = true
               and estabelecimento.id = certidao.estabelecimentoId
               and empresa.id = certidao.empresaId
               and (:empresaId is null or certidao.empresaId = :empresaId)
               and (:tipo is null or certidao.tipo = :tipo)
               and certidao.id > :cursor
             order by certidao.id
            """)
    List<CertidaoExportacaoLinha> buscarLinhasExportacaoApos(
            @Param("empresaId") UUID empresaId,
            @Param("tipo") TipoCertidao tipo,
            @Param("cursor") UUID cursor,
            Pageable pageable
    );
}
