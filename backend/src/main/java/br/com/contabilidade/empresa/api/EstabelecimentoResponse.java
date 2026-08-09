package br.com.contabilidade.empresa.api;

import br.com.contabilidade.empresa.domain.RegimeTributario;
import br.com.contabilidade.empresa.domain.StatusEmpresa;
import java.util.UUID;

public record EstabelecimentoResponse(
        UUID id,
        String cnpj,
        boolean matriz,
        boolean ativo,
        StatusEmpresa status,
        String cnaePrincipal,
        RegimeTributario regimeTributario,
        String inscricaoEstadual,
        String inscricaoMunicipal,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String municipio,
        String uf,
        String cep
) {
}
