package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Objects;

@Entity
@Table(
        name = "faturas_provedor",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_fatura_provedor_competencia",
                columnNames = {"provedor_codigo", "competencia_inicio", "competencia_fim", "moeda"}
        )
)
public class FaturaProvedor extends EntidadeBase {

    @Column(name = "provedor_codigo", nullable = false, length = 100, updatable = false)
    private String provedorCodigo;

    @Column(name = "competencia_inicio", nullable = false, updatable = false)
    private LocalDate competenciaInicio;

    @Column(name = "competencia_fim", nullable = false, updatable = false)
    private LocalDate competenciaFim;

    @Column(nullable = false, length = 3, updatable = false)
    private String moeda;

    @Column(name = "valor_faturado", nullable = false, precision = 14, scale = 4)
    private BigDecimal valorFaturado;

    @Column(length = 120)
    private String referencia;

    @Column(length = 500)
    private String observacao;

    protected FaturaProvedor() {
    }

    public FaturaProvedor(
            String provedorCodigo,
            LocalDate competenciaInicio,
            LocalDate competenciaFim,
            String moeda
    ) {
        this.provedorCodigo = Objects.requireNonNull(provedorCodigo, "provedorCodigo").trim();
        this.competenciaInicio = Objects.requireNonNull(competenciaInicio, "competenciaInicio");
        this.competenciaFim = Objects.requireNonNull(competenciaFim, "competenciaFim");
        this.moeda = Objects.requireNonNull(moeda, "moeda").trim().toUpperCase(Locale.ROOT);
    }

    public void atualizar(BigDecimal valorFaturado, String referencia, String observacao) {
        this.valorFaturado = Objects.requireNonNull(valorFaturado, "valorFaturado");
        this.referencia = limpar(referencia, 120);
        this.observacao = limpar(observacao, 500);
    }

    public String getProvedorCodigo() { return provedorCodigo; }
    public LocalDate getCompetenciaInicio() { return competenciaInicio; }
    public LocalDate getCompetenciaFim() { return competenciaFim; }
    public String getMoeda() { return moeda; }
    public BigDecimal getValorFaturado() { return valorFaturado; }
    public String getReferencia() { return referencia; }
    public String getObservacao() { return observacao; }

    private String limpar(String valor, int maximo) {
        if (valor == null || valor.isBlank()) return null;
        String limpo = valor.trim().replaceAll("\\s+", " ");
        return limpo.length() <= maximo ? limpo : limpo.substring(0, maximo);
    }
}
