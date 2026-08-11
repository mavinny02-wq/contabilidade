package br.com.contabilidade.certidao.api;

import br.com.contabilidade.certidao.domain.SituacaoConsultaCertidao;
import java.util.List;
import java.util.UUID;

public record CertidaoSolicitacaoLoteResponse(
        UUID loteId,
        int recebidas,
        int unicas,
        int aceitas,
        int rejeitadas,
        List<Item> itens
) {
    public CertidaoSolicitacaoLoteResponse {
        itens = List.copyOf(itens);
    }

    public record Item(
            UUID id,
            boolean aceita,
            String codigo,
            SituacaoConsultaCertidao situacaoConsulta,
            UUID execucaoId
    ) {
    }
}
