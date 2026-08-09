package br.com.contabilidade.common.execution;

import java.util.UUID;

public record ComandoCriarExecucao(
        UUID empresaId,
        String operacao,
        String provedorCodigo,
        int prioridade,
        int maxTentativas,
        Object payload,
        String idempotencyKey,
        UUID execucaoAnteriorId
) {
}
