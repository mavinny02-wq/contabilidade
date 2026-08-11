package br.com.contabilidade.common.technical;

import br.com.contabilidade.common.worker.WorkerHeartbeatHistoricoResponse;
import br.com.contabilidade.common.worker.WorkerHeartbeatHistoricoService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/console-tecnica/workers/historico")
public class WorkerHeartbeatHistoricoController {

    private final WorkerHeartbeatHistoricoService service;

    public WorkerHeartbeatHistoricoController(WorkerHeartbeatHistoricoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('CONSOLE_TECNICA_LER')")
    public WorkerHeartbeatHistoricoResponse consultar(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(required = false) String workerId
    ) {
        return service.consultar(inicio, fim, workerId);
    }
}
