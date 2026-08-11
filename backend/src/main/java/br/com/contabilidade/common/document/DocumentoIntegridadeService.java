package br.com.contabilidade.common.document;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DocumentoIntegridadeService {

    private static final Logger log = LoggerFactory.getLogger(DocumentoIntegridadeService.class);
    private static final int TAMANHO_BUFFER = 8_192;

    private final ArmazenamentoDocumento armazenamento;
    private final AuditoriaService auditoriaService;
    private final long tamanhoMaximoVerificacao;

    public DocumentoIntegridadeService(
            ArmazenamentoDocumento armazenamento,
            AuditoriaService auditoriaService,
            @Value("${app.storage.integrity-max-file-size-bytes:52428800}") long tamanhoMaximoVerificacao
    ) {
        this.armazenamento = armazenamento;
        this.auditoriaService = auditoriaService;
        this.tamanhoMaximoVerificacao = Math.max(1, tamanhoMaximoVerificacao);
    }

    public ConteudoVerificado carregarVerificado(Documento documento) {
        validarMetadados(documento);

        Resource resource;
        try {
            resource = armazenamento.carregar(documento.getReferenciaStorage());
        } catch (RuntimeException exception) {
            auditarFalha(documento, "ARQUIVO_INACESSIVEL", documento.getTamanhoBytes(), null);
            throw exception;
        }

        long tamanhoEsperado = documento.getTamanhoBytes();
        MessageDigest digest = novoDigest();
        ByteArrayOutputStream conteudo = new ByteArrayOutputStream(
                (int) Math.min(tamanhoEsperado, 1_048_576)
        );
        long tamanhoEncontrado = 0;

        try (InputStream input = resource.getInputStream()) {
            byte[] buffer = new byte[TAMANHO_BUFFER];
            int lidos;
            while ((lidos = input.read(buffer)) >= 0) {
                if (lidos == 0) continue;
                tamanhoEncontrado += lidos;
                if (tamanhoEncontrado > tamanhoEsperado) {
                    bloquearDivergencia(
                            documento,
                            "TAMANHO_DIVERGENTE",
                            tamanhoEsperado,
                            tamanhoEncontrado
                    );
                }
                digest.update(buffer, 0, lidos);
                conteudo.write(buffer, 0, lidos);
            }
        } catch (IOException exception) {
            auditarFalha(documento, "LEITURA_FALHOU", tamanhoEsperado, tamanhoEncontrado);
            throw new ExcecaoNegocio(
                    "DOCUMENTO_INTEGRIDADE_NAO_VERIFICAVEL",
                    "erros.documentoIntegridadeNaoVerificavel",
                    HttpStatus.SERVICE_UNAVAILABLE,
                    exception
            );
        }

        if (tamanhoEncontrado != tamanhoEsperado) {
            bloquearDivergencia(
                    documento,
                    "TAMANHO_DIVERGENTE",
                    tamanhoEsperado,
                    tamanhoEncontrado
            );
        }

        byte[] hashEsperado;
        try {
            hashEsperado = HexFormat.of().parseHex(documento.getHashSha256());
        } catch (IllegalArgumentException exception) {
            auditarFalha(documento, "HASH_REGISTRADO_INVALIDO", tamanhoEsperado, tamanhoEncontrado);
            throw new ExcecaoNegocio(
                    "DOCUMENTO_INTEGRIDADE_NAO_VERIFICAVEL",
                    "erros.documentoIntegridadeNaoVerificavel",
                    HttpStatus.CONFLICT,
                    exception
            );
        }

        byte[] hashEncontrado = digest.digest();
        if (!MessageDigest.isEqual(hashEsperado, hashEncontrado)) {
            bloquearDivergencia(
                    documento,
                    "HASH_DIVERGENTE",
                    tamanhoEsperado,
                    tamanhoEncontrado
            );
        }

        byte[] bytes = conteudo.toByteArray();
        return new ConteudoVerificado(new ByteArrayResource(bytes), bytes.length);
    }

    private void validarMetadados(Documento documento) {
        long tamanho = documento.getTamanhoBytes();
        String hash = documento.getHashSha256();
        if (tamanho < 0
                || tamanho > tamanhoMaximoVerificacao
                || tamanho > Integer.MAX_VALUE
                || hash == null
                || !hash.matches("(?i)^[0-9a-f]{64}$")) {
            auditarFalha(documento, "METADADOS_INTEGRIDADE_INVALIDOS", tamanho, null);
            throw new ExcecaoNegocio(
                    "DOCUMENTO_INTEGRIDADE_NAO_VERIFICAVEL",
                    "erros.documentoIntegridadeNaoVerificavel",
                    HttpStatus.CONFLICT
            );
        }
    }

    private MessageDigest novoDigest() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 não está disponível", exception);
        }
    }

    private void bloquearDivergencia(
            Documento documento,
            String motivo,
            long tamanhoEsperado,
            long tamanhoEncontrado
    ) {
        auditarFalha(documento, motivo, tamanhoEsperado, tamanhoEncontrado);
        throw new ExcecaoNegocio(
                "DOCUMENTO_INTEGRIDADE_DIVERGENTE",
                "erros.documentoIntegridadeDivergente",
                HttpStatus.CONFLICT
        );
    }

    private void auditarFalha(
            Documento documento,
            String motivo,
            long tamanhoEsperado,
            Long tamanhoEncontrado
    ) {
        Map<String, Object> detalhes = new LinkedHashMap<>();
        detalhes.put("empresaId", documento.getEmpresaId());
        detalhes.put("motivo", motivo);
        detalhes.put("tamanhoEsperado", tamanhoEsperado);
        if (tamanhoEncontrado != null) detalhes.put("tamanhoEncontrado", tamanhoEncontrado);

        try {
            auditoriaService.registrarIsolado(
                    "DOCUMENTO_INTEGRIDADE_BLOQUEADA",
                    "DOCUMENTO",
                    documento.getId(),
                    detalhes
            );
        } catch (RuntimeException exception) {
            log.warn(
                    "Falha ao persistir auditoria de integridade do documento. documentoId={}, motivo={}",
                    documento.getId(),
                    motivo,
                    exception
            );
        }
    }

    public record ConteudoVerificado(Resource resource, long tamanhoBytes) {
    }
}
