package br.com.contabilidade.empresa.service;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import br.com.contabilidade.empresa.api.ResponsavelModuloRequest;
import br.com.contabilidade.empresa.api.ResponsavelModuloResponse;
import br.com.contabilidade.empresa.domain.ModuloEmpresa;
import br.com.contabilidade.empresa.domain.ResponsavelModuloEmpresa;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import br.com.contabilidade.empresa.repository.ResponsavelModuloEmpresaRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResponsavelModuloEmpresaService {

    private final EmpresaRepository empresaRepository;
    private final ResponsavelModuloEmpresaRepository repository;
    private final AuditoriaService auditoriaService;

    public ResponsavelModuloEmpresaService(
            EmpresaRepository empresaRepository,
            ResponsavelModuloEmpresaRepository repository,
            AuditoriaService auditoriaService
    ) {
        this.empresaRepository = empresaRepository;
        this.repository = repository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<ResponsavelModuloResponse> listar(UUID empresaId) {
        validarEmpresa(empresaId);
        return repository.findByEmpresaIdOrderByModuloAsc(empresaId).stream()
                .map(this::response)
                .toList();
    }

    @Transactional
    public ResponsavelModuloResponse atualizar(
            UUID empresaId,
            ModuloEmpresa modulo,
            ResponsavelModuloRequest request
    ) {
        validarEmpresa(empresaId);
        ResponsavelModuloEmpresa responsavel = repository.findByEmpresaIdAndModulo(empresaId, modulo)
                .orElseGet(() -> new ResponsavelModuloEmpresa(empresaId, modulo));
        responsavel.atualizar(request.nome(), request.email(), request.telefone(), request.ativo());
        ResponsavelModuloEmpresa salvo = repository.save(responsavel);

        auditoriaService.registrar(
                "RESPONSAVEL_MODULO_ATUALIZADO",
                "EMPRESA",
                empresaId,
                Map.of(
                        "modulo", modulo.name(),
                        "ativo", salvo.isAtivo(),
                        "emailInformado", salvo.getEmail() != null,
                        "telefoneInformado", salvo.getTelefone() != null
                )
        );
        return response(salvo);
    }

    private void validarEmpresa(UUID empresaId) {
        if (!empresaRepository.existsById(empresaId)) {
            throw new RecursoNaoEncontradoException("EMPRESA_NAO_ENCONTRADA", "erros.empresaNaoEncontrada");
        }
    }

    private ResponsavelModuloResponse response(ResponsavelModuloEmpresa item) {
        return new ResponsavelModuloResponse(
                item.getId(),
                item.getEmpresaId(),
                item.getModulo(),
                item.getNome(),
                item.getEmail(),
                item.getTelefone(),
                item.isAtivo(),
                item.getAtualizadoEm()
        );
    }
}
