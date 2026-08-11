package br.com.contabilidade.common.integration;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProvedorHistoricoResponse(
        Instant inicio,
        Instant fimExclusivo,
        long totalExecucoes,
        long totalProvedores,
        boolean parcial,
        List<Item> provedores
) {
    public ProvedorHistoricoResponse {
        provedores = List.copyOf(provedores);
    }

    public record Item(
            String codigo,
            long total,
            long sucesso,
            long parcial,
            long falha,
            long fonteIndisponivel,
            long cancelada,
            long aberta,
            double taxaSucessoPercentual,
            Double duracaoMediaSegundos,
            Instant ultimaExecucaoEm,
            List<Custo> custos
    ) {
        public Item {
            custos = List.copyOf(custos);
        }
    }

    public record Custo(String moeda, BigDecimal totalEstimado) {
    }
}
