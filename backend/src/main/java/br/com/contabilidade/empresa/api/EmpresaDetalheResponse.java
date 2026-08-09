package br.com.contabilidade.empresa.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EmpresaDetalheResponse(
        UUID id,
        String razaoSocial,
        String nomeFantasia,
        boolean ativa,
        String responsavelNome,
        String responsavelEmail,
        List<EstabelecimentoResponse> estabelecimentos,
        Instant criadoEm,
        Instant atualizadoEm
) {
}
