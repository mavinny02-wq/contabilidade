package br.com.contabilidade.common.notification;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService service;

    public NotificacaoController(NotificacaoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('NOTIFICACAO_LER')")
    public Page<NotificacaoService.NotificacaoResponse> listar(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho
    ) {
        return service.listar(pagina, tamanho);
    }

    @PatchMapping("/{id}/lida")
    @PreAuthorize("@permissaoService.tem('NOTIFICACAO_LER')")
    public ResponseEntity<Void> marcarLida(@PathVariable UUID id) {
        service.marcarLida(id);
        return ResponseEntity.noContent().build();
    }
}
