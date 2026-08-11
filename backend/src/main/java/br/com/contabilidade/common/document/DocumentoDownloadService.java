package br.com.contabilidade.common.document;

import br.com.contabilidade.common.audit.AuditoriaService;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class DocumentoDownloadService {

    private final DocumentoService documentoService;
    private final DocumentoIntegridadeService integridadeService;
    private final AuditoriaService auditoriaService;

    public DocumentoDownloadService(
            DocumentoService documentoService,
            DocumentoIntegridadeService integridadeService,
            AuditoriaService auditoriaService
    ) {
        this.documentoService = documentoService;
        this.integridadeService = integridadeService;
        this.auditoriaService = auditoriaService;
    }

    public DownloadDocumento carregar(UUID id) {
        Documento documento = documentoService.obterAtivo(id);
        DocumentoIntegridadeService.ConteudoVerificado conteudo = integridadeService.carregarVerificado(documento);

        auditoriaService.registrar(
                "DOCUMENTO_BAIXADO",
                "DOCUMENTO",
                id,
                Map.of(
                        "empresaId", documento.getEmpresaId(),
                        "integridade", "SHA256_VERIFICADO",
                        "tamanhoBytes", conteudo.tamanhoBytes()
                )
        );

        return new DownloadDocumento(
                documento.getNomeOriginal(),
                documento.getMimeType(),
                conteudo.tamanhoBytes(),
                conteudo.resource()
        );
    }

    public record DownloadDocumento(
            String nome,
            String mimeType,
            long tamanhoBytes,
            Resource resource
    ) {
    }
}
