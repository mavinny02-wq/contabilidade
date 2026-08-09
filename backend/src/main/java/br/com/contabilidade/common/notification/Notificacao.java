package br.com.contabilidade.common.notification;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "notificacoes")
public class Notificacao extends EntidadeBase {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoNotificacao tipo;

    @Column(name = "titulo_key", nullable = false, length = 160)
    private String tituloKey;

    @Column(name = "mensagem_key", nullable = false, length = 200)
    private String mensagemKey;

    @Column(name = "deep_link", length = 500)
    private String deepLink;

    @Column(name = "destinatario", length = 200)
    private String destinatario;

    @Column(name = "lida_em")
    private Instant lidaEm;

    protected Notificacao() {
    }

    public Notificacao(
            TipoNotificacao tipo,
            String tituloKey,
            String mensagemKey,
            String deepLink,
            String destinatario
    ) {
        this.tipo = tipo;
        this.tituloKey = tituloKey;
        this.mensagemKey = mensagemKey;
        this.deepLink = deepLink;
        this.destinatario = destinatario;
    }

    public void marcarLida() {
        if (lidaEm == null) {
            lidaEm = Instant.now();
        }
    }

    public TipoNotificacao getTipo() {
        return tipo;
    }

    public String getTituloKey() {
        return tituloKey;
    }

    public String getMensagemKey() {
        return mensagemKey;
    }

    public String getDeepLink() {
        return deepLink;
    }

    public String getDestinatario() {
        return destinatario;
    }

    public Instant getLidaEm() {
        return lidaEm;
    }

    public boolean isLida() {
        return lidaEm != null;
    }
}
