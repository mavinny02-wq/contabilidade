package br.com.contabilidade.common.execution;

import java.util.Optional;

/**
 * Permite que um módulo de negócio acompanhe o ciclo de vida de uma execução
 * sem acoplar o motor comum de fila ao domínio específico.
 */
public interface ExecucaoLifecycleHandler {

    boolean suporta(String operacao);

    default void aoAdquirir(ExecucaoIntegracao execucao) {
    }

    default void aoConcluir(ExecucaoIntegracao execucao, Object resultadoNormalizado) {
    }

    default void aoFalhar(ExecucaoIntegracao execucao) {
    }

    default void aoAguardarHumano(ExecucaoIntegracao execucao) {
    }

    default void aoRetomar(ExecucaoIntegracao execucao) {
    }

    default void aoRetomarSessao(ExecucaoIntegracao execucao) {
    }

    default void aoCancelar(ExecucaoIntegracao execucao) {
    }

    default Optional<ComandoCriarExecucao> fallbackAposFalha(ExecucaoIntegracao execucao) {
        return Optional.empty();
    }

    default void aoCriarFallback(ExecucaoIntegracao anterior, ExecucaoIntegracao fallback) {
    }
}
