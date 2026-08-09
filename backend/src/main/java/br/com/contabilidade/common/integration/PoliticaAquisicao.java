package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "politicas_aquisicao")
public class PoliticaAquisicao extends EntidadeBase {

    @Column(nullable = false, unique = true, length = 100)
    private String operacao;

    @Column(name = "provedores_json", nullable = false, columnDefinition = "text")
    private String provedoresJson;

    @Column(name = "permitir_intervencao", nullable = false)
    private boolean permitirIntervencao;

    @Column(name = "timeout_humano_minutos", nullable = false)
    private int timeoutHumanoMinutos;

    @Column(name = "fallback_pago", nullable = false)
    private boolean fallbackPago;

    @Column(name = "custo_maximo", precision = 14, scale = 4)
    private BigDecimal custoMaximo;

    @Column(length = 3)
    private String moeda;

    @Column(nullable = false)
    private boolean habilitada;

    protected PoliticaAquisicao() {
    }

    public void atualizar(String provedoresJson, boolean permitirIntervencao,
                          int timeoutHumanoMinutos, boolean fallbackPago,
                          BigDecimal custoMaximo, String moeda, boolean habilitada) {
        this.provedoresJson = provedoresJson;
        this.permitirIntervencao = permitirIntervencao;
        this.timeoutHumanoMinutos = Math.max(1, Math.min(timeoutHumanoMinutos, 1440));
        this.fallbackPago = fallbackPago;
        this.custoMaximo = custoMaximo;
        this.moeda = moeda == null || moeda.isBlank() ? null : moeda.trim().toUpperCase();
        this.habilitada = habilitada;
    }

    public String getOperacao() { return operacao; }
    public String getProvedoresJson() { return provedoresJson; }
    public boolean isPermitirIntervencao() { return permitirIntervencao; }
    public int getTimeoutHumanoMinutos() { return timeoutHumanoMinutos; }
    public boolean isFallbackPago() { return fallbackPago; }
    public BigDecimal getCustoMaximo() { return custoMaximo; }
    public String getMoeda() { return moeda; }
    public boolean isHabilitada() { return habilitada; }
}
