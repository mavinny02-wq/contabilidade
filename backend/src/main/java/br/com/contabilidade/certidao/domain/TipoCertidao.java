package br.com.contabilidade.certidao.domain;

public enum TipoCertidao {
    FEDERAL_RFB_PGFN("CERTIDAO_FEDERAL_RFB_PGFN", false),
    SP_SEFAZ_NAO_INSCRITOS("CERTIDAO_SP_SEFAZ_NAO_INSCRITOS", true),
    SP_PGE_DIVIDA_ATIVA("CERTIDAO_SP_PGE_DIVIDA_ATIVA", true);

    private final String operacao;
    private final boolean somenteSaoPaulo;

    TipoCertidao(String operacao, boolean somenteSaoPaulo) {
        this.operacao = operacao;
        this.somenteSaoPaulo = somenteSaoPaulo;
    }

    public String operacao() { return operacao; }

    public boolean aplicavel(String uf) {
        return !somenteSaoPaulo || "SP".equalsIgnoreCase(uf);
    }
}
