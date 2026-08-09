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
    CANCELADO
}
