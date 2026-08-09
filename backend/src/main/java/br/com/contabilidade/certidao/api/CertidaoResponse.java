package br.com.contabilidade.certidao.api;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.ResultadoCertidao;
import br.com.contabilidade.certidao.domain.SituacaoConsultaCertidao;
import br.com.contabilidade.certidao.domain.StatusCertidao;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.common.integration.TipoProvedor;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CertidaoResponse(UUID id, UUID empresaId, UUID estabelecimentoId, String cnpj,
        TipoCertidao tipo, ResultadoCertidao resultado, SituacaoConsultaCertidao situacaoConsulta,
        StatusCertidao status, String numeroCertidao, LocalDate emitidaEm, LocalDate validaAte,
        UUID documentoId, String ultimoProvedorCodigo, TipoProvedor ultimoModoAquisicao,
        UUID ultimaExecucaoId, Instant observadaEm, Instant proximaConsultaEm,
        int antecedenciaDias, String mensagemFonte, Instant atualizadoEm) {

    public static CertidaoResponse de(CertidaoAcompanhamento item, String cnpj, LocalDate hoje) {
        return new CertidaoResponse(item.getId(), item.getEmpresaId(), item.getEstabelecimentoId(),
                cnpj, item.getTipo(), item.getResultado(), item.getSituacaoConsulta(),
                item.statusExibicao(hoje), item.getNumeroCertidao(), item.getEmitidaEm(),
                item.getValidaAte(), item.getDocumentoId(), item.getUltimoProvedorCodigo(),
                item.getUltimoModoAquisicao(), item.getUltimaExecucaoId(), item.getObservadaEm(),
                item.getProximaConsultaEm(), item.getAntecedenciaDias(), item.getMensagemFonte(),
                item.getAtualizadoEm());
    }
}
