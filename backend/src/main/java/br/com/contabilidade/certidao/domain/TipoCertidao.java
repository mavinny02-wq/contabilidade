package br.com.contabilidade.certidao.domain;

public enum TipoCertidao {
    FEDERAL_RFB_PGFN("CERTIDAO_FEDERAL_RFB_PGFN", false, true),
    SP_SEFAZ_NAO_INSCRITOS("CERTIDAO_SP_SEFAZ_NAO_INSCRITOS", true, false),
    SP_PGE_DIVIDA_ATIVA("CERTIDAO_SP_PGE_DIVIDA_ATIVA", true, true);

    private final String operacao;
    private final boolean somenteSaoPaulo;
    private final boolean somenteMatriz;

    TipoCertidao(String operacao, boolean somenteSaoPaulo, boolean somenteMatriz) {
        this.operacao = operacao;
        this.somenteSaoPaulo = somenteSaoPaulo;
        this.somenteMatriz = somenteMatriz;
    }

    public String operacao() {
        return operacao;
    }

    public boolean aplicavel(String uf, boolean matriz) {
        if (somenteSaoPaulo && !"SP".equalsIgnoreCase(uf)) {
            return false;
        }
        return !somenteMatriz || matriz;
    }
}
