package br.com.contabilidade.common.integration;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integracoes/faturas")
public class FaturaProvedorController {

    private final FaturaProvedorService service;

    public FaturaProvedorController(FaturaProvedorService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('INTEGRACAO_LER')")
    public Page<FaturaProvedorResponse> listar(
            @RequestParam(required = false) String provedorCodigo,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho
    ) {
        return service.listar(provedorCodigo, pagina, tamanho);
    }

    @PostMapping
    @PreAuthorize("@permissaoService.tem('INTEGRACAO_EDITAR')")
    public FaturaProvedorResponse salvar(@Valid @RequestBody FaturaProvedorRequest request) {
        return service.salvar(request);
    }
}
