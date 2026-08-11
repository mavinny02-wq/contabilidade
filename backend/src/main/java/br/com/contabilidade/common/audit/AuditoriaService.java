package br.com.contabilidade.common.audit;

import br.com.contabilidade.common.web.CorrelationIdFilter;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditoriaService {

    private final EventoAuditoriaRepository repository;
    private final ObjectMapper objectMapper;

    public AuditoriaService(EventoAuditoriaRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void registrar(String acao, String recursoTipo, UUID recursoId, Map<String, ?> detalhes) {
        salvar(acao, recursoTipo, recursoId, detalhes);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarIsolado(String acao, String recursoTipo, UUID recursoId, Map<String, ?> detalhes) {
        salvar(acao, recursoTipo, recursoId, detalhes);
    }

    private void salvar(String acao, String recursoTipo, UUID recursoId, Map<String, ?> detalhes) {
        repository.save(new EventoAuditoria(
                acao,
                recursoTipo,
                recursoId,
                atorAtual(),
                MDC.get(CorrelationIdFilter.ATTRIBUTE),
                serializar(detalhes)
        ));
    }

    private String atorAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null || authentication.getName() == null
                ? "sistema"
                : authentication.getName();
    }

    private String serializar(Map<String, ?> detalhes) {
        try {
            return objectMapper.writeValueAsString(detalhes == null ? Map.of() : detalhes);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }
}
