package br.com.contabilidade.empresa.api;

import br.com.contabilidade.empresa.domain.RegimeTributario;
import br.com.contabilidade.empresa.domain.StatusEmpresa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FilialRequest(
        @NotBlank String cnpj,
        StatusEmpresa status,
        @Size(max = 10) String cnaePrincipal,
        RegimeTributario regimeTributario,
        @Size(max = 60) String inscricaoEstadual,
        @Size(max = 60) String inscricaoMunicipal,
        @Size(max = 200) String logradouro,
        @Size(max = 20) String numero,
        @Size(max = 100) String complemento,
        @Size(max = 100) String bairro,
        @Size(max = 100) String municipio,
        @Pattern(regexp = "^$|^[A-Za-z]{2}$") String uf,
        @Size(max = 9) String cep
) {
}
