package br.com.contabilidade.common.integration;

import java.math.BigDecimal;
import java.util.Map;

public record ResultadoIntegracao(
        boolean sucesso,
        String protocoloExterno,
        Map<String, Object> dadosNormalizados,
        String erroCodigo,
        String erroResumo,
        BigDecimal custo,
        String moeda
) {
}
