package br.com.contabilidade.common.intervention;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "solicitacoes_intervencao")
public class SolicitacaoIntervencao extends EntidadeBase {

    @Column(name = "execucao_id", nullable = false)
    private UUID execucaoId;

    @Column(name = "empresa_id")
    private UUID empresaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoIntervencao tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusIntervencao status;

    @Column(name = "titulo_key", nullable = false, length = 160)
    private String tituloKey;

    @Column(name = "instrucao_key", nullable = false, length = 200)
    private String instrucaoKey;

    @Column(name = "sessao_referencia", length = 300)
    private String sessaoReferencia;

    @Column(name = "expira_em")
    private Instant expiraEm;

    @Column(name = "resolvida_em")
    private Instant resolvidaEm;

    @Column(name = "resolvida_por", length = 200)
    private String resolvidaPor;

    protected SolicitacaoIntervencao() {
    }

    public void resolver(String usuario) {
        status = StatusIntervencao.RESOLVIDA;
        resolvidaEm = Instant.now();
        resolvidaPor = usuario;
    }

    public UUID getExecucaoId() { return execucaoId; }
    public UUID getEmpresaId() { return empresaId; }
    public TipoIntervencao getTipo() { return tipo; }
    public StatusIntervencao getStatus() { return status; }
    public String getTituloKey() { return tituloKey; }
    public String getInstrucaoKey() { return instrucaoKey; }
    public String getSessaoReferencia() { return sessaoReferencia; }
    public Instant getExpiraEm() { return expiraEm; }
    public Instant getResolvidaEm() { return resolvidaEm; }
    public String getResolvidaPor() { return resolvidaPor; }
}
