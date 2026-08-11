package br.com.contabilidade.empresa.api;

import br.com.contabilidade.empresa.domain.ModuloEmpresa;
import br.com.contabilidade.empresa.service.ResponsavelModuloEmpresaService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/empresas/{empresaId}/responsaveis-modulo")
public class ResponsavelModuloEmpresaController {

    private final ResponsavelModuloEmpresaService service;

    public ResponsavelModuloEmpresaController(ResponsavelModuloEmpresaService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('EMPRESA_LER')")
    public List<ResponsavelModuloResponse> listar(@PathVariable UUID empresaId) {
        return service.listar(empresaId);
    }

    @PutMapping("/{modulo}")
    @PreAuthorize("@permissaoService.tem('EMPRESA_EDITAR')")
    public ResponsavelModuloResponse atualizar(
            @PathVariable UUID empresaId,
            @PathVariable ModuloEmpresa modulo,
            @Valid @RequestBody ResponsavelModuloRequest request
    ) {
        return service.atualizar(empresaId, modulo, request);
    }
}
