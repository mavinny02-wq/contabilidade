package br.com.contabilidade.common.integration;

public interface ProvedorIntegracao {

    String codigo();

    boolean suporta(String operacao);

    ResultadoIntegracao executar(RequisicaoIntegracao requisicao);
}
