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
    private int prioridade;

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

    @Column(name = "payload_json", columnDefinition = "text")
    private String payloadJson;

    @Column(name = "resultado_json", columnDefinition = "text")
    private String resultadoJson;

    @Column(name = "idempotency_key", unique = true, length = 200)
    private String idempotencyKey;

    @Column(name = "lease_token")
    private UUID leaseToken;

    @Column(name = "lease_ate")
    private Instant leaseAte;

    @Column(name = "worker_id", length = 120)
    private String workerId;

    @Column(name = "execucao_anterior_id")
    private UUID execucaoAnteriorId;

    @Column(name = "cancelada_em")
    private Instant canceladaEm;

    @Column(name = "motivo_cancelamento", length = 500)
    private String motivoCancelamento;

    protected ExecucaoIntegracao() {
    }

    public ExecucaoIntegracao(UUID empresaId, String operacao, String provedorCodigo,
                              int prioridade, int maxTentativas, String payloadJson,
                              String idempotencyKey, UUID execucaoAnteriorId) {
        this.empresaId = empresaId;
        this.operacao = operacao;
        this.provedorCodigo = provedorCodigo;
        this.status = StatusExecucao.NA_FILA;
        this.prioridade = Math.max(0, Math.min(prioridade, 1000));
        this.maxTentativas = Math.max(maxTentativas, 1);
        this.payloadJson = payloadJson;
        this.idempotencyKey = idempotencyKey;
        this.execucaoAnteriorId = execucaoAnteriorId;
    }

    public void concluir(String protocoloExterno, String resultadoJson, BigDecimal custo, String moeda) {
        exigirExecutandoOuEspera();
        this.status = StatusExecucao.SUCESSO;
        this.protocoloExterno = limpar(protocoloExterno);
        this.resultadoJson = resultadoJson;
        this.custoEstimado = custo;
        this.moeda = moeda == null ? null : moeda.toUpperCase();
        this.finalizadaEm = Instant.now();
        this.proximaTentativaEm = null;
        limparLease();
        limparErro();
    }

    public void concluirParcial(String resultadoJson, String erroCodigo, String erroResumo) {
        exigirExecutandoOuEspera();
        this.status = StatusExecucao.PARCIAL;
        this.resultadoJson = resultadoJson;
        this.erroCodigo = limpar(erroCodigo);
        this.erroResumo = limitar(erroResumo, 500);
        this.finalizadaEm = Instant.now();
        this.proximaTentativaEm = null;
        limparLease();
    }

    public void falharDefinitivo(String erroCodigo, String erroResumo, boolean fonteIndisponivel) {
        exigirNaoTerminal();
        this.status = fonteIndisponivel ? StatusExecucao.FONTE_INDISPONIVEL : StatusExecucao.FALHA;
        this.erroCodigo = limpar(erroCodigo);
        this.erroResumo = limitar(erroResumo, 500);
        this.finalizadaEm = Instant.now();
        this.proximaTentativaEm = null;
        limparLease();
    }

    public void agendarRetry(String erroCodigo, String erroResumo, Instant proximaTentativaEm) {
        exigirNaoTerminal();
        this.status = StatusExecucao.RETRY_AGENDADO;
        this.erroCodigo = limpar(erroCodigo);
        this.erroResumo = limitar(erroResumo, 500);
        this.proximaTentativaEm = proximaTentativaEm;
        this.finalizadaEm = null;
        limparLease();
    }

    public void aguardarHumano(StatusExecucao statusEspera, String erroCodigo, String erroResumo) {
        if (!statusEspera.esperaHumana()) {
            throw new IllegalArgumentException("Status de espera humana inválido");
        }
        exigirNaoTerminal();
        this.status = statusEspera;
        this.erroCodigo = limpar(erroCodigo);
        this.erroResumo = limitar(erroResumo, 500);
        this.proximaTentativaEm = null;
        this.finalizadaEm = null;
        limparLease();
    }

    public void retomarDaIntervencao() {
        if (!status.esperaHumana()) {
            throw new IllegalStateException("Execução não aguarda intervenção");
        }
        this.status = StatusExecucao.NA_FILA;
        this.proximaTentativaEm = Instant.now();
        limparErro();
    }

    public void cancelar(String motivo) {
        if (status.terminal()) {
            throw new IllegalStateException("Execução terminal não pode ser cancelada");
        }
        this.status = StatusExecucao.CANCELADO;
        this.canceladaEm = Instant.now();
        this.finalizadaEm = this.canceladaEm;
        this.motivoCancelamento = limitar(motivo, 500);
        this.proximaTentativaEm = null;
        limparLease();
    }

    public boolean podeTentarNovamente() {
        return tentativas < maxTentativas;
    }

    private void exigirNaoTerminal() {
        if (status.terminal()) {
            throw new IllegalStateException("Execução já está em estado terminal");
        }
    }

    private void exigirExecutandoOuEspera() {
        if (status != StatusExecucao.EXECUTANDO && !status.esperaHumana()) {
            throw new IllegalStateException("Execução não está ativa");
        }
    }

    private void limparLease() {
        leaseToken = null;
        leaseAte = null;
        workerId = null;
    }

    private void limparErro() {
        erroCodigo = null;
        erroResumo = null;
    }

    private String limpar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private String limitar(String valor, int tamanho) {
        String limpo = limpar(valor);
        if (limpo == null || limpo.length() <= tamanho) return limpo;
        return limpo.substring(0, tamanho);
    }

    public UUID getEmpresaId() { return empresaId; }
    public String getOperacao() { return operacao; }
    public String getProvedorCodigo() { return provedorCodigo; }
    public StatusExecucao getStatus() { return status; }
    public int getPrioridade() { return prioridade; }
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
    public String getPayloadJson() { return payloadJson; }
    public String getResultadoJson() { return resultadoJson; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public UUID getLeaseToken() { return leaseToken; }
    public Instant getLeaseAte() { return leaseAte; }
    public String getWorkerId() { return workerId; }
    public UUID getExecucaoAnteriorId() { return execucaoAnteriorId; }
    public Instant getCanceladaEm() { return canceladaEm; }
    public String getMotivoCancelamento() { return motivoCancelamento; }
}
