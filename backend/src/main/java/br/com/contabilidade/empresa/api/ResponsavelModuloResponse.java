package br.com.contabilidade.empresa.api;

import br.com.contabilidade.empresa.domain.ModuloEmpresa;
import java.time.Instant;
import java.util.UUID;

public record ResponsavelModuloResponse(
        UUID id,
        UUID empresaId,
        ModuloEmpresa modulo,
        String nome,
        String email,
        String telefone,
        boolean ativo,
        Instant atualizadoEm
) {
}
