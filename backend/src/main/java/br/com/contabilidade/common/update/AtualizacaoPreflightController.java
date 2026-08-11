package br.com.contabilidade.common.update;

import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/console-tecnica/atualizacoes")
public class AtualizacaoPreflightController {

    private final AtualizacaoPreflightService service;

    public AtualizacaoPreflightController(AtualizacaoPreflightService service) {
        this.service = service;
    }

    @PostMapping(value = "/preflight", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permissaoService.tem('CONSOLE_TECNICA_LER')")
    public AtualizacaoPreflightResponse validar(@RequestParam MultipartFile manifesto) {
        return service.validar(manifesto);
    }

    @GetMapping(value = "/modelo", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("@permissaoService.tem('CONSOLE_TECNICA_LER')")
    public ResponseEntity<byte[]> modelo() {
        byte[] conteudo = service.modelo();
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("manifesto-atualizacao-modelo.json", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.APPLICATION_JSON)
                .contentLength(conteudo.length)
                .body(conteudo);
    }
}
