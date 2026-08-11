package br.com.contabilidade.common.update;

import java.time.Instant;
import java.util.List;

public record AtualizacaoPreflightResponse(
        String status,
        String versaoAtual,
        String versaoDestino,
        String versaoMinimaOrigem,
        Instant criadoEm,
        int quantidadeArtefatos,
        List<Artefato> artefatos,
        List<Ocorrencia> ocorrencias
) {
    public record Artefato(
            String componente,
            String nomeArquivo,
            long tamanhoBytes,
            boolean nomeSeguro,
            boolean sha256Valido
    ) {
    }

    public record Ocorrencia(
            String nivel,
            String codigo,
            String mensagem
    ) {
    }
}
