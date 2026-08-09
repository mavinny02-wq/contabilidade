package br.com.contabilidade.empresa.domain;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "estabelecimentos")
public class Estabelecimento extends EntidadeBase {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(nullable = false)
    private boolean matriz;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusEmpresa status;

    @Column(name = "cnae_principal", length = 10)
    private String cnaePrincipal;

    @Enumerated(EnumType.STRING)
    @Column(name = "regime_tributario", nullable = false, length = 30)
    private RegimeTributario regimeTributario;

    @Column(length = 200)
    private String logradouro;

    @Column(length = 20)
    private String numero;

    @Column(length = 100)
    private String complemento;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String municipio;

    @Column(length = 2)
    private String uf;

    @Column(length = 8)
    private String cep;

    @Column(nullable = false)
    private boolean ativo = true;

    @OneToMany(mappedBy = "estabelecimento", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<InscricaoTributaria> inscricoes = new ArrayList<>();

    protected Estabelecimento() {
    }

    public Estabelecimento(String cnpj, boolean matriz, StatusEmpresa status, String cnaePrincipal,
                           RegimeTributario regimeTributario) {
        this.cnpj = Cnpj.normalizarEValidar(cnpj);
        this.matriz = matriz;
        this.status = status == null ? StatusEmpresa.DESCONHECIDA : status;
        this.cnaePrincipal = limpar(cnaePrincipal);
        this.regimeTributario = regimeTributario == null ? RegimeTributario.NAO_INFORMADO : regimeTributario;
    }

    void vincular(Empresa empresa) {
        this.empresa = empresa;
    }

    public void atualizar(StatusEmpresa status, String cnaePrincipal, RegimeTributario regimeTributario,
                          String logradouro, String numero, String complemento, String bairro,
                          String municipio, String uf, String cep) {
        this.status = status == null ? StatusEmpresa.DESCONHECIDA : status;
        this.cnaePrincipal = limpar(cnaePrincipal);
        this.regimeTributario = regimeTributario == null ? RegimeTributario.NAO_INFORMADO : regimeTributario;
        this.logradouro = limpar(logradouro);
        this.numero = limpar(numero);
        this.complemento = limpar(complemento);
        this.bairro = limpar(bairro);
        this.municipio = limpar(municipio);
        this.uf = uf == null || uf.isBlank() ? null : uf.trim().toUpperCase();
        this.cep = cep == null || cep.isBlank() ? null : cep.replaceAll("\\D", "");
    }

    public void definirInscricao(TipoInscricaoTributaria tipo, String numero, String uf, String municipio) {
        inscricoes.removeIf(item -> item.getTipo() == tipo);
        if (numero != null && !numero.isBlank()) {
            inscricoes.add(new InscricaoTributaria(this, tipo, numero.trim(), uf, municipio));
        }
    }

    public void inativar() { this.ativo = false; }
    public void ativar() { this.ativo = true; }

    public Empresa getEmpresa() { return empresa; }
    public String getCnpj() { return cnpj; }
    public boolean isMatriz() { return matriz; }
    public StatusEmpresa getStatus() { return status; }
    public String getCnaePrincipal() { return cnaePrincipal; }
    public RegimeTributario getRegimeTributario() { return regimeTributario; }
    public String getLogradouro() { return logradouro; }
    public String getNumero() { return numero; }
    public String getComplemento() { return complemento; }
    public String getBairro() { return bairro; }
    public String getMunicipio() { return municipio; }
    public String getUf() { return uf; }
    public String getCep() { return cep; }
    public boolean isAtivo() { return ativo; }
    public List<InscricaoTributaria> getInscricoes() { return Collections.unmodifiableList(inscricoes); }

    public String inscricao(TipoInscricaoTributaria tipo) {
        return inscricoes.stream().filter(item -> item.getTipo() == tipo)
                .map(InscricaoTributaria::getNumero).findFirst().orElse(null);
    }

    private String limpar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
