package br.com.contabilidade.common.worker;

import br.com.contabilidade.common.execution.ExecucaoFilaService;
import br.com.contabilidade.common.execution.ExecucaoIntegracao;
import br.com.contabilidade.common.execution.ExecucaoResponse;
import br.com.contabilidade.common.execution.StatusExecucao;
import br.com.contabilidade.common.intervention.IntervencaoService;
import br.com.contabilidade.common.intervention.TipoIntervencao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interno/workers/execucoes")
public class WorkerExecutionController {

    private final WorkerTokenService tokenService;
    private final ExecucaoFilaService filaService;
    private final IntervencaoService intervencaoService;

    public WorkerExecutionController(WorkerTokenService tokenService,
                                     ExecucaoFilaService filaService,
                                     IntervencaoService intervencaoService) {
        this.tokenService = tokenService;
        this.filaService = filaService;
        this.intervencaoService = intervencaoService;
    }

    @PostMapping("/adquirir")
    public ResponseEntity<ExecucaoFilaService.ExecucaoLease> adquirir(
            @RequestHeader("X-Worker-Token") String token,
            @Valid @RequestBody AdquirirRequest request) {
        tokenService.validar(token);
        return filaService.adquirir(
                        request.workerId(),
                        request.operacoes(),
                        request.provedores(),
                        Duration.ofSeconds(request.leaseSegundos())
                )
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PatchMapping("/{id}/renovar")
    public RenovarResponse renovar(@RequestHeader("X-Worker-Token") String token,
                                   @PathVariable UUID id,
                                   @Valid @RequestBody RenovarRequest request) {
        tokenService.validar(token);
        Instant leaseAte = filaService.renovarLease(id, request.leaseToken(),
                Duration.ofSeconds(request.leaseSegundos()));
        return new RenovarResponse(leaseAte);
    }


    @PostMapping("/{id}/retomar-sessao")
    @Transactional
    public ExecucaoFilaService.ExecucaoLease retomarSessao(
            @RequestHeader("X-Worker-Token") String token,
            @PathVariable UUID id,
            @Valid @RequestBody RetomarSessaoRequest request
    ) {
        tokenService.validar(token);
        intervencaoService.resolverPorSessao(
                id,
                request.sessionId(),
                request.operador(),
                request.observacao()
        );
        return filaService.retomarNaMesmaSessao(
                id,
                request.workerId(),
                Duration.ofSeconds(request.leaseSegundos())
        );
    }

    @PostMapping("/{id}/concluir")
    public ExecucaoResponse concluir(@RequestHeader("X-Worker-Token") String token,
                                     @PathVariable UUID id,
                                     @Valid @RequestBody ConcluirRequest request) {
        tokenService.validar(token);
        return ExecucaoResponse.de(filaService.concluir(id, request.leaseToken(),
                request.protocoloExterno(), request.resultado(), request.custo(), request.moeda()));
    }

    @PostMapping("/{id}/falhar")
    public ExecucaoResponse falhar(@RequestHeader("X-Worker-Token") String token,
                                   @PathVariable UUID id,
                                   @Valid @RequestBody FalharRequest request) {
        tokenService.validar(token);
        return ExecucaoResponse.de(filaService.falhar(id, request.leaseToken(), request.codigo(),
                request.resumo(), request.retryable(), request.fonteIndisponivel()));
    }

    @PostMapping("/{id}/aguardar-humano")
    @Transactional
    public ExecucaoResponse aguardarHumano(@RequestHeader("X-Worker-Token") String token,
                                           @PathVariable UUID id,
                                           @Valid @RequestBody AguardarHumanoRequest request) {
        tokenService.validar(token);
        ExecucaoIntegracao execucao = filaService.aguardarHumano(id, request.leaseToken(),
                request.status(), request.codigo(), request.resumo());
        intervencaoService.criar(id, execucao.getEmpresaId(), request.tipo(),
                request.tituloKey(), request.instrucaoKey(), request.sessaoReferencia(),
                Duration.ofMinutes(request.timeoutMinutos()));
        return ExecucaoResponse.de(execucao);
    }

    public record AdquirirRequest(
            @NotBlank String workerId,
            @NotEmpty List<String> operacoes,
            @NotEmpty List<String> provedores,
            @Min(30) @Max(1800) int leaseSegundos
    ) { }

    public record RenovarRequest(@NotNull UUID leaseToken,
                                 @Min(30) @Max(1800) int leaseSegundos) { }

    public record RenovarResponse(Instant leaseAte) { }


    public record RetomarSessaoRequest(
            @NotBlank String workerId,
            @NotBlank String sessionId,
            @NotBlank String operador,
            String observacao,
            @Min(30) @Max(1800) int leaseSegundos
    ) { }

    public record ConcluirRequest(@NotNull UUID leaseToken, String protocoloExterno, Object resultado,
                                  BigDecimal custo, String moeda) { }

    public record FalharRequest(@NotNull UUID leaseToken, @NotBlank String codigo, String resumo,
                                boolean retryable, boolean fonteIndisponivel) { }

    public record AguardarHumanoRequest(@NotNull UUID leaseToken, @NotNull StatusExecucao status,
                                        @NotNull TipoIntervencao tipo, String codigo, String resumo,
                                        @NotBlank String tituloKey,
                                        @NotBlank String instrucaoKey,
                                        String sessaoReferencia,
                                        @Min(1) @Max(1440) int timeoutMinutos) { }
}
