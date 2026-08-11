package br.com.contabilidade.certidao.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CertidaoScheduler {

    private static final Logger log = LoggerFactory.getLogger(CertidaoScheduler.class);
    private final CertidaoSchedulerBatchService batchService;

    public CertidaoScheduler(CertidaoSchedulerBatchService batchService) {
        this.batchService = batchService;
    }

    @Scheduled(cron = "${app.certificate.scheduler-cron:0 15 6 * * *}", zone = "America/Sao_Paulo")
    public void agendarConsultas() {
        CertidaoSchedulerBatchService.ResultadoLote resultado = batchService.agendarVencidas();
        if (resultado.candidatos() > 0 || resultado.empresasInicializadas() > 0) {
            log.info(
                    "Lote de certidões processado: empresasInicializadas={}, candidatos={}, agendados={}, ignorados={}",
                    resultado.empresasInicializadas(),
                    resultado.candidatos(),
                    resultado.processados(),
                    resultado.ignorados()
            );
        }
    }

    @Scheduled(cron = "${app.certificate.alert-cron:0 30 7 * * *}", zone = "America/Sao_Paulo")
    public void emitirAlertas() {
        CertidaoSchedulerBatchService.ResultadoLote resultado = batchService.emitirAlertas();
        if (resultado.candidatos() > 0 || resultado.empresasInicializadas() > 0) {
            log.info(
                    "Lote de alertas de certidões processado: empresasInicializadas={}, candidatos={}, alertasEmitidos={}",
                    resultado.empresasInicializadas(),
                    resultado.candidatos(),
                    resultado.processados()
            );
        }
    }
}
