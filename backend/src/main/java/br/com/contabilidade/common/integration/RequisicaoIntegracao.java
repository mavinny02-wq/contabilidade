package br.com.contabilidade.common.integration;

import java.util.Map;
import java.util.UUID;

public record RequisicaoIntegracao(
        UUID empresaId,
        String operacao,
        Map<String, Object> parametros
) {
}
