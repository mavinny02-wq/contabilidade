package br.com.contabilidade.common.document;

import br.com.contabilidade.common.audit.AuditoriaService;
import jakarta.persistence.criteria.Predicate;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentoRetencaoPreviewService {

    private static final ZoneId ZONA_NEGOCIO = ZoneId.of("America/Sao_Paulo");
    private static final Sort ORDEM = Sort.by(
            Sort.Order.asc("criadoEm"),
            Sort.Order.asc("id")
    );

    private final DocumentoRepository repository;
    private final AuditoriaService auditoriaService;
    private final int diasInativo;
    private final int diasAposValidade;
    private final int diasSemValidade;
    private final int maximoLinhas;

    public DocumentoRetencaoPreviewService(
            DocumentoRepository repository,
            AuditoriaService auditoriaService,
            @Value("${app.document.retention-inactive-days:365}") int diasInativo,
            @Value("${app.document.retention-expired-grace-days:365}") int diasAposValidade,
            @Value("${app.document.retention-no-expiry-days:3650}") int diasSemValidade,
            @Value("${app.document.retention-preview-max-rows:1000}") int maximoLinhas
    ) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
        this.diasInativo = limitar(diasInativo, 1, 36_500);
        this.diasAposValidade = limitar(diasAposValidade, 0, 36_500);
        this.diasSemValidade = limitar(diasSemValidade, 1, 36_500);
        this.maximoLinhas = limitar(maximoLinhas, 1, 10_000);
    }

    @Transactional(readOnly = true)
    public PreviewRetencao analisar(UUID empresaId) {
        Instant observadoEm = Instant.now();
        LocalDate hoje = LocalDate.now(ZONA_NEGOCIO);
        Instant limiteInativo = observadoEm.minus(Duration.ofDays(diasInativo));
        LocalDate limiteValidade = hoje.minusDays(diasAposValidade);
        Instant limiteSemValidade = observadoEm.minus(Duration.ofDays(diasSemValidade));
        Specification<Documento> specification = specification(
                empresaId,
                limiteInativo,
                limiteValidade,
                limiteSemValidade
        );

        Page<Documento> pagina = repository.findAll(
                specification,
                PageRequest.of(0, maximoLinhas, ORDEM)
        );
        List<ItemRetencao> itens = pagina.getContent().stream()
                .map(documento -> mapear(
                        documento,
                        limiteInativo,
                        limiteValidade,
                        limiteSemValidade
                ))
                .toList();

        Map<String, Long> porMotivo = new LinkedHashMap<>();
        long tamanhoTotal = 0;
        for (ItemRetencao item : itens) {
            tamanhoTotal = somarSeguro(tamanhoTotal, item.tamanhoBytes());
            for (String motivo : item.motivos()) {
                porMotivo.merge(motivo, 1L, Long::sum);
            }
        }

        PreviewRetencao resultado = new PreviewRetencao(
                observadoEm,
                empresaId,
                new CriteriosRetencao(
                        diasInativo,
                        diasAposValidade,
                        diasSemValidade,
                        maximoLinhas
                ),
                pagina.getTotalElements(),
                itens.size(),
                pagina.getTotalElements() > itens.size(),
                tamanhoTotal,
                porMotivo,
                itens
        );
        auditar(resultado);
        return resultado;
    }

    private Specification<Documento> specification(
            UUID empresaId,
            Instant limiteInativo,
            LocalDate limiteValidade,
            Instant limiteSemValidade
    ) {
        return (root, _query, criteria) -> {
            List<Predicate> escopo = new ArrayList<>();
            if (empresaId != null) {
                escopo.add(criteria.equal(root.<UUID>get("empresaId"), empresaId));
            }

            Predicate inativoAntigo = criteria.and(
                    criteria.isFalse(root.<Boolean>get("ativo")),
                    criteria.lessThanOrEqualTo(root.<Instant>get("atualizadoEm"), limiteInativo)
            );
            Predicate validadeExpirada = criteria.and(
                    criteria.isNotNull(root.<LocalDate>get("validoAte")),
                    criteria.lessThanOrEqualTo(root.<LocalDate>get("validoAte"), limiteValidade)
            );
            Predicate semValidadeAntigo = criteria.and(
                    criteria.isNull(root.<LocalDate>get("validoAte")),
                    criteria.lessThanOrEqualTo(root.<Instant>get("criadoEm"), limiteSemValidade)
            );
            escopo.add(criteria.or(inativoAntigo, validadeExpirada, semValidadeAntigo));
            return criteria.and(escopo.toArray(Predicate[]::new));
        };
    }

    private ItemRetencao mapear(
            Documento documento,
            Instant limiteInativo,
            LocalDate limiteValidade,
            Instant limiteSemValidade
    ) {
        List<String> motivos = new ArrayList<>();
        if (!documento.isAtivo()
                && documento.getAtualizadoEm() != null
                && !documento.getAtualizadoEm().isAfter(limiteInativo)) {
            motivos.add("INATIVO_HA_TEMPO");
        }
        if (documento.getValidoAte() != null
                && !documento.getValidoAte().isAfter(limiteValidade)) {
            motivos.add("VALIDADE_EXPIRADA_HA_TEMPO");
        }
        if (documento.getValidoAte() == null
                && documento.getCriadoEm() != null
                && !documento.getCriadoEm().isAfter(limiteSemValidade)) {
            motivos.add("SEM_VALIDADE_E_ANTIGO");
        }
        return new ItemRetencao(
                documento.getId(),
                documento.getEmpresaId(),
                documento.getTipo(),
                documento.getNomeOriginal(),
                documento.getMimeType(),
                documento.getTamanhoBytes(),
                documento.getOrigem().name(),
                documento.getEmitidoEm(),
                documento.getValidoAte(),
                documento.isAtivo(),
                documento.getCriadoEm(),
                documento.getAtualizadoEm(),
                motivos
        );
    }

    private void auditar(PreviewRetencao resultado) {
        Map<String, Object> detalhes = new LinkedHashMap<>();
        detalhes.put("empresaFiltrada", resultado.empresaId() != null);
        detalhes.put("totalCandidatos", resultado.totalCandidatos());
        detalhes.put("totalAnalisados", resultado.totalAnalisados());
        detalhes.put("resultadoParcial", resultado.parcial());
        detalhes.put("tamanhoAnalisadoBytes", resultado.tamanhoAnalisadoBytes());
        auditoriaService.registrarIsolado(
                "RETENCAO_DOCUMENTAL_PREVISUALIZADA",
                "DOCUMENTO",
                null,
                detalhes
        );
    }

    private int limitar(int valor, int minimo, int maximo) {
        return Math.min(Math.max(valor, minimo), maximo);
    }

    private long somarSeguro(long atual, long valor) {
        try {
            return Math.addExact(atual, valor);
        } catch (ArithmeticException exception) {
            return Long.MAX_VALUE;
        }
    }

    public record PreviewRetencao(
            Instant observadoEm,
            UUID empresaId,
            CriteriosRetencao criterios,
            long totalCandidatos,
            int totalAnalisados,
            boolean parcial,
            long tamanhoAnalisadoBytes,
            Map<String, Long> porMotivo,
            List<ItemRetencao> itens
    ) {
        public PreviewRetencao {
            porMotivo = Map.copyOf(porMotivo);
            itens = List.copyOf(itens);
        }
    }

    public record CriteriosRetencao(
            int diasInativo,
            int diasAposValidade,
            int diasSemValidade,
            int maximoLinhas
    ) {
    }

    public record ItemRetencao(
            UUID id,
            UUID empresaId,
            String tipo,
            String nomeOriginal,
            String mimeType,
            long tamanhoBytes,
            String origem,
            LocalDate emitidoEm,
            LocalDate validoAte,
            boolean ativo,
            Instant criadoEm,
            Instant atualizadoEm,
            List<String> motivos
    ) {
        public ItemRetencao {
            motivos = List.copyOf(motivos);
        }
    }
}
