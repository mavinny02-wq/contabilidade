package br.com.contabilidade.empresa.importacao;

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
@RequestMapping("/api/empresas/importacao-csv")
public class EmpresaImportacaoCsvController {

    private final EmpresaImportacaoCsvService service;

    public EmpresaImportacaoCsvController(EmpresaImportacaoCsvService service) {
        this.service = service;
    }

    @GetMapping(value = "/modelo", produces = "text/csv;charset=UTF-8")
    @PreAuthorize("@permissaoService.tem('EMPRESA_EDITAR')")
    public ResponseEntity<byte[]> modelo() {
        byte[] conteudo = service.modelo();
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("modelo-importacao-empresas.csv", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .contentLength(conteudo.length)
                .body(conteudo);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permissaoService.tem('EMPRESA_EDITAR')")
    public EmpresaImportacaoCsvService.ResultadoImportacao importar(
            @RequestParam MultipartFile arquivo,
            @RequestParam(defaultValue = "true") boolean somenteValidar
    ) {
        return service.importar(arquivo, somenteValidar);
    }
}
