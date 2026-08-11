package br.com.contabilidade.common.technical;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/console-tecnica/configuracao")
public class ConfiguracaoSeguraController {

    private final ConfiguracaoSeguraService service;

    public ConfiguracaoSeguraController(ConfiguracaoSeguraService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('CONSOLE_TECNICA_LER')")
    public ConfiguracaoSeguraResponse consultar() {
        return service.consultar();
    }
}
