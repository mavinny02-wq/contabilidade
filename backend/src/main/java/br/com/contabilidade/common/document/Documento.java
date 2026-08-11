package br.com.contabilidade.common.document;

import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "documentos")
public class Documento extends EntidadeBase {

    @Column(name = "empresa_id", nullable = false)
    private UUID empresaId;

    @Column(nullable = false, length = 100)
    private String tipo;

    @Column(name = "nome_original", nullable = false, length = 255)
    private String nomeOriginal;

    @Column(name = "mime_type", nullable = false, length = 150)
    private String mimeType;

    @Column(name = "tamanho_bytes", nullable = false)
    private long tamanhoBytes;

    @Column(name = "hash_sha256", nullable = false, length = 64)
    private String hashSha256;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private OrigemDocumento origem;

    @Column(name = "referencia_storage", nullable = false, unique = true, length = 500)
    private String referenciaStorage;

    @Column(name = "emitido_em")
    private LocalDate emitidoEm;

    @Column(name = "valido_ate")
    private LocalDate validoAte;

    @Column(nullable = false)
    private boolean ativo = true;

    protected Documento() {
    }

    public Documento(
            UUID empresaId,
            String tipo,
            String nomeOriginal,
            String mimeType,
            long tamanhoBytes,
            String hashSha256,
            OrigemDocumento origem,
            String referenciaStorage,
            LocalDate emitidoEm,
            LocalDate validoAte
    ) {
        this.empresaId = empresaId;
        this.tipo = tipo;
        this.nomeOriginal = nomeOriginal;
        this.mimeType = mimeType;
        this.tamanhoBytes = tamanhoBytes;
        this.hashSha256 = hashSha256;
        this.origem = origem;
        this.referenciaStorage = referenciaStorage;
        this.emitidoEm = emitidoEm;
        this.validoAte = validoAte;
    }

    public void atualizarMetadados(String tipo, LocalDate emitidoEm, LocalDate validoAte) {
        String tipoNormalizado = Objects.requireNonNull(tipo, "tipo").trim().toUpperCase(Locale.ROOT);
        if (tipoNormalizado.isBlank()) {
            throw new IllegalArgumentException("O tipo do documento é obrigatório");
        }
        if (emitidoEm != null && validoAte != null && validoAte.isBefore(emitidoEm)) {
            throw new IllegalArgumentException("A validade não pode ser anterior à emissão");
        }
        this.tipo = tipoNormalizado;
        this.emitidoEm = emitidoEm;
        this.validoAte = validoAte;
    }

    public void inativar() {
        ativo = false;
    }

    public UUID getEmpresaId() { return empresaId; }
    public String getTipo() { return tipo; }
    public String getNomeOriginal() { return nomeOriginal; }
    public String getMimeType() { return mimeType; }
    public long getTamanhoBytes() { return tamanhoBytes; }
    public String getHashSha256() { return hashSha256; }
    public OrigemDocumento getOrigem() { return origem; }
    public String getReferenciaStorage() { return referenciaStorage; }
    public LocalDate getEmitidoEm() { return emitidoEm; }
    public LocalDate getValidoAte() { return validoAte; }
    public boolean isAtivo() { return ativo; }
}
