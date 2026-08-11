package br.com.contabilidade.empresa.domain;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(
        name = "empresa_responsaveis_modulo",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_empresa_responsavel_modulo",
                columnNames = {"empresa_id", "modulo"}
        )
)
public class ResponsavelModuloEmpresa extends EntidadeBase {

    @Column(name = "empresa_id", nullable = false, updatable = false)
    private UUID empresaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40, updatable = false)
    private ModuloEmpresa modulo;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(length = 200)
    private String email;

    @Column(length = 40)
    private String telefone;

    @Column(nullable = false)
    private boolean ativo = true;

    protected ResponsavelModuloEmpresa() {
    }

    public ResponsavelModuloEmpresa(UUID empresaId, ModuloEmpresa modulo) {
        this.empresaId = Objects.requireNonNull(empresaId, "empresaId");
        this.modulo = Objects.requireNonNull(modulo, "modulo");
    }

    public void atualizar(String nome, String email, String telefone, boolean ativo) {
        this.nome = Objects.requireNonNull(nome, "nome").trim();
        this.email = limpar(email);
        this.telefone = limpar(telefone);
        this.ativo = ativo;
    }

    public UUID getEmpresaId() { return empresaId; }
    public ModuloEmpresa getModulo() { return modulo; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public boolean isAtivo() { return ativo; }

    private String limpar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim().replaceAll("\\s+", " ");
    }
}
