package br.com.contabilidade.empresa.api;

import br.com.contabilidade.empresa.service.EmpresaHistoricoService;
import br.com.contabilidade.empresa.service.EmpresaService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/empresas")
public class EmpresaController {

    private final EmpresaService service;
    private final EmpresaHistoricoService historicoService;

    public EmpresaController(
            EmpresaService service,
            EmpresaHistoricoService historicoService
    ) {
        this.service = service;
        this.historicoService = historicoService;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('EMPRESA_LER')")
    public Page<EmpresaResumoResponse> listar(@RequestParam(required = false) String termo,
                                              @RequestParam(defaultValue = "0") int pagina,
                                              @RequestParam(defaultValue = "20") int tamanho) {
        return service.listar(termo, pagina, tamanho);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissaoService.tem('EMPRESA_LER')")
    public EmpresaDetalheResponse obter(@PathVariable UUID id) {
        return service.obter(id);
    }

    @GetMapping("/{id}/historico")
    @PreAuthorize("@permissaoService.tem('EMPRESA_LER')")
    public Page<EmpresaHistoricoResponse> historico(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho
    ) {
        return historicoService.listar(id, pagina, tamanho);
    }

    @PostMapping
    @PreAuthorize("@permissaoService.tem('EMPRESA_EDITAR')")
    public ResponseEntity<EmpresaDetalheResponse> criar(@Valid @RequestBody EmpresaRequest request) {
        EmpresaDetalheResponse criada = service.criar(request);
        return ResponseEntity.created(URI.create("/api/empresas/" + criada.id())).body(criada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permissaoService.tem('EMPRESA_EDITAR')")
    public EmpresaDetalheResponse atualizar(@PathVariable UUID id,
                                             @Valid @RequestBody EmpresaRequest request) {
        return service.atualizar(id, request);
    }

    @PostMapping("/{id}/filiais")
    @PreAuthorize("@permissaoService.tem('EMPRESA_EDITAR')")
    public ResponseEntity<EstabelecimentoResponse> adicionarFilial(@PathVariable UUID id,
                                                                    @Valid @RequestBody FilialRequest request) {
        EstabelecimentoResponse filial = service.adicionarFilial(id, request);
        return ResponseEntity.created(URI.create("/api/empresas/" + id + "/filiais/" + filial.id()))
                .body(filial);
    }

    @PutMapping("/{id}/filiais/{filialId}")
    @PreAuthorize("@permissaoService.tem('EMPRESA_EDITAR')")
    public EstabelecimentoResponse atualizarFilial(
            @PathVariable UUID id,
            @PathVariable UUID filialId,
            @Valid @RequestBody FilialAtualizacaoRequest request
    ) {
        return service.atualizarFilial(id, filialId, request);
    }

    @PatchMapping("/{id}/ativa")
    @PreAuthorize("@permissaoService.tem('EMPRESA_EDITAR')")
    public ResponseEntity<Void> alterarAtiva(@PathVariable UUID id, @RequestParam boolean valor) {
        service.alterarAtiva(id, valor);
        return ResponseEntity.noContent().build();
    }
}
