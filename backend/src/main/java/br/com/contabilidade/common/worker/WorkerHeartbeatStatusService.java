package br.com.contabilidade.common.worker;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkerHeartbeatStatusService {

    private static final String SAUDAVEL = "SAUDAVEL";
    private static final String DEGRADADO = "DEGRADADO";
    private static final String INDISPONIVEL = "INDISPONIVEL";
    private static final String DESCONHECIDO = "DESCONHECIDO";

    private final WorkerHeartbeatRepository repository;
    private final long degradadoAposSegundos;
    private final long indisponivelAposSegundos;
    private final long toleranciaFuturoSegundos;
    private final int maximoExibido;

    public WorkerHeartbeatStatusService(
            WorkerHeartbeatRepository repository,
            @Value("${app.worker.heartbeat.degraded-after:PT90S}") Duration degradadoApos,
            @Value("${app.worker.heartbeat.unavailable-after:PT5M}") Duration indisponivelApos,
            @Value("${app.worker.heartbeat.future-tolerance:PT30S}") Duration toleranciaFuturo,
            @Value("${app.worker.heartbeat.max-listed:100}") int maximoExibido
    ) {
        this.repository = repository;
        this.degradadoAposSegundos = Math.max(5, degradadoApos.getSeconds());
        this.indisponivelAposSegundos = Math.max(
                this.degradadoAposSegundos + 1,
                indisponivelApos.getSeconds()
        );
        this.toleranciaFuturoSegundos = Math.max(0, toleranciaFuturo.getSeconds());
        this.maximoExibido = Math.min(Math.max(maximoExibido, 1), 1_000);
    }

    @Transactional(readOnly = true)
    public ResumoWorkers resumir(Instant agora) {
        Page<WorkerHeartbeat> pagina = repository.findAllByOrderByObservadoEmDesc(
                PageRequest.of(0, maximoExibido)
        );
        List<WorkerResumo> workers = pagina.getContent().stream()
                .map(item -> classificar(item, agora))
                .toList();

        String status;
        String motivoSeguro;
        if (workers.isEmpty()) {
            status = INDISPONIVEL;
            motivoSeguro = "SEM_HEARTBEAT_REGISTRADO";
        } else if (workers.stream().anyMatch(item -> SAUDAVEL.equals(item.status()))) {
            status = SAUDAVEL;
            motivoSeguro = null;
        } else if (workers.stream().anyMatch(item -> DEGRADADO.equals(item.status()))) {
            status = DEGRADADO;
            motivoSeguro = "NENHUM_WORKER_SAUDAVEL";
        } else {
            status = INDISPONIVEL;
            motivoSeguro = "TODOS_WORKERS_INDISPONIVEIS";
        }

        return new ResumoWorkers(
                status,
                motivoSeguro,
                workers,
                pagina.getTotalElements(),
                pagina.hasNext(),
                degradadoAposSegundos,
                indisponivelAposSegundos
        );
    }

    private WorkerResumo classificar(WorkerHeartbeat item, Instant agora) {
        Instant observadoEm = item.getObservadoEm();
        String statusReportado = normalizarStatus(item.getStatus());
        if (observadoEm == null) {
            return resumo(item, statusReportado, INDISPONIVEL, 0, "HEARTBEAT_SEM_DATA");
        }

        long idadeAssinada = Duration.between(observadoEm, agora).getSeconds();
        long idadeSegundos = Math.max(0, idadeAssinada);
        if (idadeAssinada < -toleranciaFuturoSegundos) {
            return resumo(
                    item,
                    statusReportado,
                    DEGRADADO,
                    idadeSegundos,
                    "HEARTBEAT_RELOGIO_DIVERGENTE"
            );
        }
        if (idadeSegundos >= indisponivelAposSegundos) {
            return resumo(
                    item,
                    statusReportado,
                    INDISPONIVEL,
                    idadeSegundos,
                    "HEARTBEAT_EXPIRADO"
            );
        }
        if (idadeSegundos >= degradadoAposSegundos) {
            return resumo(
                    item,
                    statusReportado,
                    DEGRADADO,
                    idadeSegundos,
                    "HEARTBEAT_ATRASADO"
            );
        }

        return switch (statusReportado) {
            case SAUDAVEL -> resumo(item, statusReportado, SAUDAVEL, idadeSegundos, null);
            case "INICIALIZANDO" -> resumo(
                    item,
                    statusReportado,
                    DEGRADADO,
                    idadeSegundos,
                    "WORKER_INICIALIZANDO"
            );
            case DEGRADADO -> resumo(
                    item,
                    statusReportado,
                    DEGRADADO,
                    idadeSegundos,
                    "STATUS_REPORTADO_DEGRADADO"
            );
            case INDISPONIVEL -> resumo(
                    item,
                    statusReportado,
                    INDISPONIVEL,
                    idadeSegundos,
                    "STATUS_REPORTADO_INDISPONIVEL"
            );
            default -> resumo(
                    item,
                    statusReportado,
                    DEGRADADO,
                    idadeSegundos,
                    "STATUS_REPORTADO_DESCONHECIDO"
            );
        };
    }

    private WorkerResumo resumo(
            WorkerHeartbeat item,
            String statusReportado,
            String status,
            long idadeSegundos,
            String motivoSeguro
    ) {
        return new WorkerResumo(
                item.getWorkerId(),
                item.getVersaoWorker(),
                statusReportado,
                status,
                item.getObservadoEm(),
                idadeSegundos,
                motivoSeguro
        );
    }

    private String normalizarStatus(String status) {
        if (status == null || status.isBlank()) return DESCONHECIDO;
        String normalizado = status.trim().toUpperCase(Locale.ROOT);
        return switch (normalizado) {
            case SAUDAVEL, DEGRADADO, INDISPONIVEL, "INICIALIZANDO" -> normalizado;
            default -> DESCONHECIDO;
        };
    }

    public record ResumoWorkers(
            String status,
            String motivoSeguro,
            List<WorkerResumo> workers,
            long totalRegistrados,
            boolean listaLimitada,
            long degradadoAposSegundos,
            long indisponivelAposSegundos
    ) {
    }

    public record WorkerResumo(
            String workerId,
            String versao,
            String statusReportado,
            String status,
            Instant ultimoHeartbeatEm,
            long idadeSegundos,
            String motivoSeguro
    ) {
    }
}
