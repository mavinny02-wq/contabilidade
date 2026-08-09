package br.com.contabilidade.common.error;

import org.springframework.http.HttpStatus;

public class RecursoNaoEncontradoException extends ExcecaoNegocio {

    private static final long serialVersionUID = 1L;

    public RecursoNaoEncontradoException(String codigo, String mensagemKey) {
        super(codigo, mensagemKey, HttpStatus.NOT_FOUND);
    }
}
