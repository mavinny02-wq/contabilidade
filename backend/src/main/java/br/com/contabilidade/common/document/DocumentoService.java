package br.com.contabilidade.common.document;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentoService {

    private static final Set<String> MIME_TYPES_PERMITIDOS = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "text/plain",
            "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final DocumentoRepository repository;
    private final EmpresaRepository empresaRepository;
    private final ArmazenamentoDocumento armazenamento;
    private final AuditoriaService auditoriaService;
    private final long tamanhoMaximoBytes;

    public DocumentoService(
            DocumentoRepository repository,
            EmpresaRepository empresaRepository,
            ArmazenamentoDocumento armazenamento,
            AuditoriaService auditoriaService,
            @Value("${app.storage.max-file-size-bytes:26214400}") long tamanhoMaximoBytes
    ) {
        this.repository = repository;
        this.empresaRepository = empresaRepository;
        this.armazenamento = armazenamento;
        this.auditoriaService = auditoriaService;
        this.tamanhoMaximoBytes = tamanhoMaximoBytes;
    }

    @Transactional
    public DocumentoResponse enviar(
            UUID empresaId,
            String tipo,
            MultipartFile arquivo,
            LocalDate emitidoEm,
            LocalDate validoAte
    ) {
        if (!empresaRepository.existsById(empresaId)) {
            throw new RecursoNaoEncontradoException("EMPRESA_NAO_ENCONTRADA", "erros.empresaNaoEncontrada");
        }
        validarArquivo(arquivo);
        String hash = hash(arquivo);
        return repository.findByEmpresaIdAndHashSha256AndAtivoTrue(empresaId, hash)
                .map(DocumentoResponse::de)
                .orElseGet(() -> salvarNovo(empresaId, tipo, arquivo, emitidoEm, validoAte, hash));
    }

    @Transactional(readOnly = true)
    public Page<DocumentoResponse> listar(UUID empresaId, int pagina, int tamanho) {
        return repository.findByEmpresaIdAndAtivoTrueOrderByCriadoEmDesc(
                empresaId,
                PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100))
        ).map(DocumentoResponse::de);
    }

    @Transactional(readOnly = true)
    public DownloadDocumento carregar(UUID id) {
        Documento documento = repository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "DOCUMENTO_NAO_ENCONTRADO",
                        "erros.documentoNaoEncontrado"
                ));
        auditoriaService.registrar(
                "DOCUMENTO_BAIXADO",
                "DOCUMENTO",
                id,
                Map.of("empresaId", documento.getEmpresaId())
        );
        return new DownloadDocumento(
                documento.getNomeOriginal(),
                documento.getMimeType(),
                armazenamento.carregar(documento.getReferenciaStorage())
        );
    }

    public long contarAtivos() {
        return repository.countByAtivoTrue();
    }

    private DocumentoResponse salvarNovo(
            UUID empresaId,
            String tipo,
            MultipartFile arquivo,
            LocalDate emitidoEm,
            LocalDate validoAte,
            String hash
    ) {
        UUID documentoId = UUID.randomUUID();
        String data = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String extensao = extensaoSegura(arquivo.getOriginalFilename());
        String referencia = empresaId + "/" + data + "/" + documentoId + extensao;

        try (InputStream input = arquivo.getInputStream()) {
            String referenciaSalva = armazenamento.salvar(referencia, input);
            Documento documento = repository.save(new Documento(
                    empresaId,
                    tipo == null || tipo.isBlank() ? "OUTRO" : tipo.trim().toUpperCase(),
                    nomeSeguro(arquivo.getOriginalFilename()),
                    arquivo.getContentType(),
                    arquivo.getSize(),
                    hash,
                    OrigemDocumento.USUARIO,
                    referenciaSalva,
                    emitidoEm,
                    validoAte
            ));
            auditoriaService.registrar(
                    "DOCUMENTO_ENVIADO",
                    "DOCUMENTO",
                    documento.getId(),
                    Map.of("empresaId", empresaId, "tipo", documento.getTipo())
            );
            return DocumentoResponse.de(documento);
        } catch (IOException exception) {
            throw new ExcecaoNegocio(
                    "DOCUMENTO_NAO_LIDO",
                    "erros.documentoNaoLido",
                    HttpStatus.BAD_REQUEST,
                    exception
            );
        }
    }

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ExcecaoNegocio("ARQUIVO_VAZIO", "erros.arquivoVazio", HttpStatus.BAD_REQUEST);
        }
        if (arquivo.getSize() > tamanhoMaximoBytes) {
            throw new ExcecaoNegocio(
                    "ARQUIVO_MUITO_GRANDE",
                    "erros.arquivoMuitoGrande",
                    HttpStatus.PAYLOAD_TOO_LARGE
            );
        }
        String contentType = arquivo.getContentType();
        if (contentType == null || !MIME_TYPES_PERMITIDOS.contains(contentType)) {
            throw new ExcecaoNegocio(
                    "TIPO_ARQUIVO_NAO_PERMITIDO",
                    "erros.tipoArquivoNaoPermitido",
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE
            );
        }
    }

    private String hash(MultipartFile arquivo) {
        try (InputStream input = arquivo.getInputStream()) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int lidos;
            while ((lidos = input.read(buffer)) >= 0) {
                digest.update(buffer, 0, lidos);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Não foi possível calcular hash do documento", exception);
        }
    }

    private String nomeSeguro(String nome) {
        if (nome == null || nome.isBlank()) {
            return "documento";
        }
        return nome.replaceAll("[\\r\\n]", "_").replaceAll("[^\\p{L}\\p{N}._ -]", "_");
    }

    private String extensaoSegura(String nome) {
        if (nome == null) {
            return "";
        }
        int indice = nome.lastIndexOf('.');
        if (indice < 0 || indice == nome.length() - 1) {
            return "";
        }
        String extensao = nome.substring(indice).toLowerCase();
        return extensao.matches("\\.[a-z0-9]{1,10}") ? extensao : "";
    }

    public record DocumentoResponse(
            UUID id,
            UUID empresaId,
            String tipo,
            String nomeOriginal,
            String mimeType,
            long tamanhoBytes,
            String hashSha256,
            OrigemDocumento origem,
            LocalDate emitidoEm,
            LocalDate validoAte,
            java.time.Instant criadoEm
    ) {
        static DocumentoResponse de(Documento documento) {
            return new DocumentoResponse(
                    documento.getId(),
                    documento.getEmpresaId(),
                    documento.getTipo(),
                    documento.getNomeOriginal(),
                    documento.getMimeType(),
                    documento.getTamanhoBytes(),
                    documento.getHashSha256(),
                    documento.getOrigem(),
                    documento.getEmitidoEm(),
                    documento.getValidoAte(),
                    documento.getCriadoEm()
            );
        }
    }

    public record DownloadDocumento(String nome, String mimeType, Resource resource) {
    }
}
