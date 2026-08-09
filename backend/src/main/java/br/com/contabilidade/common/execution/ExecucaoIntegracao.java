package br.com.contabilidade.common.execution;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "execucoes_integracao")
public class ExecucaoIntegracao extends EntidadeBase {

    @Column(name = "empresa_id")
    private UUID empresaId;

    @Column(nullable = false, length = 100)
    private String operacao;

    @Column(name = "provedor_codigo", length = 100)
    private String provedorCodigo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private StatusExecucao status;

    @Column(nullable = false)
    private int tentativas;

    @Column(name = "max_tentativas", nullable = false)
    private int maxTentativas;

    @Column(name = "proxima_tentativa_em")
    private Instant proximaTentativaEm;

    @Column(name = "iniciada_em")
    private Instant iniciadaEm;

    @Column(name = "finalizada_em")
    private Instant finalizadaEm;

    @Column(name = "erro_codigo", length = 100)
    private String erroCodigo;

    @Column(name = "erro_resumo", length = 500)
    private String erroResumo;

    @Column(name = "protocolo_externo", length = 200)
    private String protocoloExterno;

    @Column(name = "custo_estimado", precision = 14, scale = 4)
    private BigDecimal custoEstimado;

    @Column(length = 3)
    private String moeda;

    protected ExecucaoIntegracao() {
    }

    public ExecucaoIntegracao(UUID empresaId, String operacao, String provedorCodigo, int maxTentativas) {
        this.empresaId = empresaId;
        this.operacao = operacao;
        this.provedorCodigo = provedorCodigo;
        this.status = StatusExecucao.NA_FILA;
        this.maxTentativas = Math.max(maxTentativas, 1);
    }

    public void iniciar() {
        status = StatusExecucao.EXECUTANDO;
        tentativas++;
        iniciadaEm = Instant.now();
    }

    public void concluir(String protocoloExterno, BigDecimal custoEstimado, String moeda) {
        status = StatusExecucao.SUCESSO;
        this.protocoloExterno = protocoloExterno;
        this.custoEstimado = custoEstimado;
        this.moeda = moeda;
        finalizadaEm = Instant.now();
        erroCodigo = null;
        erroResumo = null;
    }

    public void falhar(String erroCodigo, String erroResumo, boolean fonteIndisponivel) {
        status = fonteIndisponivel ? StatusExecucao.FONTE_INDISPONIVEL : StatusExecucao.FALHA;
        this.erroCodigo = erroCodigo;
        this.erroResumo = erroResumo;
        finalizadaEm = Instant.now();
    }

    public void aguardarHumano(StatusExecucao statusDeEspera) {
        if (statusDeEspera != StatusExecucao.AGUARDANDO_HUMANO
                && statusDeEspera != StatusExecucao.AGUARDANDO_CAPTCHA
                && statusDeEspera != StatusExecucao.AGUARDANDO_AUTENTICACAO) {
            throw new IllegalArgumentException("Status de espera humana inválido");
        }
        this.status = statusDeEspera;
    }

    public UUID getEmpresaId() { return empresaId; }
    public String getOperacao() { return operacao; }
    public String getProvedorCodigo() { return provedorCodigo; }
    public StatusExecucao getStatus() { return status; }
    public int getTentativas() { return tentativas; }
    public int getMaxTentativas() { return maxTentativas; }
    public Instant getProximaTentativaEm() { return proximaTentativaEm; }
    public Instant getIniciadaEm() { return iniciadaEm; }
    public Instant getFinalizadaEm() { return finalizadaEm; }
    public String getErroCodigo() { return erroCodigo; }
    public String getErroResumo() { return erroResumo; }
    public String getProtocoloExterno() { return protocoloExterno; }
    public BigDecimal getCustoEstimado() { return custoEstimado; }
    public String getMoeda() { return moeda; }
}
