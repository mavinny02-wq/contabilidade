package br.com.contabilidade.common.intervention;

public enum StatusIntervencao {
    PENDENTE,
    EM_ATENDIMENTO,
    RESOLVIDA,
    EXPIRADA,
    CANCELADA;

    public boolean aberta() {
        return this == PENDENTE || this == EM_ATENDIMENTO;
    }
}
