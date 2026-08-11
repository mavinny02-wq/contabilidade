package br.com.contabilidade.common.technical;

import br.com.contabilidade.common.document.StorageReconciliacaoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/console-tecnica/storage/reconciliacao")
public class StorageReconciliacaoController {

    private final StorageReconciliacaoService service;

    public StorageReconciliacaoController(StorageReconciliacaoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('CONSOLE_TECNICA_LER')")
    public StorageReconciliacaoService.ResultadoReconciliacao reconciliar() {
        return service.reconciliar();
    }
}
