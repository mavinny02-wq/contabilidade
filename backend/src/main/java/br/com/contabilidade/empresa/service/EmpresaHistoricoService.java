package br.com.contabilidade.empresa.service;

import br.com.contabilidade.common.audit.EventoAuditoria;
import br.com.contabilidade.common.audit.EventoAuditoriaRepository;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import br.com.contabilidade.empresa.api.EmpresaHistoricoResponse;
import br.com.contabilidade.empresa.domain.Empresa;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmpresaHistoricoService {

    private static final Sort ORDEM = Sort.by(
            Sort.Order.desc("criadoEm"),
            Sort.Order.desc("id")
    );

    private final EmpresaRepository empresaRepository;
    private final EventoAuditoriaRepository auditoriaRepository;

    public EmpresaHistoricoService(
            EmpresaRepository empresaRepository,
            EventoAuditoriaRepository auditoriaRepository
    ) {
        this.empresaRepository = empresaRepository;
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional(readOnly = true)
    public Page<EmpresaHistoricoResponse> listar(UUID empresaId, int pagina, int tamanho) {
        Empresa empresa = empresaRepository.buscarDetalhada(empresaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "EMPRESA_NAO_ENCONTRADA",
                        "erros.empresaNaoEncontrada"
                ));
        List<UUID> estabelecimentos = empresa.getEstabelecimentos().stream()
                .map(item -> item.getId())
                .toList();

        Specification<EventoAuditoria> specification = (root, _query, criteria) -> {
            List<Predicate> escopo = new ArrayList<>();
            escopo.add(criteria.and(
                    criteria.equal(root.<String>get("recursoTipo"), "EMPRESA"),
                    criteria.equal(root.<UUID>get("recursoId"), empresaId)
            ));
            if (!estabelecimentos.isEmpty()) {
                escopo.add(criteria.and(
                        criteria.equal(root.<String>get("recursoTipo"), "ESTABELECIMENTO"),
                        root.<UUID>get("recursoId").in(estabelecimentos)
                ));
            }
            return criteria.or(escopo.toArray(Predicate[]::new));
        };

        return auditoriaRepository.findAll(
                specification,
                PageRequest.of(
                        Math.max(pagina, 0),
                        Math.min(Math.max(tamanho, 1), 100),
                        ORDEM
                )
        ).map(EmpresaHistoricoResponse::de);
    }
}
