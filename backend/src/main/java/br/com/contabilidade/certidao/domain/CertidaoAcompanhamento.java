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
@Table(name = "certidoes_acompanhamento")
public class CertidaoAcompanhamento extends EntidadeBase {

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

    @Column(name = "ultimo_provedor_codigo", length = 100)
    private String ultimoProvedorCodigo;

    @Enumerated(EnumType.STRING)
    @Column(name = "ultimo_modo_aquisicao", length = 40)
    private TipoProvedor ultimoModoAquisicao;

    @Column(name = "ultima_execucao_id")
    private UUID ultimaExecucaoId;

    @Column(name = "observada_em")
    private Instant observadaEm;

    @Column(name = "proxima_consulta_em")
    private Instant proximaConsultaEm;

    @Column(name = "antecedencia_dias", nullable = false)
    private int antecedenciaDias;

    @Column(name = "mensagem_fonte", length = 1000)
    private String mensagemFonte;

    @Column(nullable = false)
    private boolean ativa;

    @Column(name = "alerta_vencimento_em")
    private Instant alertaVencimentoEm;

    @Column(name = "alerta_irregular_em")
    private Instant alertaIrregularEm;

    protected CertidaoAcompanhamento() {
    }

    public CertidaoAcompanhamento(UUID empresaId, UUID estabelecimentoId, TipoCertidao tipo) {
        this.empresaId = empresaId;
        this.estabelecimentoId = estabelecimentoId;
        this.tipo = tipo;
        this.resultado = ResultadoCertidao.DESCONHECIDO;
        this.situacaoConsulta = SituacaoConsultaCertidao.NAO_CONSULTADA;
        this.antecedenciaDias = 30;
        this.ativa = true;
        this.proximaConsultaEm = Instant.now();
    }

    public void agendar(UUID execucaoId, String provedorCodigo, TipoProvedor modo) {
        this.situacaoConsulta = SituacaoConsultaCertidao.AGENDADA;
        this.ultimaExecucaoId = execucaoId;
        this.ultimoProvedorCodigo = provedorCodigo;
        this.ultimoModoAquisicao = modo;
        this.mensagemFonte = null;
        this.proximaConsultaEm = null;
    }

    public void marcarProcessando(UUID execucaoId) {
        this.situacaoConsulta = SituacaoConsultaCertidao.EM_PROCESSAMENTO;
        this.ultimaExecucaoId = execucaoId;
        this.proximaConsultaEm = null;
    }

    public void exigirAcaoManual(UUID execucaoId, String provedorCodigo,
                                 TipoProvedor modo, String mensagem) {
        this.situacaoConsulta = SituacaoConsultaCertidao.ACAO_MANUAL_NECESSARIA;
        this.ultimaExecucaoId = execucaoId;
        this.ultimoProvedorCodigo = limpar(provedorCodigo);
        this.ultimoModoAquisicao = modo;
        this.mensagemFonte = limitar(mensagem, 1000);
        this.observadaEm = Instant.now();
        this.proximaConsultaEm = null;
    }

    public void reagendar(UUID execucaoId, String provedorCodigo,
                          TipoProvedor modo, String mensagem) {
        this.situacaoConsulta = SituacaoConsultaCertidao.AGENDADA;
        this.ultimaExecucaoId = execucaoId;
        this.ultimoProvedorCodigo = limpar(provedorCodigo);
        this.ultimoModoAquisicao = modo;
        this.mensagemFonte = limitar(mensagem, 1000);
        this.proximaConsultaEm = null;
    }

    public void fonteIndisponivel(UUID execucaoId, String provedorCodigo,
                                  TipoProvedor modo, String mensagem) {
        this.situacaoConsulta = SituacaoConsultaCertidao.FONTE_INDISPONIVEL;
        this.ultimaExecucaoId = execucaoId;
        this.ultimoProvedorCodigo = limpar(provedorCodigo);
        this.ultimoModoAquisicao = modo;
        this.mensagemFonte = limitar(mensagem, 1000);
        this.observadaEm = Instant.now();
        this.proximaConsultaEm = Instant.now().plus(java.time.Duration.ofHours(6));
    }

    public void falhar(UUID execucaoId, String provedorCodigo,
                       TipoProvedor modo, String mensagem) {
        this.situacaoConsulta = SituacaoConsultaCertidao.FALHA;
        this.ultimaExecucaoId = execucaoId;
        this.ultimoProvedorCodigo = limpar(provedorCodigo);
        this.ultimoModoAquisicao = modo;
        this.mensagemFonte = limitar(mensagem, 1000);
        this.observadaEm = Instant.now();
        this.proximaConsultaEm = Instant.now().plus(java.time.Duration.ofDays(1));
    }

