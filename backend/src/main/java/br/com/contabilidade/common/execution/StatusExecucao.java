package br.com.contabilidade.common.execution;

public enum StatusExecucao {
    NA_FILA,
    EXECUTANDO,
    RETRY_AGENDADO,
    AGUARDANDO_HUMANO,
    AGUARDANDO_CAPTCHA,
    AGUARDANDO_AUTENTICACAO,
    SUCESSO,
    PARCIAL,
    FALHA,
    FONTE_INDISPONIVEL,
    CANCELADO;

    public boolean terminal() {
        return this == SUCESSO || this == PARCIAL || this == FALHA
                || this == FONTE_INDISPONIVEL || this == CANCELADO;
    }

    public boolean esperaHumana() {
        return this == AGUARDANDO_HUMANO || this == AGUARDANDO_CAPTCHA
                || this == AGUARDANDO_AUTENTICACAO;
    }
}
