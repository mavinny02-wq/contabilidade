package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.StatusCertidao;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CertidaoDashboardGerencialService {

    private static final ZoneId ZONA_NEGOCIO = ZoneId.of("America/Sao_Paulo");

    private final CertidaoAcompanhamentoRepository repository;
    private final int tamanhoLote;
    private final int maximoAnalisadas;

    public CertidaoDashboardGerencialService(
            CertidaoAcompanhamentoRepository repository,
            @Value("${app.certificate.dashboard-batch-size:1000}") int tamanhoLote,
            @Value("${app.certificate.dashboard-max-rows:100000}") int maximoAnalisadas
    ) {
        this.repository = repository;
        this.tamanhoLote = limitar(tamanhoLote, 10, 5_000);
        this.maximoAnalisadas = limitar(maximoAnalisadas, 1, 500_000);
    }

    @Transactional(readOnly = true)
    public ResumoGerencial resumir() {
        Instant observadoEm = Instant.now();
        LocalDate hoje = LocalDate.now(ZONA_NEGOCIO);
        LocalDate limiteTrintaDias = hoje.plusDays(30);
        long totalRegistradas = repository.countByAtivaTrue();

        Map<StatusCertidao, Long> porStatus = mapaZerado(StatusCertidao.class);
        Map<TipoCertidao, Long> porTipo = mapaZerado(TipoCertidao.class);
        UUID cursor = null;
        int analisadas = 0;
        long vencemEmTrintaDias = 0;
        long semValidade = 0;
        Instant ultimaAtualizacao = null;

        while (analisadas < maximoAnalisadas) {
            int limite = Math.min(tamanhoLote, maximoAnalisadas - analisadas);
            List<UUID> ids = cursor == null
                    ? repository.buscarPrimeirosIdsAtivos(PageRequest.of(0, limite))
                    : repository.buscarIdsAtivosApos(cursor, PageRequest.of(0, limite));
            if (ids.isEmpty()) break;

            for (CertidaoAcompanhamento certidao : repository.findAllById(ids)) {
                StatusCertidao status = certidao.statusExibicao(hoje);
                porStatus.compute(status, (_chave, atual) -> atual == null ? 1L : atual + 1);
                porTipo.compute(certidao.getTipo(), (_chave, atual) -> atual == null ? 1L : atual + 1);
                analisadas++;

                if (certidao.getValidaAte() == null) {
                    semValidade++;
                } else if (!certidao.getValidaAte().isBefore(hoje)
                        && !certidao.getValidaAte().isAfter(limiteTrintaDias)) {
                    vencemEmTrintaDias++;
                }

                Instant atualizadaEm = certidao.getAtualizadoEm();
                if (atualizadaEm != null
                        && (ultimaAtualizacao == null || atualizadaEm.isAfter(ultimaAtualizacao))) {
                    ultimaAtualizacao = atualizadaEm;
                }
            }

            cursor = ids.get(ids.size() - 1);
            if (ids.size() < limite) break;
        }

        long regulares = porStatus.get(StatusCertidao.REGULAR);
        long atencao = somar(
                porStatus,
                StatusCertidao.POSITIVA_COM_EFEITO_NEGATIVA,
                StatusCertidao.IRREGULAR,
                StatusCertidao.INCOMPLETA,
                StatusCertidao.FONTE_INDISPONIVEL,
                StatusCertidao.ACAO_MANUAL_NECESSARIA,
                StatusCertidao.PROXIMA_DO_VENCIMENTO,
                StatusCertidao.VENCIDA,
                StatusCertidao.FALHA
        );
        long emAndamento = somar(
                porStatus,
                StatusCertidao.AGENDADA,
                StatusCertidao.EM_PROCESSAMENTO
        );

        return new ResumoGerencial(
                observadoEm,
                totalRegistradas,
                analisadas,
                analisadas < totalRegistradas,
                regulares,
                atencao,
                emAndamento,
                porStatus,
                porTipo,
                vencemEmTrintaDias,
                semValidade,
                ultimaAtualizacao
        );
    }

    private long somar(Map<StatusCertidao, Long> mapa, StatusCertidao... status) {
        long total = 0;
        for (StatusCertidao item : status) total += mapa.getOrDefault(item, 0L);
        return total;
    }

    private <E extends Enum<E>> Map<E, Long> mapaZerado(Class<E> tipo) {
        Map<E, Long> mapa = new EnumMap<>(tipo);
        for (E valor : tipo.getEnumConstants()) mapa.put(valor, 0L);
        return mapa;
    }

    private int limitar(int valor, int minimo, int maximo) {
        return Math.min(Math.max(valor, minimo), maximo);
    }

    public record ResumoGerencial(
            Instant observadoEm,
            long totalRegistradas,
            long totalAnalisadas,
            boolean parcial,
            long regulares,
            long atencao,
            long emAndamento,
            Map<StatusCertidao, Long> porStatus,
            Map<TipoCertidao, Long> porTipo,
            long vencemEmTrintaDias,
            long semValidade,
            Instant ultimaAtualizacao
    ) {
        public ResumoGerencial {
            porStatus = Map.copyOf(porStatus);
            porTipo = Map.copyOf(porTipo);
        }
    }
}
