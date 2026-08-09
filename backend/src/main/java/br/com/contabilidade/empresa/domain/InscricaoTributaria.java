package br.com.contabilidade.empresa.domain;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "inscricoes_tributarias")
public class InscricaoTributaria extends EntidadeBase {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estabelecimento_id", nullable = false)
    private Estabelecimento estabelecimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoInscricaoTributaria tipo;

    @Column(nullable = false, length = 60)
    private String numero;

    @Column(length = 2)
    private String uf;

    @Column(length = 100)
    private String municipio;

    protected InscricaoTributaria() {
    }

    public InscricaoTributaria(Estabelecimento estabelecimento, TipoInscricaoTributaria tipo,
                               String numero, String uf, String municipio) {
        this.estabelecimento = estabelecimento;
        this.tipo = tipo;
        this.numero = numero;
        this.uf = uf == null || uf.isBlank() ? null : uf.trim().toUpperCase();
        this.municipio = municipio == null || municipio.isBlank() ? null : municipio.trim();
    }

    public TipoInscricaoTributaria getTipo() { return tipo; }
    public String getNumero() { return numero; }
    public String getUf() { return uf; }
    public String getMunicipio() { return municipio; }
}
