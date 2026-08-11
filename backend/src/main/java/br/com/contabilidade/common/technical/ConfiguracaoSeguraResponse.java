package br.com.contabilidade.common.technical;

import br.com.contabilidade.common.integration.TipoProvedor;
import java.time.Instant;
import java.util.List;

public record ConfiguracaoSeguraResponse(
        Instant observadoEm,
        String status,
        String ambiente,
        String versao,
        boolean segurancaHabilitada,
        String storageProvider,
        boolean workerTokenConfigurado,
        boolean segredoSessaoConfigurado,
        String ticketTtl,
        int provedoresTotal,
        int provedoresHabilitados,
        int provedoresPagosHabilitados,
        List<Aviso> avisos,
        List<Provedor> provedores
) {
    public ConfiguracaoSeguraResponse {
        avisos = List.copyOf(avisos);
        provedores = List.copyOf(provedores);
    }

    public record Aviso(String codigo, String componente) {
    }

    public record Provedor(
            String codigo,
            String nome,
            TipoProvedor tipo,
            boolean habilitado,
            boolean pago,
            boolean baseUrlConfigurada,
            boolean referenciaSegredoConfigurada,
            boolean custoConfigurado,
            boolean moedaConfigurada,
            int timeoutSegundos,
            int maxRetries
    ) {
    }
}
