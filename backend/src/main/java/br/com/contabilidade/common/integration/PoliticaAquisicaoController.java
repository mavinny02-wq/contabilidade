package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.audit.AuditoriaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integracoes/politicas")
public class PoliticaAquisicaoController {

    private final PoliticaAquisicaoRepository repository;
    private final PoliticaAquisicaoService service;
    private final AuditoriaService auditoriaService;

    public PoliticaAquisicaoController(PoliticaAquisicaoRepository repository,
                                       PoliticaAquisicaoService service,
                                       AuditoriaService auditoriaService) {
        this.repository = repository;
        this.service = service;
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('INTEGRACAO_LER')")
    public List<PoliticaResponse> listar() {
        return repository.findAll().stream().map(this::mapear).toList();
    }

    @PutMapping("/{operacao}")
    @PreAuthorize("@permissaoService.tem('INTEGRACAO_EDITAR')")
    public PoliticaResponse atualizar(@PathVariable String operacao,
                                      @Valid @RequestBody PoliticaRequest request) {
        PoliticaAquisicao politica = service.atualizar(operacao, request.provedores(),
                request.permitirIntervencao(), request.timeoutHumanoMinutos(), request.fallbackPago(),
                request.custoMaximo(), request.moeda(), request.habilitada());
        auditoriaService.registrar("POLITICA_AQUISICAO_ATUALIZADA", "POLITICA_AQUISICAO",
                politica.getId(), Map.of("operacao", operacao));
        return mapear(politica);
    }

    private PoliticaResponse mapear(PoliticaAquisicao item) {
        return new PoliticaResponse(item.getOperacao(), service.lerCodigos(item.getProvedoresJson()),
                item.isPermitirIntervencao(), item.getTimeoutHumanoMinutos(), item.isFallbackPago(),
                item.getCustoMaximo(), item.getMoeda(), item.isHabilitada());
    }

    public record PoliticaRequest(@NotEmpty List<String> provedores,
            boolean permitirIntervencao,
            @Min(1) @Max(1440) int timeoutHumanoMinutos,
            boolean fallbackPago,
            @DecimalMin("0.0") BigDecimal custoMaximo,
            @Size(min = 3, max = 3) String moeda,
            boolean habilitada) { }

    public record PoliticaResponse(String operacao, List<String> provedores,
            boolean permitirIntervencao, int timeoutHumanoMinutos, boolean fallbackPago,
            BigDecimal custoMaximo, String moeda, boolean habilitada) { }
}
