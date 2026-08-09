package br.com.contabilidade.common.execution;

import br.com.contabilidade.common.intervention.IntervencaoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExecucaoMaintenanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(ExecucaoMaintenanceScheduler.class);
    private final ExecucaoFilaService filaService;
    private final IntervencaoService intervencaoService;

    public ExecucaoMaintenanceScheduler(ExecucaoFilaService filaService, IntervencaoService intervencaoService) {
        this.filaService = filaService;
        this.intervencaoService = intervencaoService;
    }

    @Scheduled(fixedDelayString = "${app.execution.recovery-interval-ms:60000}")
    public void manterFila() {
        int leases = filaService.recuperarLeasesExpirados();
        int intervencoes = intervencaoService.expirarPendentes();
        if (leases > 0 || intervencoes > 0) {
            log.info("Manutenção da fila: leasesRecuperados={}, intervencoesExpiradas={}", leases, intervencoes);
        }
    }
}
