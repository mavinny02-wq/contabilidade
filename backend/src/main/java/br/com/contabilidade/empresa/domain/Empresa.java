package br.com.contabilidade.empresa.domain;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "empresas")
public class Empresa extends EntidadeBase {

    @Column(name = "razao_social", nullable = false, length = 200)
    private String razaoSocial;

    @Column(name = "nome_fantasia", length = 200)
    private String nomeFantasia;

    @Column(nullable = false)
    private boolean ativa = true;

    @Column(name = "responsavel_nome", length = 160)
    private String responsavelNome;

    @Column(name = "responsavel_email", length = 200)
    private String responsavelEmail;

    @OneToMany(mappedBy = "empresa", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("matriz DESC, criadoEm ASC")
    private List<Estabelecimento> estabelecimentos = new ArrayList<>();

    protected Empresa() {
    }

    public Empresa(String razaoSocial, String nomeFantasia, String responsavelNome, String responsavelEmail) {
        this.razaoSocial = Objects.requireNonNull(razaoSocial, "razaoSocial").trim();
        this.nomeFantasia = limpar(nomeFantasia);
        this.responsavelNome = limpar(responsavelNome);
        this.responsavelEmail = limpar(responsavelEmail);
    }

    public void atualizarDados(String razaoSocial, String nomeFantasia, String responsavelNome, String responsavelEmail) {
        this.razaoSocial = Objects.requireNonNull(razaoSocial, "razaoSocial").trim();
        this.nomeFantasia = limpar(nomeFantasia);
        this.responsavelNome = limpar(responsavelNome);
        this.responsavelEmail = limpar(responsavelEmail);
    }

    public void adicionarEstabelecimento(Estabelecimento estabelecimento) {
        Objects.requireNonNull(estabelecimento, "estabelecimento");
        if (estabelecimento.isMatriz() && estabelecimentos.stream().anyMatch(Estabelecimento::isMatriz)) {
            throw new IllegalStateException("A empresa já possui estabelecimento matriz");
        }
        estabelecimento.vincular(this);
        estabelecimentos.add(estabelecimento);
    }

    public Estabelecimento matriz() {
        return estabelecimentos.stream().filter(Estabelecimento::isMatriz).findFirst()
                .orElseGet(() -> estabelecimentos.stream().findFirst().orElse(null));
    }

    public void ativar() {
        this.ativa = true;
    }

    public void inativar() {
        this.ativa = false;
    }

    public String getRazaoSocial() { return razaoSocial; }
    public String getNomeFantasia() { return nomeFantasia; }
    public boolean isAtiva() { return ativa; }
    public String getResponsavelNome() { return responsavelNome; }
    public String getResponsavelEmail() { return responsavelEmail; }
    public List<Estabelecimento> getEstabelecimentos() { return Collections.unmodifiableList(estabelecimentos); }

    private String limpar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
