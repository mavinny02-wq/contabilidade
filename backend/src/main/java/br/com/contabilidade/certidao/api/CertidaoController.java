package br.com.contabilidade.certidao.api;

import br.com.contabilidade.certidao.domain.ResultadoCertidao;
import br.com.contabilidade.certidao.domain.StatusCertidao;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.certidao.service.CertidaoExportacaoCsvService;
import br.com.contabilidade.certidao.service.CertidaoService;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api/certidoes")
public class CertidaoController {

    private final CertidaoService service;
    private final CertidaoExportacaoCsvService exportacaoCsvService;

    public CertidaoController(
            CertidaoService service,
            CertidaoExportacaoCsvService exportacaoCsvService
    ) {
        this.service = service;
        this.exportacaoCsvService = exportacaoCsvService;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('CERTIDAO_LER')")
    public List<CertidaoResponse> listar(@RequestParam(required = false) UUID empresaId) {
        return empresaId == null ? service.listarTodas() : service.listarPorEmpresa(empresaId);
    }

    @GetMapping(value = "/exportacao.csv", produces = "text/csv;charset=UTF-8")
    @PreAuthorize("@permissaoService.tem('CERTIDAO_LER')")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) UUID empresaId,
            @RequestParam(required = false) TipoCertidao tipo,
            @RequestParam(required = false) StatusCertidao status
    ) {
        CertidaoExportacaoCsvService.ExportacaoCsv exportacao = exportacaoCsvService.exportar(
                empresaId,
                tipo,
                status
        );
        byte[] conteudo = exportacao.conteudo();
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(exportacao.nomeArquivo(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .contentLength(conteudo.length)
                .body(conteudo);
    }

    @PostMapping("/{id}/solicitar")
    @PreAuthorize("@permissaoService.tem('CERTIDAO_SOLICITAR')")
    public CertidaoResponse solicitar(@PathVariable UUID id,
                                      @RequestParam(required = false) @Size(max = 200) String idempotencyKey) {
        return service.solicitar(id, idempotencyKey);
    }

    @PostMapping("/solicitar-todas")
    @PreAuthorize("@permissaoService.tem('CERTIDAO_SOLICITAR')")
    public List<CertidaoResponse> solicitarTodas(@RequestParam UUID empresaId) {
        return service.solicitarTodas(empresaId);
    }

    @PostMapping(value = "/{id}/resultado-manual", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permissaoService.tem('CERTIDAO_REGISTRAR_MANUAL')")
    public CertidaoResponse registrarManual(@PathVariable UUID id,
            @RequestParam ResultadoCertidao resultado,
            @RequestParam(required = false) @Size(max = 200) String numero,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate emitidaEm,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validaAte,
            @RequestParam(required = false) @Size(max = 1000) String mensagem,
            @RequestParam(required = false) MultipartFile arquivo) {
        return service.registrarManual(id, resultado, numero, emitidaEm, validaAte, mensagem, arquivo);
    }

    @GetMapping("/{id}/historico")
    @PreAuthorize("@permissaoService.tem('CERTIDAO_LER')")
    public Page<HistoricoCertidaoResponse> historico(@PathVariable UUID id,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho) {
        return service.historico(id, pagina, tamanho);
    }
}
