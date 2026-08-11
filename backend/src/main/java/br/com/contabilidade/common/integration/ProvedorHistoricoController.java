package br.com.contabilidade.common.integration;

import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integracoes/provedores/historico")
public class ProvedorHistoricoController {

    private final ProvedorHistoricoService service;

    public ProvedorHistoricoController(ProvedorHistoricoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('INTEGRACAO_LER')")
    public ProvedorHistoricoResponse consultar(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        return service.consultar(inicio, fim);
    }
}
