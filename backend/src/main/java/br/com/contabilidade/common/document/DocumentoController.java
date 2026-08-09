package br.com.contabilidade.common.document;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {

    private final DocumentoService service;

    public DocumentoController(DocumentoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('DOCUMENTO_LER')")
    public Page<DocumentoService.DocumentoResponse> listar(
            @RequestParam UUID empresaId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho
    ) {
        return service.listar(empresaId, pagina, tamanho);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permissaoService.tem('DOCUMENTO_ENVIAR')")
    public DocumentoService.DocumentoResponse enviar(
            @RequestParam UUID empresaId,
            @RequestParam String tipo,
            @RequestParam MultipartFile arquivo,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate emitidoEm,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validoAte
    ) {
        return service.enviar(empresaId, tipo, arquivo, emitidoEm, validoAte);
    }

    @GetMapping("/{id}/conteudo")
    @PreAuthorize("@permissaoService.tem('DOCUMENTO_BAIXAR')")
    public ResponseEntity<Resource> baixar(@PathVariable UUID id) {
        DocumentoService.DownloadDocumento download = service.carregar(id);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(download.nome(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.parseMediaType(download.mimeType()))
                .body(download.resource());
    }
}
