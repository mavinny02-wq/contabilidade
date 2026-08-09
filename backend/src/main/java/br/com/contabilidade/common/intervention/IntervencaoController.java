package br.com.contabilidade.common.intervention;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/intervencoes")
public class IntervencaoController {

    private final SolicitacaoIntervencaoRepository repository;
    private final AuditoriaService auditoriaService;

    public IntervencaoController(
            SolicitacaoIntervencaoRepository repository,
            AuditoriaService auditoriaService
    ) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('INTERVENCAO_LER')")
    public Page<IntervencaoResponse> listarPendentes(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho
    ) {
        return repository.findByStatusInOrderByCriadoEmDesc(
                List.of(StatusIntervencao.PENDENTE, StatusIntervencao.EM_ATENDIMENTO),
                PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100))
        ).map(IntervencaoResponse::de);
    }

    @PatchMapping("/{id}/resolver")
    @Transactional
    @PreAuthorize("@permissaoService.tem('INTERVENCAO_RESOLVER')")
    public ResponseEntity<Void> resolver(@PathVariable UUID id, Authentication authentication) {
        SolicitacaoIntervencao solicitacao = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "INTERVENCAO_NAO_ENCONTRADA",
                        "erros.intervencaoNaoEncontrada"
                ));
        String usuario = authentication == null ? "usuario-local" : authentication.getName();
        solicitacao.resolver(usuario);
        auditoriaService.registrar(
                "INTERVENCAO_RESOLVIDA",
                "SOLICITACAO_INTERVENCAO",
                id,
                Map.of("execucaoId", solicitacao.getExecucaoId())
        );
        return ResponseEntity.noContent().build();
    }

    public record IntervencaoResponse(
            UUID id,
            UUID execucaoId,
            UUID empresaId,
            TipoIntervencao tipo,
            StatusIntervencao status,
            String tituloKey,
            String instrucaoKey,
            String sessaoReferencia,
            Instant expiraEm,
            Instant criadoEm
    ) {
        static IntervencaoResponse de(SolicitacaoIntervencao solicitacao) {
            return new IntervencaoResponse(
                    solicitacao.getId(),
                    solicitacao.getExecucaoId(),
                    solicitacao.getEmpresaId(),
                    solicitacao.getTipo(),
                    solicitacao.getStatus(),
                    solicitacao.getTituloKey(),
                    solicitacao.getInstrucaoKey(),
                    solicitacao.getSessaoReferencia(),
                    solicitacao.getExpiraEm(),
                    solicitacao.getCriadoEm()
            );
        }
    }
}
