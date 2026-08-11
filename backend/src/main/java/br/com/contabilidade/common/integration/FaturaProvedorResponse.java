package br.com.contabilidade.common.integration;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FaturaProvedorResponse(
        UUID id,
        String provedorCodigo,
        LocalDate competenciaInicio,
        LocalDate competenciaFim,
        String moeda,
        BigDecimal valorFaturado,
        BigDecimal valorEstimado,
        BigDecimal diferenca,
        SituacaoReconciliacao situacao,
        String referencia,
        String observacao,
        Instant atualizadoEm
) {
    public enum SituacaoReconciliacao {
        SEM_DIVERGENCIA,
        ACIMA_ESTIMADO,
        ABAIXO_ESTIMADO
    }
}
