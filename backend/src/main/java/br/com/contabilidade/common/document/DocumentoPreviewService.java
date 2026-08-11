package br.com.contabilidade.common.document;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DocumentoPreviewService {

    private static final Set<String> MIME_TYPES_PREVISUALIZAVEIS = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg"
    );

    private final DocumentoService documentoService;
    private final DocumentoIntegridadeService integridadeService;
    private final AuditoriaService auditoriaService;

    public DocumentoPreviewService(
            DocumentoService documentoService,
            DocumentoIntegridadeService integridadeService,
            AuditoriaService auditoriaService
    ) {
        this.documentoService = documentoService;
        this.integridadeService = integridadeService;
        this.auditoriaService = auditoriaService;
    }

    public PreviewDocumento carregar(UUID id) {
        Documento documento = documentoService.obterAtivo(id);
        if (!MIME_TYPES_PREVISUALIZAVEIS.contains(documento.getMimeType())) {
            throw new ExcecaoNegocio(
                    "DOCUMENTO_PREVIEW_NAO_SUPORTADO",
                    "erros.documentoPreviewNaoSuportado",
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE
            );
        }

        DocumentoIntegridadeService.ConteudoVerificado conteudo = integridadeService.carregarVerificado(documento);
        auditoriaService.registrar(
                "DOCUMENTO_PREVISUALIZADO",
                "DOCUMENTO",
                id,
                Map.of(
                        "empresaId", documento.getEmpresaId(),
                        "mimeType", documento.getMimeType(),
                        "integridade", "SHA256_VERIFICADO",
                        "tamanhoBytes", conteudo.tamanhoBytes()
                )
        );
        return new PreviewDocumento(
                documento.getNomeOriginal(),
                documento.getMimeType(),
                conteudo.tamanhoBytes(),
                conteudo.resource()
        );
    }

    public boolean suportado(String mimeType) {
        return mimeType != null && MIME_TYPES_PREVISUALIZAVEIS.contains(mimeType);
    }

    public record PreviewDocumento(
            String nome,
            String mimeType,
            long tamanhoBytes,
            Resource resource
    ) {
    }
}
