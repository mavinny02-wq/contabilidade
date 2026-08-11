package br.com.contabilidade.certidao.api;

import br.com.contabilidade.certidao.domain.StatusCertidao;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CertidaoAgendaResponse(
        LocalDate inicio,
        LocalDate fim,
        UUID empresaId,
        long total,
        boolean parcial,
        List<Item> itens
) {
    public CertidaoAgendaResponse {
        itens = List.copyOf(itens);
    }

    public record Item(
            UUID acompanhamentoId,
            UUID empresaId,
            String empresaRazaoSocial,
            UUID estabelecimentoId,
            String cnpj,
            TipoCertidao tipo,
            StatusCertidao status,
            LocalDate validaAte,
            long diasParaVencimento,
            UUID documentoId
    ) {
    }
}
