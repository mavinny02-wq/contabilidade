package br.com.contabilidade.empresa.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EmpresaDetalheResponse(
        UUID id,
        String razaoSocial,
        String nomeFantasia,
        String grupo,
        List<String> tags,
        boolean ativa,
        String responsavelNome,
        String responsavelEmail,
        List<EstabelecimentoResponse> estabelecimentos,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public EmpresaDetalheResponse {
        tags = List.copyOf(tags);
        estabelecimentos = List.copyOf(estabelecimentos);
    }
}
