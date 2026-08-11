package br.com.contabilidade.empresa.api;

import br.com.contabilidade.empresa.domain.RegimeTributario;
import br.com.contabilidade.empresa.domain.StatusEmpresa;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record EmpresaRequest(
        @NotBlank @Size(max = 200) String razaoSocial,
        @Size(max = 200) String nomeFantasia,
        @Size(max = 100) String grupo,
        @Size(max = 20) List<@NotBlank @Size(max = 60) String> tags,
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
        @Size(min = 2, max = 2) String uf,
        @Size(max = 9) String cep,
        @Size(max = 160) String responsavelNome,
        @Email @Size(max = 200) String responsavelEmail
) {
    public EmpresaRequest {
        tags = tags == null ? List.of() : List.copyOf(tags);
    }
}
