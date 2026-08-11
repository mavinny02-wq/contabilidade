package br.com.contabilidade.common.audit;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    private final AuditoriaConsultaExportacaoService service;

    public AuditoriaController(AuditoriaConsultaExportacaoService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('AUDITORIA_LER')")
    public Page<EventoAuditoriaResponse> listar(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "30") int tamanho,
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) String recursoTipo,
            @RequestParam(required = false) String ator,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        return service.listar(pagina, tamanho, acao, recursoTipo, ator, inicio, fim)
                .map(EventoAuditoriaResponse::de);
    }

    @GetMapping(value = "/exportacao.csv", produces = "text/csv;charset=UTF-8")
    @PreAuthorize("@permissaoService.tem('AUDITORIA_LER')")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) String recursoTipo,
            @RequestParam(required = false) String ator,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        AuditoriaConsultaExportacaoService.ExportacaoCsv exportacao = service.exportar(
                acao,
                recursoTipo,
                ator,
                inicio,
                fim
        );
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(exportacao.nomeArquivo(), StandardCharsets.UTF_8)
                .build();
        byte[] conteudo = exportacao.conteudo();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .contentLength(conteudo.length)
                .body(conteudo);
    }

    public record EventoAuditoriaResponse(
            UUID id,
            String acao,
            String recursoTipo,
            UUID recursoId,
            String ator,
            String correlationId,
            String detalhesJson,
            Instant criadoEm
    ) {
        static EventoAuditoriaResponse de(EventoAuditoria evento) {
            return new EventoAuditoriaResponse(
                    evento.getId(),
                    evento.getAcao(),
                    evento.getRecursoTipo(),
                    evento.getRecursoId(),
                    evento.getAtor(),
                    evento.getCorrelationId(),
                    evento.getDetalhesJson(),
                    evento.getCriadoEm()
            );
        }
    }
}
