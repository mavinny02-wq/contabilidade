package br.com.contabilidade.common.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record DocumentoMetadadosRequest(
        @NotBlank
        @Size(max = 100)
        @Pattern(regexp = "^[A-Za-z0-9_-]+$")
        String tipo,
        LocalDate emitidoEm,
        LocalDate validoAte
) {
}
