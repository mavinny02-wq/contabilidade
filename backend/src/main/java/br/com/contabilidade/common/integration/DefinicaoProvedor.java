package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "definicoes_provedor")
public class DefinicaoProvedor extends EntidadeBase {

    @Column(nullable = false, unique = true, length = 100)
    private String codigo;

    @Column(nullable = false, length = 160)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoProvedor tipo;

    @Column(nullable = false)
    private boolean habilitado;

    @Column(nullable = false)
    private int prioridade;

    @Column(name = "timeout_segundos", nullable = false)
    private int timeoutSegundos;

    @Column(name = "max_retries", nullable = false)
    private int maxRetries;

    @Column(name = "base_url", length = 500)
    private String baseUrl;

    @Column(name = "referencia_segredo", length = 200)
    private String referenciaSegredo;

    protected DefinicaoProvedor() {
    }

    public void atualizar(
            boolean habilitado,
            int prioridade,
            int timeoutSegundos,
            int maxRetries,
            String baseUrl,
            String referenciaSegredo
    ) {
        this.habilitado = habilitado;
        this.prioridade = Math.max(prioridade, 0);
        this.timeoutSegundos = Math.max(timeoutSegundos, 1);
        this.maxRetries = Math.max(maxRetries, 0);
        this.baseUrl = limpar(baseUrl);
        this.referenciaSegredo = limpar(referenciaSegredo);
    }

    public String getCodigo() { return codigo; }
    public String getNome() { return nome; }
    public TipoProvedor getTipo() { return tipo; }
    public boolean isHabilitado() { return habilitado; }
    public int getPrioridade() { return prioridade; }
    public int getTimeoutSegundos() { return timeoutSegundos; }
    public int getMaxRetries() { return maxRetries; }
    public String getBaseUrl() { return baseUrl; }
    public String getReferenciaSegredo() { return referenciaSegredo; }

    private String limpar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
