package br.com.contabilidade.certidao.domain;

public enum StatusCertidao {
    NAO_CONSULTADA,
    AGENDADA,
    EM_PROCESSAMENTO,
    REGULAR,
    POSITIVA_COM_EFEITO_NEGATIVA,
    IRREGULAR,
    INCOMPLETA,
    FONTE_INDISPONIVEL,
    ACAO_MANUAL_NECESSARIA,
    FALHA,
    PROXIMA_DO_VENCIMENTO,
    VENCIDA
}
