package br.com.contabilidade.common.execution;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/execucoes")
public class ExecucaoController {

    private final ExecucaoIntegracaoRepository repository;

    public ExecucaoController(ExecucaoIntegracaoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('EXECUCAO_LER')")
    public Page<ExecucaoResponse> listar(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho
    ) {
        return repository.findAllByOrderByCriadoEmDesc(
                PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100))
        ).map(ExecucaoResponse::de);
    }

    public record ExecucaoResponse(
            UUID id,
            UUID empresaId,
            String operacao,
            String provedorCodigo,
            StatusExecucao status,
            int tentativas,
            int maxTentativas,
            Instant iniciadaEm,
            Instant finalizadaEm,
            String erroCodigo,
            String erroResumo,
            String protocoloExterno,
            BigDecimal custoEstimado,
            String moeda,
            Instant criadoEm
    ) {
        static ExecucaoResponse de(ExecucaoIntegracao execucao) {
            return new ExecucaoResponse(
                    execucao.getId(),
                    execucao.getEmpresaId(),
                    execucao.getOperacao(),
                    execucao.getProvedorCodigo(),
                    execucao.getStatus(),
                    execucao.getTentativas(),
                    execucao.getMaxTentativas(),
                    execucao.getIniciadaEm(),
                    execucao.getFinalizadaEm(),
                    execucao.getErroCodigo(),
                    execucao.getErroResumo(),
                    execucao.getProtocoloExterno(),
                    execucao.getCustoEstimado(),
                    execucao.getMoeda(),
                    execucao.getCriadoEm()
            );
        }
    }
}
