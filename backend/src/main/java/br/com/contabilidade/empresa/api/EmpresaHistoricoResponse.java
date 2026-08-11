package br.com.contabilidade.empresa.api;

import br.com.contabilidade.common.audit.EventoAuditoria;
import java.time.Instant;
import java.util.UUID;

public record EmpresaHistoricoResponse(
        UUID id,
        String acao,
        String recursoTipo,
        UUID recursoId,
        String ator,
        String correlationId,
        Instant criadoEm
) {
    public static EmpresaHistoricoResponse de(EventoAuditoria evento) {
        return new EmpresaHistoricoResponse(
                evento.getId(),
                evento.getAcao(),
                evento.getRecursoTipo(),
                evento.getRecursoId(),
                evento.getAtor(),
                evento.getCorrelationId(),
                evento.getCriadoEm()
        );
    }
}
