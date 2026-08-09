package br.com.contabilidade.common.document;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ArmazenamentoLocalDocumento implements ArmazenamentoDocumento {

    private final Path raiz;

    public ArmazenamentoLocalDocumento(
            @Value("${app.storage.local-path:./dados/documentos}") String localPath
    ) {
        this.raiz = Path.of(localPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(raiz);
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível preparar o storage local", exception);
        }
    }

    @Override
    public String salvar(String referenciaDesejada, InputStream conteudo) {
        Path destino = resolverSeguro(referenciaDesejada);
        try {
            Files.createDirectories(destino.getParent());
            Files.copy(conteudo, destino, StandardCopyOption.REPLACE_EXISTING);
            return raiz.relativize(destino).toString().replace('\\', '/');
        } catch (IOException exception) {
            throw new ExcecaoNegocio(
                    "DOCUMENTO_NAO_ARMAZENADO",
                    "erros.documentoNaoArmazenado",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    exception
            );
        }
    }

    @Override
    public Resource carregar(String referencia) {
        Path arquivo = resolverSeguro(referencia);
        try {
            UrlResource resource = new UrlResource(arquivo.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ExcecaoNegocio(
                        "ARQUIVO_NAO_ENCONTRADO",
                        "erros.arquivoNaoEncontrado",
                        HttpStatus.NOT_FOUND
                );
            }
            return resource;
        } catch (java.net.MalformedURLException exception) {
            throw new ExcecaoNegocio(
                    "ARQUIVO_NAO_ENCONTRADO",
                    "erros.arquivoNaoEncontrado",
                    HttpStatus.NOT_FOUND,
                    exception
            );
        }
    }

    @Override
    public void remover(String referencia) {
        try {
            Files.deleteIfExists(resolverSeguro(referencia));
        } catch (IOException exception) {
            throw new ExcecaoNegocio(
                    "DOCUMENTO_NAO_REMOVIDO",
                    "erros.documentoNaoRemovido",
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    exception
            );
        }
    }

    private Path resolverSeguro(String referencia) {
        Path resolvido = raiz.resolve(referencia).normalize();
        if (!resolvido.startsWith(raiz)) {
            throw new ExcecaoNegocio(
                    "REFERENCIA_STORAGE_INVALIDA",
                    "erros.referenciaStorageInvalida",
                    HttpStatus.BAD_REQUEST
            );
        }
        return resolvido;
    }
}
