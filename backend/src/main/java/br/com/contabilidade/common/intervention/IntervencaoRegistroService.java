package br.com.contabilidade.common.intervention;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.notification.NotificacaoService;
import br.com.contabilidade.common.notification.TipoNotificacao;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IntervencaoRegistroService {

    private static final List<StatusIntervencao> ABERTAS = List.of(
            StatusIntervencao.PENDENTE,
            StatusIntervencao.EM_ATENDIMENTO
    );

    private final SolicitacaoIntervencaoRepository repository;
    private final NotificacaoService notificacaoService;
    private final AuditoriaService auditoriaService;

    public IntervencaoRegistroService(
            SolicitacaoIntervencaoRepository repository,
            NotificacaoService notificacaoService,
            AuditoriaService auditoriaService
    ) {
        this.repository = repository;
        this.notificacaoService = notificacaoService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public SolicitacaoIntervencao criar(
            UUID execucaoId,
            UUID empresaId,
            TipoIntervencao tipo,
            String tituloKey,
            String instrucaoKey,
            String sessaoReferencia,
            Duration timeout
    ) {
        return repository.findFirstByExecucaoIdAndStatusIn(execucaoId, ABERTAS)
                .orElseGet(() -> {
                    Instant expiraEm = Instant.now().plus(
                            timeout == null || timeout.isNegative() || timeout.isZero()
                                    ? Duration.ofMinutes(30)
                                    : timeout
                    );
                    SolicitacaoIntervencao nova = repository.save(new SolicitacaoIntervencao(
                            execucaoId,
                            empresaId,
                            tipo,
                            tituloKey,
                            instrucaoKey,
                            sessaoReferencia,
                            expiraEm
                    ));
                    notificacaoService.criar(
                            TipoNotificacao.ACAO_NECESSARIA,
                            tituloKey,
                            instrucaoKey,
                            "/intervencoes",
                            null
                    );
                    auditoriaService.registrar(
                            "INTERVENCAO_CRIADA",
                            "SOLICITACAO_INTERVENCAO",
                            nova.getId(),
                            Map.of("execucaoId", execucaoId, "tipo", tipo.name())
                    );
                    return nova;
                });
    }
}
