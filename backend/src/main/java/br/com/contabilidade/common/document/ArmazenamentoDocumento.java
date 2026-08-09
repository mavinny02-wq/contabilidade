package br.com.contabilidade.common.document;

import java.io.InputStream;
import org.springframework.core.io.Resource;

public interface ArmazenamentoDocumento {

    String salvar(String referenciaDesejada, InputStream conteudo);

    Resource carregar(String referencia);

    void remover(String referencia);
}
