package br.com.contabilidade.certidao.api;

import br.com.contabilidade.certidao.service.CertidaoDashboardGerencialService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/certidoes/dashboard-gerencial")
public class CertidaoDashboardGerencialController {

    private final CertidaoDashboardGerencialService service;

    public CertidaoDashboardGerencialController(CertidaoDashboardGerencialService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('CERTIDAO_LER')")
    public CertidaoDashboardGerencialService.ResumoGerencial resumir() {
        return service.resumir();
    }
}
