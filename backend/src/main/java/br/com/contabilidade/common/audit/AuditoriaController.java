package br.com.contabilidade.common.audit;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    private final EventoAuditoriaRepository repository;

    public AuditoriaController(EventoAuditoriaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('AUDITORIA_LER')")
    public Page<EventoAuditoriaResponse> listar(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho
    ) {
        return repository.findAllByOrderByCriadoEmDesc(
                PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100))
        ).map(EventoAuditoriaResponse::de);
    }

    public record EventoAuditoriaResponse(
            UUID id,
            String acao,
            String recursoTipo,
            UUID recursoId,
            String ator,
            String correlationId,
            String detalhesJson,
            Instant criadoEm
    ) {
        static EventoAuditoriaResponse de(EventoAuditoria evento) {
            return new EventoAuditoriaResponse(
                    evento.getId(),
                    evento.getAcao(),
                    evento.getRecursoTipo(),
                    evento.getRecursoId(),
                    evento.getAtor(),
                    evento.getCorrelationId(),
                    evento.getDetalhesJson(),
                    evento.getCriadoEm()
            );
        }
    }
}
