package br.com.contabilidade.common.error;

import org.springframework.http.HttpStatus;

public class RecursoNaoEncontradoException extends ExcecaoNegocio {

    public RecursoNaoEncontradoException(String codigo, String mensagemKey) {
        super(codigo, mensagemKey, HttpStatus.NOT_FOUND);
    }
}
