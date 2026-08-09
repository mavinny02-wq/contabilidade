package br.com.contabilidade.common.error;

import org.springframework.http.HttpStatus;

public class ExcecaoNegocio extends RuntimeException {

    private final String codigo;
    private final String mensagemKey;
    private final HttpStatus status;

    public ExcecaoNegocio(String codigo, String mensagemKey, HttpStatus status) {
        super(mensagemKey);
        this.codigo = codigo;
        this.mensagemKey = mensagemKey;
        this.status = status;
    }

    public ExcecaoNegocio(String codigo, String mensagemKey, HttpStatus status, Throwable cause) {
        super(mensagemKey, cause);
        this.codigo = codigo;
        this.mensagemKey = mensagemKey;
        this.status = status;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getMensagemKey() {
        return mensagemKey;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
