package br.com.contabilidade.common.intervention;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import br.com.contabilidade.common.execution.ExecucaoFilaService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IntervencaoService {

    private static final List<StatusIntervencao> ABERTAS = List.of(
            StatusIntervencao.PENDENTE, StatusIntervencao.EM_ATENDIMENTO);

    private final SolicitacaoIntervencaoRepository repository;
    private final ExecucaoFilaService filaService;
    private final IntervencaoRegistroService registroService;
    private final AuditoriaService auditoriaService;

    public IntervencaoService(SolicitacaoIntervencaoRepository repository,
                              ExecucaoFilaService filaService,
                              IntervencaoRegistroService registroService,
                              AuditoriaService auditoriaService) {
        this.repository = repository;
        this.filaService = filaService;
        this.registroService = registroService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public SolicitacaoIntervencao criar(UUID execucaoId, UUID empresaId, TipoIntervencao tipo,
                                        String tituloKey, String instrucaoKey, String sessaoReferencia,
                                        Duration timeout) {
        return registroService.criar(
                execucaoId,
                empresaId,
                tipo,
                tituloKey,
                instrucaoKey,
                sessaoReferencia,
                timeout
        );
    }

    @Transactional
    public SolicitacaoIntervencao assumir(UUID id, String usuario) {
        SolicitacaoIntervencao item = buscar(id);
        try {
            item.assumir(usuario);
        } catch (IllegalStateException exception) {
            throw new ExcecaoNegocio("INTERVENCAO_INDISPONIVEL", "erros.intervencaoIndisponivel",
                    HttpStatus.CONFLICT, exception);
        }
        auditoriaService.registrar("INTERVENCAO_ASSUMIDA", "SOLICITACAO_INTERVENCAO", id,
                Map.of("usuario", usuario));
        return item;
    }

    @Transactional
    public SolicitacaoIntervencao resolver(UUID id, String usuario, String observacao, boolean retomarExecucao) {
        SolicitacaoIntervencao item = buscar(id);
        try {
            item.resolver(usuario, observacao);
        } catch (IllegalStateException exception) {
            throw new ExcecaoNegocio("INTERVENCAO_INDISPONIVEL", "erros.intervencaoIndisponivel",
                    HttpStatus.CONFLICT, exception);
        }
        if (retomarExecucao) filaService.retomar(item.getExecucaoId());
        auditoriaService.registrar("INTERVENCAO_RESOLVIDA", "SOLICITACAO_INTERVENCAO", id,
                Map.of("execucaoId", item.getExecucaoId(), "retomada", retomarExecucao));
        return item;
    }


    @Transactional
    public void resolverPorExecucao(UUID execucaoId, String usuario, String observacao) {
        repository.findFirstByExecucaoIdAndStatusIn(execucaoId, ABERTAS).ifPresent(item -> {
            item.resolverPeloSistema(observacao);
            auditoriaService.registrar("INTERVENCAO_RESOLVIDA_PELO_SISTEMA",
                    "SOLICITACAO_INTERVENCAO", item.getId(), Map.of("execucaoId", execucaoId));
        });
    }

    @Transactional
    public int expirarPendentes() {
        List<SolicitacaoIntervencao> expiradas = repository.findByStatusInAndExpiraEmBefore(
                ABERTAS,
                Instant.now()
        );
        expiradas.forEach(item -> {
            item.expirar();
            repository.flush();
            filaService.expirarIntervencao(item.getExecucaoId());
            auditoriaService.registrar(
                    "INTERVENCAO_EXPIRADA",
                    "SOLICITACAO_INTERVENCAO",
                    item.getId(),
                    Map.of("execucaoId", item.getExecucaoId())
            );
        });
        return expiradas.size();
    }

    @Transactional(readOnly = true)
    public SolicitacaoIntervencao buscar(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException(
                "INTERVENCAO_NAO_ENCONTRADA", "erros.intervencaoNaoEncontrada"));
    }
}
