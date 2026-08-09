package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integracoes/provedores")
public class DefinicaoProvedorController {

    private final DefinicaoProvedorRepository repository;
    private final AuditoriaService auditoriaService;

    public DefinicaoProvedorController(
            DefinicaoProvedorRepository repository,
            AuditoriaService auditoriaService
    ) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('INTEGRACAO_LER')")
    public List<ProvedorResponse> listar() {
        return repository.findAllByOrderByPrioridadeAscNomeAsc().stream()
                .map(ProvedorResponse::de)
                .toList();
    }

    @PutMapping("/{codigo}")
    @Transactional
    @PreAuthorize("@permissaoService.tem('INTEGRACAO_EDITAR')")
    public ProvedorResponse atualizar(
            @PathVariable String codigo,
            @Valid @RequestBody ProvedorAtualizacaoRequest request
    ) {
        DefinicaoProvedor provedor = repository.findByCodigo(codigo)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "PROVEDOR_NAO_ENCONTRADO",
                        "erros.provedorNaoEncontrado"
                ));
        provedor.atualizar(
                request.habilitado(),
                request.prioridade(),
                request.timeoutSegundos(),
                request.maxRetries(),
                request.baseUrl(),
                request.referenciaSegredo()
        );
        auditoriaService.registrar(
                "PROVEDOR_ATUALIZADO",
                "DEFINICAO_PROVEDOR",
                provedor.getId(),
                Map.of("codigo", codigo, "habilitado", request.habilitado())
        );
        return ProvedorResponse.de(provedor);
    }

    public record ProvedorAtualizacaoRequest(
            boolean habilitado,
            @Min(0) @Max(1000) int prioridade,
            @Min(1) @Max(3600) int timeoutSegundos,
            @Min(0) @Max(10) int maxRetries,
            @Size(max = 500) String baseUrl,
            @Size(max = 200) String referenciaSegredo
    ) {
    }

    public record ProvedorResponse(
            UUID id,
            String codigo,
            String nome,
            TipoProvedor tipo,
            boolean habilitado,
            int prioridade,
            int timeoutSegundos,
            int maxRetries,
            String baseUrl,
            String referenciaSegredo
    ) {
        static ProvedorResponse de(DefinicaoProvedor provedor) {
            return new ProvedorResponse(
                    provedor.getId(),
                    provedor.getCodigo(),
                    provedor.getNome(),
                    provedor.getTipo(),
                    provedor.isHabilitado(),
                    provedor.getPrioridade(),
                    provedor.getTimeoutSegundos(),
                    provedor.getMaxRetries(),
                    provedor.getBaseUrl(),
                    provedor.getReferenciaSegredo()
            );
        }
    }
}
