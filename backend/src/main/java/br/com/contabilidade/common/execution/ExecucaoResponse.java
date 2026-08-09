package br.com.contabilidade.common.execution;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ExecucaoResponse(
        UUID id,
        UUID empresaId,
        String operacao,
        String provedorCodigo,
        StatusExecucao status,
        int prioridade,
        int tentativas,
        int maxTentativas,
        Instant proximaTentativaEm,
        Instant iniciadaEm,
        Instant finalizadaEm,
        String erroCodigo,
        String erroResumo,
        String protocoloExterno,
        BigDecimal custoEstimado,
        String moeda,
        String payloadJson,
        String resultadoJson,
        String workerId,
        Instant leaseAte,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public static ExecucaoResponse de(ExecucaoIntegracao execucao) {
        return new ExecucaoResponse(
                execucao.getId(), execucao.getEmpresaId(), execucao.getOperacao(),
                execucao.getProvedorCodigo(), execucao.getStatus(), execucao.getPrioridade(),
                execucao.getTentativas(), execucao.getMaxTentativas(), execucao.getProximaTentativaEm(),
                execucao.getIniciadaEm(), execucao.getFinalizadaEm(), execucao.getErroCodigo(),
                execucao.getErroResumo(), execucao.getProtocoloExterno(), execucao.getCustoEstimado(),
                execucao.getMoeda(), execucao.getPayloadJson(), execucao.getResultadoJson(),
                execucao.getWorkerId(), execucao.getLeaseAte(), execucao.getCriadoEm(), execucao.getAtualizadoEm()
        );
    }
}
