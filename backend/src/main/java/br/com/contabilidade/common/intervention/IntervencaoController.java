package br.com.contabilidade.common.intervention;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/intervencoes")
public class IntervencaoController {

    private final SolicitacaoIntervencaoRepository repository;
    private final IntervencaoService service;
    private final SessaoInterativaTicketService ticketService;

    public IntervencaoController(
            SolicitacaoIntervencaoRepository repository,
            IntervencaoService service,
            SessaoInterativaTicketService ticketService
    ) {
        this.repository = repository;
        this.service = service;
        this.ticketService = ticketService;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('INTERVENCAO_LER')")
    public Page<IntervencaoResponse> listarPendentes(@RequestParam(defaultValue = "0") int pagina,
                                                     @RequestParam(defaultValue = "30") int tamanho) {
        return repository.findByStatusInOrderByCriadoEmDesc(
                List.of(StatusIntervencao.PENDENTE, StatusIntervencao.EM_ATENDIMENTO),
                PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100)))
                .map(IntervencaoResponse::de);
    }


    @GetMapping("/{id}/sessao")
    @PreAuthorize("@permissaoService.tem('INTERVENCAO_RESOLVER')")
    public SessaoInterativaTicketService.TicketSessaoInterativa sessao(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        SolicitacaoIntervencao intervencao = service.buscar(id);
        return ticketService.gerar(intervencao, usuario(authentication));
    }

    @PatchMapping("/{id}/assumir")
    @PreAuthorize("@permissaoService.tem('INTERVENCAO_RESOLVER')")
    public IntervencaoResponse assumir(@PathVariable UUID id, Authentication authentication) {
        return IntervencaoResponse.de(service.assumir(id, usuario(authentication)));
    }

    @PatchMapping("/{id}/resolver")
    @PreAuthorize("@permissaoService.tem('INTERVENCAO_RESOLVER')")
    public IntervencaoResponse resolver(@PathVariable UUID id,
                                        @Valid @RequestBody(required = false) ResolverRequest request,
                                        Authentication authentication) {
        ResolverRequest efetiva = request == null ? new ResolverRequest(null, true) : request;
        return IntervencaoResponse.de(service.resolver(id, usuario(authentication),
                efetiva.observacao(), efetiva.retomarExecucao()));
    }

    private String usuario(Authentication authentication) {
        return authentication == null || authentication.getName() == null
                ? "usuario-local" : authentication.getName();
    }

    public record ResolverRequest(@Size(max = 500) String observacao, boolean retomarExecucao) { }

    public record IntervencaoResponse(UUID id, UUID execucaoId, UUID empresaId, TipoIntervencao tipo,
                                      StatusIntervencao status, String tituloKey, String instrucaoKey,
                                      String sessaoReferencia, Instant expiraEm, Instant iniciadaEm,
                                      String atribuidaPara, Instant resolvidaEm, String resolvidaPor,
                                      Instant criadoEm) {
        static IntervencaoResponse de(SolicitacaoIntervencao item) {
            return new IntervencaoResponse(item.getId(), item.getExecucaoId(), item.getEmpresaId(),
                    item.getTipo(), item.getStatus(), item.getTituloKey(), item.getInstrucaoKey(),
                    item.getSessaoReferencia(), item.getExpiraEm(), item.getIniciadaEm(),
                    item.getAtribuidaPara(), item.getResolvidaEm(), item.getResolvidaPor(), item.getCriadoEm());
        }
    }
}