    public void aplicarResultado(ResultadoCertidao resultado, String numeroCertidao,
                                 LocalDate emitidaEm, LocalDate validaAte, UUID documentoId,
                                 String provedorCodigo, TipoProvedor modo, UUID execucaoId,
                                 String mensagemFonte) {
        if (resultado == null || resultado == ResultadoCertidao.DESCONHECIDO) {
            throw new IllegalArgumentException("O resultado da certidão deve ser conclusivo");
        }
        if (emitidaEm != null && validaAte != null && validaAte.isBefore(emitidaEm)) {
            throw new IllegalArgumentException("A validade não pode ser anterior à emissão");
        }
        if ((resultado == ResultadoCertidao.REGULAR
                || resultado == ResultadoCertidao.POSITIVA_COM_EFEITO_NEGATIVA)
                && (emitidaEm == null || validaAte == null)) {
            throw new IllegalArgumentException("Emissão e validade são obrigatórias para certidões válidas");
        }
        if (resultado != ResultadoCertidao.INCOMPLETA && documentoId == null) {
            throw new IllegalArgumentException("O documento da certidão é obrigatório");
        }
        this.resultado = resultado;
        this.situacaoConsulta = SituacaoConsultaCertidao.CONCLUIDA;
        this.numeroCertidao = limpar(numeroCertidao);
        this.emitidaEm = emitidaEm;
        this.validaAte = validaAte;
        this.documentoId = documentoId;
        this.ultimoProvedorCodigo = limpar(provedorCodigo);
        this.ultimoModoAquisicao = modo;
        this.ultimaExecucaoId = execucaoId;
        this.mensagemFonte = limitar(mensagemFonte, 1000);
        this.observadaEm = Instant.now();
        this.proximaConsultaEm = calcularProximaConsulta();
        this.alertaVencimentoEm = null;
        this.alertaIrregularEm = null;
    }

    public StatusCertidao statusExibicao(LocalDate hoje) {
        return switch (situacaoConsulta) {
            case NAO_CONSULTADA -> StatusCertidao.NAO_CONSULTADA;
            case AGENDADA -> StatusCertidao.AGENDADA;
            case EM_PROCESSAMENTO -> StatusCertidao.EM_PROCESSAMENTO;
            case FONTE_INDISPONIVEL -> StatusCertidao.FONTE_INDISPONIVEL;
            case ACAO_MANUAL_NECESSARIA -> StatusCertidao.ACAO_MANUAL_NECESSARIA;
            case FALHA -> StatusCertidao.FALHA;
            case CONCLUIDA -> statusResultado(hoje);
        };
    }

    private StatusCertidao statusResultado(LocalDate hoje) {
        if (validaAte != null && validaAte.isBefore(hoje)) return StatusCertidao.VENCIDA;
        if (validaAte != null && !validaAte.isAfter(hoje.plusDays(antecedenciaDias))) {
            return StatusCertidao.PROXIMA_DO_VENCIMENTO;
        }
        return switch (resultado) {
            case REGULAR -> StatusCertidao.REGULAR;
            case POSITIVA_COM_EFEITO_NEGATIVA -> StatusCertidao.POSITIVA_COM_EFEITO_NEGATIVA;
            case IRREGULAR -> StatusCertidao.IRREGULAR;
            case INCOMPLETA -> StatusCertidao.INCOMPLETA;
            case DESCONHECIDO -> StatusCertidao.NAO_CONSULTADA;
        };
    }

    private Instant calcularProximaConsulta() {
        if (validaAte == null) return Instant.now().plus(java.time.Duration.ofDays(7));
        LocalDate data = validaAte.minusDays(antecedenciaDias);
        if (data.isBefore(LocalDate.now())) data = LocalDate.now();
        return data.atStartOfDay(java.time.ZoneId.of("America/Sao_Paulo")).toInstant();
    }

    public void registrarAlertaVencimento() { this.alertaVencimentoEm = Instant.now(); }
    public void registrarAlertaIrregular() { this.alertaIrregularEm = Instant.now(); }
    public void alterarAntecedencia(int dias) { this.antecedenciaDias = Math.max(1, Math.min(dias, 180)); }
    public void inativar() { this.ativa = false; }
    public void ativar() { this.ativa = true; }

    private String limpar(String valor) { return valor == null || valor.isBlank() ? null : valor.trim(); }
    private String limitar(String valor, int max) {
        String limpo = limpar(valor);
        return limpo == null || limpo.length() <= max ? limpo : limpo.substring(0, max);
    }

    public UUID getEmpresaId() { return empresaId; }
    public UUID getEstabelecimentoId() { return estabelecimentoId; }
    public TipoCertidao getTipo() { return tipo; }
    public ResultadoCertidao getResultado() { return resultado; }
    public SituacaoConsultaCertidao getSituacaoConsulta() { return situacaoConsulta; }
    public String getNumeroCertidao() { return numeroCertidao; }
    public LocalDate getEmitidaEm() { return emitidaEm; }
    public LocalDate getValidaAte() { return validaAte; }
    public UUID getDocumentoId() { return documentoId; }
    public String getUltimoProvedorCodigo() { return ultimoProvedorCodigo; }
    public TipoProvedor getUltimoModoAquisicao() { return ultimoModoAquisicao; }
    public UUID getUltimaExecucaoId() { return ultimaExecucaoId; }
    public Instant getObservadaEm() { return observadaEm; }
    public Instant getProximaConsultaEm() { return proximaConsultaEm; }
    public int getAntecedenciaDias() { return antecedenciaDias; }
    public String getMensagemFonte() { return mensagemFonte; }
    public boolean isAtiva() { return ativa; }
    public Instant getAlertaVencimentoEm() { return alertaVencimentoEm; }
    public Instant getAlertaIrregularEm() { return alertaIrregularEm; }
}
