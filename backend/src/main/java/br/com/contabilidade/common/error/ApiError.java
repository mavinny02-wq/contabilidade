package br.com.contabilidade.common.error;

import java.time.Instant;
import java.util.List;

public record ApiError(
        Instant timestamp,
        int status,
        String codigo,
        String mensagemKey,
        String mensagem,
        String caminho,
        String correlationId,
        List<ErroCampo> campos
) {
}
