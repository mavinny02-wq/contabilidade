package br.com.contabilidade.certidao.domain;

import br.com.contabilidade.common.integration.TipoProvedor;
import br.com.contabilidade.common.persistence.EntidadeBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "historicos_certidao")
public class HistoricoCertidao extends EntidadeBase {

    @Column(name = "acompanhamento_id", nullable = false)
    private UUID acompanhamentoId;
    @Column(name = "empresa_id", nullable = false)
    private UUID empresaId;
    @Column(name = "estabelecimento_id", nullable = false)
    private UUID estabelecimentoId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private TipoCertidao tipo;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ResultadoCertidao resultado;
    @Enumerated(EnumType.STRING)
    @Column(name = "situacao_consulta", nullable = false, length = 50)
    private SituacaoConsultaCertidao situacaoConsulta;
    @Column(name = "numero_certidao", length = 200)
    private String numeroCertidao;
    @Column(name = "emitida_em")
    private LocalDate emitidaEm;
    @Column(name = "valida_ate")
    private LocalDate validaAte;
    @Column(name = "documento_id")
    private UUID documentoId;
    @Column(name = "provedor_codigo", length = 100)
    private String provedorCodigo;
    @Enumerated(EnumType.STRING)
    @Column(name = "modo_aquisicao", length = 40)
    private TipoProvedor modoAquisicao;
    @Column(name = "execucao_id")
    private UUID execucaoId;
    @Column(name = "observada_em", nullable = false)
    private Instant observadaEm;
    @Column(name = "mensagem_fonte", length = 1000)
    private String mensagemFonte;

    protected HistoricoCertidao() { }

    public HistoricoCertidao(CertidaoAcompanhamento acompanhamento) {
        this.acompanhamentoId = acompanhamento.getId();
        this.empresaId = acompanhamento.getEmpresaId();
        this.estabelecimentoId = acompanhamento.getEstabelecimentoId();
        this.tipo = acompanhamento.getTipo();
        this.resultado = acompanhamento.getResultado();
        this.situacaoConsulta = acompanhamento.getSituacaoConsulta();
        this.numeroCertidao = acompanhamento.getNumeroCertidao();
        this.emitidaEm = acompanhamento.getEmitidaEm();
        this.validaAte = acompanhamento.getValidaAte();
        this.documentoId = acompanhamento.getDocumentoId();
        this.provedorCodigo = acompanhamento.getUltimoProvedorCodigo();
        this.modoAquisicao = acompanhamento.getUltimoModoAquisicao();
        this.execucaoId = acompanhamento.getUltimaExecucaoId();
        this.observadaEm = acompanhamento.getObservadaEm() == null ? Instant.now() : acompanhamento.getObservadaEm();
        this.mensagemFonte = acompanhamento.getMensagemFonte();
    }

    public UUID getAcompanhamentoId() { return acompanhamentoId; }
    public UUID getEmpresaId() { return empresaId; }
    public UUID getEstabelecimentoId() { return estabelecimentoId; }
    public TipoCertidao getTipo() { return tipo; }
    public ResultadoCertidao getResultado() { return resultado; }
    public SituacaoConsultaCertidao getSituacaoConsulta() { return situacaoConsulta; }
    public String getNumeroCertidao() { return numeroCertidao; }
    public LocalDate getEmitidaEm() { return emitidaEm; }
    public LocalDate getValidaAte() { return validaAte; }
    public UUID getDocumentoId() { return documentoId; }
    public String getProvedorCodigo() { return provedorCodigo; }
    public TipoProvedor getModoAquisicao() { return modoAquisicao; }
    public UUID getExecucaoId() { return execucaoId; }
    public Instant getObservadaEm() { return observadaEm; }
    public String getMensagemFonte() { return mensagemFonte; }
}
