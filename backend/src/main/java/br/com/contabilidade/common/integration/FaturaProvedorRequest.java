package br.com.contabilidade.common.integration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record FaturaProvedorRequest(
        @NotBlank @Size(max = 100) String provedorCodigo,
        @NotNull LocalDate competenciaInicio,
        @NotNull LocalDate competenciaFim,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{3}$") String moeda,
        @NotNull @DecimalMin("0.0000") @Digits(integer = 10, fraction = 4) BigDecimal valorFaturado,
        @Size(max = 120) String referencia,
        @Size(max = 500) String observacao
) {
}
