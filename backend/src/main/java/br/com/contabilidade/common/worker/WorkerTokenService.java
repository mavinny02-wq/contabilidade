package br.com.contabilidade.common.worker;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkerTokenService {

    private final String tokenEsperado;

    public WorkerTokenService(@Value("${app.worker.token}") String tokenEsperado) {
        this.tokenEsperado = tokenEsperado;
    }

    public void validar(String token) {
        if (tokenEsperado == null || tokenEsperado.isBlank() || token == null
                || !java.security.MessageDigest.isEqual(
                        tokenEsperado.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                        token.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
    }
}
