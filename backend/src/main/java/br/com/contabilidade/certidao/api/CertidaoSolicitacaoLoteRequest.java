package br.com.contabilidade.certidao.api;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record CertidaoSolicitacaoLoteRequest(
        @NotEmpty
        @Size(max = 500)
        List<@NotNull UUID> ids,
        @Size(max = 100)
        String idempotencyKey
) {
}
