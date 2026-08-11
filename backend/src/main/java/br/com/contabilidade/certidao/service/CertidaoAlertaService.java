package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import br.com.contabilidade.common.notification.NotificacaoService;
import br.com.contabilidade.common.notification.TipoNotificacao;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CertidaoAlertaService {

    private final CertidaoAcompanhamentoRepository repository;
    private final NotificacaoService notificacaoService;

    public CertidaoAlertaService(
            CertidaoAcompanhamentoRepository repository,
            NotificacaoService notificacaoService
    ) {
        this.repository = repository;
        this.notificacaoService = notificacaoService;
    }

    @Transactional
    public boolean emitirSeNecessario(UUID acompanhamentoId, LocalDate hoje) {
        CertidaoAcompanhamento item = repository.findById(acompanhamentoId)
                .filter(CertidaoAcompanhamento::isAtiva)
                .orElse(null);
        if (item == null) return false;

        return switch (item.statusExibicao(hoje)) {
            case VENCIDA, PROXIMA_DO_VENCIMENTO -> emitirVencimento(item);
            case IRREGULAR -> emitirIrregularidade(item);
            default -> false;
        };
    }

    private boolean emitirVencimento(CertidaoAcompanhamento item) {
        if (item.getAlertaVencimentoEm() != null) return false;
        notificacaoService.criar(
                TipoNotificacao.AVISO,
                "certidoes.alertas.vencimentoTitulo",
                "certidoes.alertas.vencimentoMensagem",
                "/certidoes",
                null
        );
        item.registrarAlertaVencimento();
        return true;
    }

    private boolean emitirIrregularidade(CertidaoAcompanhamento item) {
        if (item.getAlertaIrregularEm() != null) return false;
        notificacaoService.criar(
                TipoNotificacao.ACAO_NECESSARIA,
                "certidoes.alertas.irregularTitulo",
                "certidoes.alertas.irregularMensagem",
                "/certidoes",
                null
        );
        item.registrarAlertaIrregular();
        return true;
    }
}
