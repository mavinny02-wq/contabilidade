package br.com.contabilidade.common.intervention;

import br.com.contabilidade.common.worker.WorkerTokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interno/automation/session-tickets")
public class SessaoInterativaTicketConsumoController {

    private final WorkerTokenService workerTokenService;
    private final SessaoInterativaTicketConsumoService consumoService;

    public SessaoInterativaTicketConsumoController(
            WorkerTokenService workerTokenService,
            SessaoInterativaTicketConsumoService consumoService
    ) {
        this.workerTokenService = workerTokenService;
        this.consumoService = consumoService;
    }

    @PostMapping("/consume")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void consumir(
            @RequestHeader("X-Worker-Token") String workerToken,
            @Valid @RequestBody ConsumirTicketRequest request
    ) {
        workerTokenService.validar(workerToken);
        consumoService.consumir(
                request.jti(),
                request.sessaoId(),
                request.intervencaoId(),
                request.execucaoId(),
                request.usuario(),
                request.expiraEm(),
                request.workerId()
        );
    }

    public record ConsumirTicketRequest(
            @NotNull UUID jti,
            @NotNull UUID sessaoId,
            @NotNull UUID intervencaoId,
            @NotNull UUID execucaoId,
            @NotBlank @Size(max = 200) String usuario,
            @NotNull Instant expiraEm,
            @NotBlank @Size(max = 120) String workerId
    ) {
    }
}
