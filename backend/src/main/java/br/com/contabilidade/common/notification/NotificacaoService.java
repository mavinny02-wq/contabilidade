package br.com.contabilidade.common.notification;

import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificacaoService {

    private final NotificacaoRepository repository;

    public NotificacaoService(NotificacaoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<NotificacaoResponse> listar(int pagina, int tamanho) {
        return repository.findAllByOrderByCriadoEmDesc(
                PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100))
        ).map(NotificacaoResponse::de);
    }

    @Transactional
    public void marcarLida(UUID id) {
        Notificacao notificacao = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "NOTIFICACAO_NAO_ENCONTRADA",
                        "erros.notificacaoNaoEncontrada"
                ));
        notificacao.marcarLida();
    }

    public long contarNaoLidas() {
        return repository.countByLidaEmIsNull();
    }

    public record NotificacaoResponse(
            UUID id,
            TipoNotificacao tipo,
            String tituloKey,
            String mensagemKey,
            String deepLink,
            boolean lida,
            java.time.Instant criadoEm,
            java.time.Instant lidaEm
    ) {
        static NotificacaoResponse de(Notificacao notificacao) {
            return new NotificacaoResponse(
                    notificacao.getId(),
                    notificacao.getTipo(),
                    notificacao.getTituloKey(),
                    notificacao.getMensagemKey(),
                    notificacao.getDeepLink(),
                    notificacao.isLida(),
                    notificacao.getCriadoEm(),
                    notificacao.getLidaEm()
            );
        }
    }
}
