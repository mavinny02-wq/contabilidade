package br.com.contabilidade.common.worker;

import br.com.contabilidade.common.document.DocumentoService;
import br.com.contabilidade.common.document.OrigemDocumento;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/interno/workers/documentos")
public class WorkerDocumentController {

    private static final Set<OrigemDocumento> ORIGENS_PERMITIDAS = EnumSet.of(
            OrigemDocumento.API_OFICIAL,
            OrigemDocumento.API_COMERCIAL,
            OrigemDocumento.PORTAL_AUTOMATIZADO,
            OrigemDocumento.PORTAL_ASSISTIDO,
            OrigemDocumento.SISTEMA
    );

    private final WorkerTokenService tokenService;
    private final DocumentoService documentoService;

    public WorkerDocumentController(
            WorkerTokenService tokenService,
            DocumentoService documentoService
    ) {
        this.tokenService = tokenService;
        this.documentoService = documentoService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentoService.DocumentoResponse enviar(
            @RequestHeader("X-Worker-Token") String token,
            @RequestParam UUID empresaId,
            @RequestParam String tipo,
            @RequestParam OrigemDocumento origem,
            @RequestParam MultipartFile arquivo,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate emitidoEm,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validoAte
    ) {
        tokenService.validar(token);
        if (!ORIGENS_PERMITIDAS.contains(origem)) {
            throw new ExcecaoNegocio(
                    "ORIGEM_DOCUMENTO_WORKER_INVALIDA",
                    "erros.origemDocumentoWorkerInvalida",
                    HttpStatus.BAD_REQUEST
            );
        }
        return documentoService.enviarComOrigem(
                empresaId,
                tipo,
                arquivo,
                emitidoEm,
                validoAte,
                origem
        );
    }
}
