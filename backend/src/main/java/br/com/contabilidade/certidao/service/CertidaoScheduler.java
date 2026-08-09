package br.com.contabilidade.certidao.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CertidaoScheduler {

    private static final Logger log = LoggerFactory.getLogger(CertidaoScheduler.class);
    private final CertidaoService service;

    public CertidaoScheduler(CertidaoService service) { this.service = service; }

    @Scheduled(cron = "${app.certificate.scheduler-cron:0 15 6 * * *}", zone = "America/Sao_Paulo")
    public void agendarConsultas() {
        int total = service.agendarVencidas();
        if (total > 0) log.info("Consultas de certidões agendadas: {}", total);
    }

    @Scheduled(cron = "${app.certificate.alert-cron:0 30 7 * * *}", zone = "America/Sao_Paulo")
    public void emitirAlertas() {
        int total = service.emitirAlertas();
        if (total > 0) log.info("Alertas de certidões emitidos: {}", total);
    }
}
