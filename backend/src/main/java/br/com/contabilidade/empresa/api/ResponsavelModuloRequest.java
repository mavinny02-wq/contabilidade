package br.com.contabilidade.empresa.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResponsavelModuloRequest(
        @NotBlank @Size(max = 160) String nome,
        @Email @Size(max = 200) String email,
        @Size(max = 40) String telefone,
        boolean ativo
) {
}
