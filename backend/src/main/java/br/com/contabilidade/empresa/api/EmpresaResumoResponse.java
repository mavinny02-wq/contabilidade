package br.com.contabilidade.empresa.api;

import br.com.contabilidade.empresa.domain.RegimeTributario;
import br.com.contabilidade.empresa.domain.StatusEmpresa;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EmpresaResumoResponse(
        UUID id,
        String razaoSocial,
        String nomeFantasia,
        String grupo,
        List<String> tags,
        String cnpj,
        StatusEmpresa status,
        RegimeTributario regimeTributario,
        String municipio,
        String uf,
        boolean ativa,
        int quantidadeEstabelecimentos,
        Instant atualizadoEm
) {
    public EmpresaResumoResponse {
        tags = List.copyOf(tags);
    }
}
