package br.com.contabilidade.certidao.api;

import br.com.contabilidade.certidao.domain.HistoricoCertidao;
import br.com.contabilidade.certidao.domain.ResultadoCertidao;
import br.com.contabilidade.certidao.domain.SituacaoConsultaCertidao;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.common.integration.TipoProvedor;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record HistoricoCertidaoResponse(UUID id, UUID acompanhamentoId, TipoCertidao tipo,
        ResultadoCertidao resultado, SituacaoConsultaCertidao situacaoConsulta,
        String numeroCertidao, LocalDate emitidaEm, LocalDate validaAte, UUID documentoId,
        String provedorCodigo, TipoProvedor modoAquisicao, UUID execucaoId,
        Instant observadaEm, String mensagemFonte) {
    public static HistoricoCertidaoResponse de(HistoricoCertidao item) {
        return new HistoricoCertidaoResponse(item.getId(), item.getAcompanhamentoId(), item.getTipo(),
                item.getResultado(), item.getSituacaoConsulta(), item.getNumeroCertidao(),
                item.getEmitidaEm(), item.getValidaAte(), item.getDocumentoId(), item.getProvedorCodigo(),
                item.getModoAquisicao(), item.getExecucaoId(), item.getObservadaEm(), item.getMensagemFonte());
    }
}
