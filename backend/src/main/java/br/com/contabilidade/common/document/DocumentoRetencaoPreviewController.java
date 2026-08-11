package br.com.contabilidade.common.document;

import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documentos/retencao-preview")
public class DocumentoRetencaoPreviewController {

    private final DocumentoRetencaoPreviewService service;

    public DocumentoRetencaoPreviewController(DocumentoRetencaoPreviewService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('DOCUMENTO_LER')")
    public DocumentoRetencaoPreviewService.PreviewRetencao analisar(
            @RequestParam(required = false) UUID empresaId
    ) {
        return service.analisar(empresaId);
    }
}
