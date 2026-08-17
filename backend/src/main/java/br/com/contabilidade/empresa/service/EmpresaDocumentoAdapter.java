package br.com.contabilidade.empresa.service;

import br.com.contabilidade.common.document.EmpresaDocumentoConsulta;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class EmpresaDocumentoAdapter implements EmpresaDocumentoConsulta {

    private final EmpresaRepository empresaRepository;

    public EmpresaDocumentoAdapter(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    @Override
    public boolean existePorId(UUID empresaId) {
        return empresaRepository.existsById(empresaId);
    }
}
