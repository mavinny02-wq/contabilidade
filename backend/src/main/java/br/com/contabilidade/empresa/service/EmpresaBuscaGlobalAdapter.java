package br.com.contabilidade.empresa.service;

import br.com.contabilidade.common.search.EmpresaBuscaGlobalConsulta;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class EmpresaBuscaGlobalAdapter implements EmpresaBuscaGlobalConsulta {

    private final EmpresaService empresaService;

    public EmpresaBuscaGlobalAdapter(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @Override
    public List<EmpresaBuscaGlobalProjecao> buscar(String termo, int limite) {
        return empresaService.listar(termo, 0, limite).getContent().stream()
                .map(empresa -> new EmpresaBuscaGlobalProjecao(
                        empresa.id(),
                        empresa.razaoSocial(),
                        empresa.cnpj()
                ))
                .toList();
    }
}
