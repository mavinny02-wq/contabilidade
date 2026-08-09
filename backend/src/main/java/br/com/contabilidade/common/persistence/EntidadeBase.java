package br.com.contabilidade.common.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@MappedSuperclass
public abstract class EntidadeBase {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Version
    @Column(nullable = false)
    private long versao;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected EntidadeBase() {
        this.id = UUID.randomUUID();
    }

    @PrePersist
    protected void antesDePersistir() {
        Instant agora = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        criadoEm = agora;
        atualizadoEm = agora;
    }

    @PreUpdate
    protected void antesDeAtualizar() {
        atualizadoEm = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public long getVersao() {
        return versao;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public Instant getAtualizadoEm() {
        return atualizadoEm;
    }
}
