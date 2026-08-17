package br.com.contabilidade.common.document;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.AbstractResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ArmazenamentoLocalDocumento implements ArmazenamentoDocumento {

    private static final String PREFIXO_TEMPORARIO = ".documento-";

    private final Path raiz;
    private final long tamanhoMaximoLeitura;

    public ArmazenamentoLocalDocumento(
            @Value("${app.storage.local-path:./dados/documentos}") String localPath,
            @Value("${app.storage.max-file-size-bytes:26214400}") long tamanhoMaximoLeitura
    ) {
        this.raiz = Path.of(localPath).toAbsolutePath().normalize();
        this.tamanhoMaximoLeitura = Math.max(1, tamanhoMaximoLeitura);
        try {
            Files.createDirectories(raiz);
            if (Files.isSymbolicLink(raiz) || !Files.isDirectory(raiz, LinkOption.NOFOLLOW_LINKS)) {
                throw new IOException("raiz insegura");
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível preparar o storage local", exception);
        }
    }

    @Override
    public String salvar(String referenciaDesejada, InputStream conteudo) {
        Objects.requireNonNull(conteudo, "conteudo");
        Path destino = resolverSeguro(referenciaDesejada);
        Path temporario = null;
        try {
            prepararDiretorios(destino.getParent());
            validarComponentesSemLink(destino.getParent());
            if (Files.exists(destino, LinkOption.NOFOLLOW_LINKS)
                    && (!Files.isRegularFile(destino, LinkOption.NOFOLLOW_LINKS)
                    || Files.isSymbolicLink(destino))) {
                throw new IOException("destino inseguro");
            }
            temporario = Files.createTempFile(destino.getParent(), PREFIXO_TEMPORARIO, ".tmp");
            Files.copy(conteudo, temporario, StandardCopyOption.REPLACE_EXISTING);
            promover(temporario, destino);
            temporario = null;
            return referenciaNormalizada(destino);
        } catch (IOException exception) {
            throw erroInterno("DOCUMENTO_NAO_ARMAZENADO", "erros.documentoNaoArmazenado", exception);
        } finally {
            excluirSilenciosamente(temporario);
        }
    }

    @Override
    public Resource carregar(String referencia) {
        Path arquivo = resolverSeguro(referencia);
        validarArquivoRegular(arquivo);
        return new RecursoLocalSeguro(arquivo, tamanhoMaximoLeitura);
    }

    @Override
    public void remover(String referencia) {
        Path arquivo = resolverSeguro(referencia);
        try {
            validarComponentesSemLink(arquivo.getParent());
            if (!Files.exists(arquivo, LinkOption.NOFOLLOW_LINKS)) return;
            if (!Files.isRegularFile(arquivo, LinkOption.NOFOLLOW_LINKS) || Files.isSymbolicLink(arquivo)) {
                throw referenciaInvalida();
            }
            Files.deleteIfExists(arquivo);
        } catch (IOException exception) {
            throw erroInterno("DOCUMENTO_NAO_REMOVIDO", "erros.documentoNaoRemovido", exception);
        }
    }

    private void promover(Path temporario, Path destino) throws IOException {
        try {
            Files.move(temporario, destino, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException exception) {
            Files.move(temporario, destino, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private void prepararDiretorios(Path diretorio) throws IOException {
        Path relativo = raiz.relativize(diretorio);
        Path atual = raiz;
        for (Path componente : relativo) {
            atual = atual.resolve(componente);
            if (Files.exists(atual, LinkOption.NOFOLLOW_LINKS)) {
                if (Files.isSymbolicLink(atual) || !Files.isDirectory(atual, LinkOption.NOFOLLOW_LINKS)) {
                    throw new IOException("diretório inseguro");
                }
            } else {
                Files.createDirectory(atual);
            }
        }
    }

    private void validarArquivoRegular(Path arquivo) {
        try {
            validarComponentesSemLink(arquivo.getParent());
            if (!Files.isRegularFile(arquivo, LinkOption.NOFOLLOW_LINKS) || Files.isSymbolicLink(arquivo)
                    || Files.size(arquivo) > tamanhoMaximoLeitura) {
                throw arquivoNaoEncontrado();
            }
        } catch (IOException exception) {
            throw arquivoNaoEncontrado(exception);
        }
    }

    private void validarComponentesSemLink(Path diretorio) throws IOException {
        Path atual = raiz;
        for (Path componente : raiz.relativize(diretorio)) {
            atual = atual.resolve(componente);
            if (Files.isSymbolicLink(atual) || !Files.isDirectory(atual, LinkOption.NOFOLLOW_LINKS)) {
                throw new IOException("componente inseguro");
            }
        }
    }

    private Path resolverSeguro(String referencia) {
        if (referencia == null || referencia.isBlank() || referencia.indexOf('%') >= 0
                || referencia.indexOf('\0') >= 0) {
            throw referenciaInvalida();
        }
        final Path relativa;
        try {
            relativa = Path.of(referencia);
        } catch (RuntimeException exception) {
            throw referenciaInvalida();
        }
        if (relativa.isAbsolute() || !relativa.equals(relativa.normalize()) || relativa.getNameCount() == 0) {
            throw referenciaInvalida();
        }
        Path resolvido = raiz.resolve(relativa).normalize();
        if (!resolvido.startsWith(raiz) || resolvido.equals(raiz)) throw referenciaInvalida();
        return resolvido;
    }

    private String referenciaNormalizada(Path arquivo) {
        return raiz.relativize(arquivo).toString().replace('\\', '/');
    }

    private void excluirSilenciosamente(Path temporario) {
        if (temporario == null) return;
        try {
            Files.deleteIfExists(temporario);
        } catch (IOException ignored) {
            // A falha original é a causa autoritativa; não expomos caminhos do storage.
        }
    }

    private ExcecaoNegocio referenciaInvalida() {
        return new ExcecaoNegocio("REFERENCIA_STORAGE_INVALIDA", "erros.referenciaStorageInvalida",
                HttpStatus.BAD_REQUEST);
    }

    private ExcecaoNegocio arquivoNaoEncontrado() {
        return new ExcecaoNegocio("ARQUIVO_NAO_ENCONTRADO", "erros.arquivoNaoEncontrado",
                HttpStatus.NOT_FOUND);
    }

    private ExcecaoNegocio arquivoNaoEncontrado(Exception exception) {
        return new ExcecaoNegocio("ARQUIVO_NAO_ENCONTRADO", "erros.arquivoNaoEncontrado",
                HttpStatus.NOT_FOUND, exception);
    }

    private ExcecaoNegocio erroInterno(String codigo, String mensagem, IOException exception) {
        return new ExcecaoNegocio(codigo, mensagem, HttpStatus.INTERNAL_SERVER_ERROR, exception);
    }

    private static final class RecursoLocalSeguro extends AbstractResource {
        private final Path arquivo;
        private final long limite;

        private RecursoLocalSeguro(Path arquivo, long limite) {
            this.arquivo = arquivo;
            this.limite = limite;
        }

        @Override
        public String getDescription() {
            return "documento armazenado localmente";
        }

        @Override
        public InputStream getInputStream() throws IOException {
            if (!Files.isRegularFile(arquivo, LinkOption.NOFOLLOW_LINKS) || Files.isSymbolicLink(arquivo)
                    || Files.size(arquivo) > limite) {
                throw new IOException("documento indisponível");
            }
            return new FilterInputStream(Files.newInputStream(arquivo, StandardOpenOption.READ)) {
                private long lidos;

                @Override
                public int read() throws IOException {
                    int valor = super.read();
                    if (valor >= 0 && ++lidos > limite) throw new IOException("limite de leitura excedido");
                    return valor;
                }

                @Override
                public int read(byte[] bytes, int offset, int comprimento) throws IOException {
                    int quantidade = super.read(bytes, offset, (int) Math.min(comprimento, limite - lidos + 1));
                    if (quantidade > 0 && (lidos += quantidade) > limite) {
                        throw new IOException("limite de leitura excedido");
                    }
                    return quantidade;
                }
            };
        }
    }
}
