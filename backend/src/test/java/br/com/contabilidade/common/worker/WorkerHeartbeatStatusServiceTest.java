package br.com.contabilidade.common.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class WorkerHeartbeatStatusServiceTest {

    private static final Instant AGORA = Instant.parse("2026-08-17T12:00:00Z");

    @Mock
    private WorkerHeartbeatRepository repository;

    @Test
    void classificaAusenciaAtrasoExpiracaoESaudeSemConfundirAusenciaComRegularidade() {
        WorkerHeartbeatStatusService service = service();

        when(repository.findAllByOrderByObservadoEmDesc(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.resumir(AGORA))
                .extracting(WorkerHeartbeatStatusService.ResumoWorkers::status,
                        WorkerHeartbeatStatusService.ResumoWorkers::motivoSeguro)
                .containsExactly("INDISPONIVEL", "SEM_HEARTBEAT_REGISTRADO");

        validarWorker(service, heartbeat("atrasado", "SAUDAVEL", AGORA.minusSeconds(90)),
                "DEGRADADO", "HEARTBEAT_ATRASADO");
        validarWorker(service, heartbeat("expirado", "SAUDAVEL", AGORA.minusSeconds(300)),
                "INDISPONIVEL", "HEARTBEAT_EXPIRADO");
        validarWorker(service, heartbeat("saudavel", "SAUDAVEL", AGORA.minusSeconds(10)),
                "SAUDAVEL", null);
    }

    private void validarWorker(
            WorkerHeartbeatStatusService service,
            WorkerHeartbeat heartbeat,
            String status,
            String motivo
    ) {
        when(repository.findAllByOrderByObservadoEmDesc(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new PageImpl<>(List.of(heartbeat)));

        WorkerHeartbeatStatusService.WorkerResumo resumo = service.resumir(AGORA).workers().getFirst();

        assertThat(resumo.status()).isEqualTo(status);
        assertThat(resumo.motivoSeguro()).isEqualTo(motivo);
    }

    private WorkerHeartbeatStatusService service() {
        return new WorkerHeartbeatStatusService(
                repository,
                Duration.ofSeconds(60),
                Duration.ofSeconds(180),
                Duration.ofSeconds(30),
                100
        );
    }

    private WorkerHeartbeat heartbeat(String id, String status, Instant observadoEm) {
        WorkerHeartbeat heartbeat = new WorkerHeartbeat(id, "1.0.0", status);
        ReflectionTestUtils.setField(heartbeat, "observadoEm", observadoEm);
        return heartbeat;
    }
}
