package br.com.contabilidade.common.document;

import java.util.UUID;

public interface EmpresaDocumentoConsulta {

    boolean existePorId(UUID empresaId);
}
