package br.com.contabilidade.common.audit;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "eventos_auditoria")
public class EventoAuditoria extends EntidadeBase {

    @Column(nullable = false, length = 100)
    private String acao;

    @Column(name = "recurso_tipo", nullable = false, length = 100)
    private String recursoTipo;

    @Column(name = "recurso_id")
    private UUID recursoId;

    @Column(nullable = false, length = 200)
    private String ator;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    @Column(name = "detalhes_json", columnDefinition = "text")
    private String detalhesJson;

    protected EventoAuditoria() {
    }

    public EventoAuditoria(
            String acao,
            String recursoTipo,
            UUID recursoId,
            String ator,
            String correlationId,
            String detalhesJson
    ) {
        this.acao = acao;
        this.recursoTipo = recursoTipo;
        this.recursoId = recursoId;
        this.ator = ator;
        this.correlationId = correlationId;
        this.detalhesJson = detalhesJson;
    }

    public String getAcao() {
        return acao;
    }

    public String getRecursoTipo() {
        return recursoTipo;
    }

    public UUID getRecursoId() {
        return recursoId;
    }

    public String getAtor() {
        return ator;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public String getDetalhesJson() {
        return detalhesJson;
    }
}
