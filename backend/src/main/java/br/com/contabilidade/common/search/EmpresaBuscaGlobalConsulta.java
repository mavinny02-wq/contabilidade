package br.com.contabilidade.common.search;

import java.util.List;
import java.util.UUID;

/**
 * Porta de leitura da feature Empresa usada pela busca global.
 */
public interface EmpresaBuscaGlobalConsulta {

    List<EmpresaBuscaGlobalProjecao> buscar(String termo, int limite);

    record EmpresaBuscaGlobalProjecao(
            UUID id,
            String razaoSocial,
            String cnpj
    ) {
    }
}
