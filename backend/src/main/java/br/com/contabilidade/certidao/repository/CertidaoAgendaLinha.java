package br.com.contabilidade.certidao.repository;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;

public record CertidaoAgendaLinha(
        CertidaoAcompanhamento certidao,
        String cnpj,
        String empresaRazaoSocial
) {
}
