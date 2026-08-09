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

    @Column(name = "iniciada_em")
    private Instant iniciadaEm;

    @Column(name = "atribuida_para", length = 200)
    private String atribuidaPara;

    @Column(name = "resolvida_em")
    private Instant resolvidaEm;

    @Column(name = "resolvida_por", length = 200)
    private String resolvidaPor;

    @Column(name = "observacao_resolucao", length = 500)
    private String observacaoResolucao;

    protected SolicitacaoIntervencao() {
    }

    public SolicitacaoIntervencao(UUID execucaoId, UUID empresaId, TipoIntervencao tipo,
                                  String tituloKey, String instrucaoKey, String sessaoReferencia,
                                  Instant expiraEm) {
        this.execucaoId = execucaoId;
        this.empresaId = empresaId;
        this.tipo = tipo;
        this.status = StatusIntervencao.PENDENTE;
        this.tituloKey = tituloKey;
        this.instrucaoKey = instrucaoKey;
        this.sessaoReferencia = limpar(sessaoReferencia);
        this.expiraEm = expiraEm;
    }

    public void assumir(String usuario) {
        if (status == StatusIntervencao.PENDENTE) {
            status = StatusIntervencao.EM_ATENDIMENTO;
            iniciadaEm = Instant.now();
            atribuidaPara = usuario;
            return;
        }
        if (status == StatusIntervencao.EM_ATENDIMENTO && usuario.equals(atribuidaPara)) return;
        throw new IllegalStateException("Intervenção não está disponível para atendimento");
    }

    public void resolver(String usuario, String observacao) {
        if (!status.aberta()) throw new IllegalStateException("Intervenção não está aberta");
        if (atribuidaPara != null && !atribuidaPara.equals(usuario)) {
            throw new IllegalStateException("Intervenção está atribuída a outro operador");
        }
        concluirResolucao(usuario, observacao);
    }

    public void resolverPeloSistema(String observacao) {
        if (!status.aberta()) return;
        concluirResolucao("sistema", observacao);
    }

    private void concluirResolucao(String usuario, String observacao) {
        status = StatusIntervencao.RESOLVIDA;
        resolvidaEm = Instant.now();
        resolvidaPor = usuario;
        observacaoResolucao = limitar(observacao, 500);
    }

    public void cancelar() {
        if (!status.aberta()) throw new IllegalStateException("Intervenção não está aberta");
        status = StatusIntervencao.CANCELADA;
    }

    public void expirar() {
        if (status.aberta()) status = StatusIntervencao.EXPIRADA;
    }

    private String limpar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private String limitar(String valor, int tamanho) {
        String limpo = limpar(valor);
        return limpo == null || limpo.length() <= tamanho ? limpo : limpo.substring(0, tamanho);
    }

    public UUID getExecucaoId() { return execucaoId; }
    public UUID getEmpresaId() { return empresaId; }
    public TipoIntervencao getTipo() { return tipo; }
    public StatusIntervencao getStatus() { return status; }
    public String getTituloKey() { return tituloKey; }
    public String getInstrucaoKey() { return instrucaoKey; }
    public String getSessaoReferencia() { return sessaoReferencia; }
    public Instant getExpiraEm() { return expiraEm; }
    public Instant getIniciadaEm() { return iniciadaEm; }
    public String getAtribuidaPara() { return atribuidaPara; }
    public Instant getResolvidaEm() { return resolvidaEm; }
    public String getResolvidaPor() { return resolvidaPor; }
    public String getObservacaoResolucao() { return observacaoResolucao; }
}
