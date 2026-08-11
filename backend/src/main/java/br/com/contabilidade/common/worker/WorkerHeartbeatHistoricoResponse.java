package br.com.contabilidade.common.worker;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record WorkerHeartbeatHistoricoResponse(
        LocalDate inicio,
        LocalDate fim,
        String workerId,
        long total,
        long saudavel,
        long degradado,
        long indisponivel,
        long inicializando,
        long desconhecido,
        boolean parcial,
        List<Item> itens
) {
    public record Item(
            UUID id,
            String workerId,
            String versao,
            String status,
            Instant observadoEm
    ) {
    }
}
