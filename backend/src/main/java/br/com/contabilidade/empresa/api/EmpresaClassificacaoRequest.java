package br.com.contabilidade.empresa.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record EmpresaClassificacaoRequest(
        @Size(max = 100) String grupo,
        @Size(max = 20) List<@NotBlank @Size(max = 60) String> tags
) {
    public EmpresaClassificacaoRequest {
        tags = tags == null ? List.of() : List.copyOf(tags);
    }
}
