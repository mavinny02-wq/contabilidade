package br.com.contabilidade.common.document;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Locale;
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
            "application/pdf", "image/png", "image/jpeg", "text/plain", "text/csv",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final DocumentoRepository repository;
    private final EmpresaRepository empresaRepository;
    private final ArmazenamentoDocumento armazenamento;
    private final AuditoriaService auditoriaService;
    private final long tamanhoMaximoBytes;

    public DocumentoService(DocumentoRepository repository,
                            EmpresaRepository empresaRepository,
                            ArmazenamentoDocumento armazenamento,
                            AuditoriaService auditoriaService,
                            @Value("${app.storage.max-file-size-bytes:26214400}") long tamanhoMaximoBytes) {
        this.repository = repository;
        this.empresaRepository = empresaRepository;
        this.armazenamento = armazenamento;
        this.auditoriaService = auditoriaService;
        this.tamanhoMaximoBytes = tamanhoMaximoBytes;
    }

    @Transactional
    public DocumentoResponse enviar(UUID empresaId, String tipo, MultipartFile arquivo,
                                     LocalDate emitidoEm, LocalDate validoAte) {
        return enviarComOrigem(empresaId, tipo, arquivo, emitidoEm, validoAte, OrigemDocumento.USUARIO);
    }

    @Transactional
    public DocumentoResponse enviarComOrigem(UUID empresaId, String tipo, MultipartFile arquivo,
                                              LocalDate emitidoEm, LocalDate validoAte,
                                              OrigemDocumento origem) {
        validarEmpresa(empresaId);
        String mimeType = validarArquivo(arquivo);
        String hash = hash(arquivo);
        return repository.findByEmpresaIdAndHashSha256AndAtivoTrue(empresaId, hash)
                .map(DocumentoResponse::de)
                .orElseGet(() -> salvarNovo(
                        empresaId, tipo, arquivo, emitidoEm, validoAte, hash, origem, mimeType));
    }

    @Transactional(readOnly = true)
    public Page<DocumentoResponse> listar(UUID empresaId, int pagina, int tamanho) {
        validarEmpresa(empresaId);
        return repository.findByEmpresaIdAndAtivoTrueOrderByCriadoEmDesc(
                empresaId, PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100)))
                .map(DocumentoResponse::de);
    }

    @Transactional(readOnly = true)
    public Documento obterAtivo(UUID id) {
        return repository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "DOCUMENTO_NAO_ENCONTRADO", "erros.documentoNaoEncontrado"));
    }

    @Transactional(readOnly = true)
    public Documento obterAtivoDaEmpresa(UUID id, UUID empresaId) {
        Documento documento = obterAtivo(id);
        if (!documento.getEmpresaId().equals(empresaId)) {
            throw new RecursoNaoEncontradoException("DOCUMENTO_NAO_ENCONTRADO", "erros.documentoNaoEncontrado");
        }
        return documento;
    }

    @Transactional
    public DownloadDocumento carregar(UUID id) {
        Documento documento = obterAtivo(id);
        auditoriaService.registrar("DOCUMENTO_BAIXADO", "DOCUMENTO", id,
                Map.of("empresaId", documento.getEmpresaId()));
        return new DownloadDocumento(documento.getNomeOriginal(), documento.getMimeType(),
                armazenamento.carregar(documento.getReferenciaStorage()));
    }

    public long contarAtivos() { return repository.countByAtivoTrue(); }

    private DocumentoResponse salvarNovo(UUID empresaId, String tipo, MultipartFile arquivo,
                                          LocalDate emitidoEm, LocalDate validoAte, String hash,
                                          OrigemDocumento origem, String mimeType) {
        UUID documentoId = UUID.randomUUID();
        String data = LocalDate.now(ZoneOffset.UTC).format(DateTimeFormatter.ofPattern("yyyy/MM"));
        String extensao = extensaoSegura(arquivo.getOriginalFilename());
        String referencia = empresaId + "/" + data + "/" + documentoId + extensao;
        String referenciaSalva = null;
        try (InputStream input = arquivo.getInputStream()) {
            referenciaSalva = armazenamento.salvar(referencia, input);
            Documento documento = repository.save(new Documento(
                    empresaId,
                    tipo == null || tipo.isBlank() ? "OUTRO" : tipo.trim().toUpperCase(Locale.ROOT),
                    nomeSeguro(arquivo.getOriginalFilename()),
                    mimeType, arquivo.getSize(), hash,
                    origem == null ? OrigemDocumento.USUARIO : origem,
                    referenciaSalva, emitidoEm, validoAte));
            repository.flush();
            auditoriaService.registrar("DOCUMENTO_ENVIADO", "DOCUMENTO", documento.getId(),
                    Map.of("empresaId", empresaId, "tipo", documento.getTipo(),
                            "origem", documento.getOrigem().name()));
            return DocumentoResponse.de(documento);
        } catch (IOException exception) {
            removerAposFalha(referenciaSalva, exception);
            throw new ExcecaoNegocio("DOCUMENTO_NAO_LIDO", "erros.documentoNaoLido",
                    HttpStatus.BAD_REQUEST, exception);
        } catch (RuntimeException exception) {
            removerAposFalha(referenciaSalva, exception);
            throw exception;
        }
    }

    private void validarEmpresa(UUID empresaId) {
        if (!empresaRepository.existsById(empresaId)) {
            throw new RecursoNaoEncontradoException("EMPRESA_NAO_ENCONTRADA", "erros.empresaNaoEncontrada");
        }
    }

    private String validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ExcecaoNegocio("ARQUIVO_VAZIO", "erros.arquivoVazio", HttpStatus.BAD_REQUEST);
        }
        if (arquivo.getSize() > tamanhoMaximoBytes) {
            throw new ExcecaoNegocio("ARQUIVO_MUITO_GRANDE", "erros.arquivoMuitoGrande",
                    HttpStatus.PAYLOAD_TOO_LARGE);
        }
        String contentType = arquivo.getContentType();
        String normalizado = contentType == null
                ? null
                : contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        if (normalizado == null || !MIME_TYPES_PERMITIDOS.contains(normalizado)) {
            throw new ExcecaoNegocio("TIPO_ARQUIVO_NAO_PERMITIDO", "erros.tipoArquivoNaoPermitido",
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
        validarAssinatura(arquivo, normalizado);
        return normalizado;
    }

    private void validarAssinatura(MultipartFile arquivo, String mimeType) {
        try (InputStream input = arquivo.getInputStream()) {
            byte[] inicio = input.readNBytes(4096);
            boolean valido = switch (mimeType) {
                case "application/pdf" -> iniciaCom(inicio, "%PDF-".getBytes(StandardCharsets.US_ASCII));
                case "image/png" -> iniciaCom(
                        inicio,
                        new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}
                );
                case "image/jpeg" -> inicio.length >= 3
                        && inicio[0] == (byte) 0xff
                        && inicio[1] == (byte) 0xd8
                        && inicio[2] == (byte) 0xff;
                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ->
                        iniciaCom(inicio, new byte[]{0x50, 0x4b, 0x03, 0x04});
                case "text/plain", "text/csv" -> !contemByteNulo(inicio);
                default -> false;
            };
            if (!valido) {
                throw new ExcecaoNegocio(
                        "CONTEUDO_ARQUIVO_INVALIDO",
                        "erros.conteudoArquivoInvalido",
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE
                );
            }
        } catch (IOException exception) {
            throw new ExcecaoNegocio(
                    "DOCUMENTO_NAO_LIDO",
                    "erros.documentoNaoLido",
                    HttpStatus.BAD_REQUEST,
                    exception
            );
        }
    }

    private boolean iniciaCom(byte[] conteudo, byte[] assinatura) {
        if (conteudo.length < assinatura.length) return false;
        for (int indice = 0; indice < assinatura.length; indice++) {
            if (conteudo[indice] != assinatura[indice]) return false;
        }
        return true;
    }

    private boolean contemByteNulo(byte[] conteudo) {
        for (byte valor : conteudo) {
            if (valor == 0) return true;
        }
        return false;
    }

    private void removerAposFalha(String referencia, Exception original) {
        if (referencia == null) return;
        try {
            armazenamento.remover(referencia);
        } catch (RuntimeException falhaRemocao) {
            original.addSuppressed(falhaRemocao);
        }
    }

    private String hash(MultipartFile arquivo) {
        try (InputStream input = arquivo.getInputStream()) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int lidos;
            while ((lidos = input.read(buffer)) >= 0) digest.update(buffer, 0, lidos);
            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Não foi possível calcular hash do documento", exception);
        }
    }

    private String nomeSeguro(String nome) {
        if (nome == null || nome.isBlank()) return "documento";
        return nome.replaceAll("[\\r\\n]", "_").replaceAll("[^\\p{L}\\p{N}._ -]", "_");
    }

    private String extensaoSegura(String nome) {
        if (nome == null) return "";
        int indice = nome.lastIndexOf('.');
        if (indice < 0 || indice == nome.length() - 1) return "";
        String extensao = nome.substring(indice).toLowerCase();
        return extensao.matches("\\.[a-z0-9]{1,10}") ? extensao : "";
    }

    public record DocumentoResponse(UUID id, UUID empresaId, String tipo, String nomeOriginal,
            String mimeType, long tamanhoBytes, String hashSha256, OrigemDocumento origem,
            LocalDate emitidoEm, LocalDate validoAte, java.time.Instant criadoEm) {
        public static DocumentoResponse de(Documento documento) {
            return new DocumentoResponse(documento.getId(), documento.getEmpresaId(), documento.getTipo(),
                    documento.getNomeOriginal(), documento.getMimeType(), documento.getTamanhoBytes(),
                    documento.getHashSha256(), documento.getOrigem(), documento.getEmitidoEm(),
                    documento.getValidoAte(), documento.getCriadoEm());
        }
    }

    public record DownloadDocumento(String nome, String mimeType, Resource resource) { }
}
