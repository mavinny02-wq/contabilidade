package br.com.contabilidade.common.worker;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/interno/workers")
public class WorkerInternalController {

    private final WorkerHeartbeatRepository repository;
    private final String tokenEsperado;

    public WorkerInternalController(
            WorkerHeartbeatRepository repository,
            @Value("${app.worker.token}") String tokenEsperado
    ) {
        this.repository = repository;
        this.tokenEsperado = tokenEsperado;
    }

    @PostMapping("/heartbeat")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void heartbeat(
            @RequestHeader("X-Worker-Token") String token,
            @Valid @RequestBody HeartbeatRequest request
    ) {
        validarToken(token);
        repository.findByWorkerId(request.workerId())
                .ifPresentOrElse(
                        existente -> existente.atualizar(request.versao(), request.status()),
                        () -> repository.save(new WorkerHeartbeat(
                                request.workerId(),
                                request.versao(),
                                request.status()
                        ))
                );
    }

    private void validarToken(String token) {
        if (tokenEsperado == null || tokenEsperado.isBlank() || !tokenEsperado.equals(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
    }

    public record HeartbeatRequest(
            @NotBlank String workerId,
            @NotBlank String versao,
            @NotBlank String status,
            Instant observadoEm
    ) {
    }
}
