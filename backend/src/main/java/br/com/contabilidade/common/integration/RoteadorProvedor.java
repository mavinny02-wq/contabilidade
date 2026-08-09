package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class RoteadorProvedor {

    private final List<ProvedorIntegracao> provedores;

    public RoteadorProvedor(List<ProvedorIntegracao> provedores) {
        this.provedores = List.copyOf(provedores);
    }

    public ProvedorIntegracao porCodigo(String codigo, String operacao) {
        return provedores.stream()
                .filter(provedor -> provedor.codigo().equals(codigo))
                .filter(provedor -> provedor.suporta(operacao))
                .findFirst()
                .orElseThrow(() -> new ExcecaoNegocio(
                        "PROVEDOR_NAO_DISPONIVEL",
                        "erros.provedorNaoDisponivel",
                        HttpStatus.UNPROCESSABLE_ENTITY
                ));
    }
}
