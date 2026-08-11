package br.com.contabilidade.certidao.repository;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;

public record CertidaoExportacaoLinha(
        CertidaoAcompanhamento certidao,
        String cnpj,
        String razaoSocial
) {
}
