package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.HistoricoCertidao;
import br.com.contabilidade.certidao.domain.ResultadoCertidao;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import br.com.contabilidade.certidao.repository.HistoricoCertidaoRepository;
import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.document.DocumentoService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import br.com.contabilidade.common.execution.ComandoCriarExecucao;
import br.com.contabilidade.common.execution.ExecucaoIntegracao;
import br.com.contabilidade.common.execution.ExecucaoLifecycleHandler;
import br.com.contabilidade.common.execution.StatusExecucao;
import br.com.contabilidade.common.integration.DefinicaoProvedor;
import br.com.contabilidade.common.integration.DefinicaoProvedorRepository;
import br.com.contabilidade.common.integration.PoliticaAquisicaoService;
import br.com.contabilidade.common.integration.TipoProvedor;
import br.com.contabilidade.common.intervention.IntervencaoRegistroService;
import br.com.contabilidade.common.intervention.TipoIntervencao;
import br.com.contabilidade.common.notification.NotificacaoService;
import br.com.contabilidade.common.notification.TipoNotificacao;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class CertidaoExecucaoHandler implements ExecucaoLifecycleHandler {

    private final CertidaoAcompanhamentoRepository repository;
    private final HistoricoCertidaoRepository historicoRepository;
    private final DefinicaoProvedorRepository provedorRepository;
    private final PoliticaAquisicaoService politicaService;
    private final IntervencaoRegistroService intervencaoRegistroService;
    private final NotificacaoService notificacaoService;
    private final AuditoriaService auditoriaService;
    private final DocumentoService documentoService;
    private final ObjectMapper objectMapper;

    public CertidaoExecucaoHandler(
            CertidaoAcompanhamentoRepository repository,
            HistoricoCertidaoRepository historicoRepository,
            DefinicaoProvedorRepository provedorRepository,
            PoliticaAquisicaoService politicaService,
            IntervencaoRegistroService intervencaoRegistroService,
            NotificacaoService notificacaoService,
            AuditoriaService auditoriaService,
            DocumentoService documentoService,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.provedorRepository = provedorRepository;
        this.politicaService = politicaService;
        this.intervencaoRegistroService = intervencaoRegistroService;
        this.notificacaoService = notificacaoService;
        this.auditoriaService = auditoriaService;
        this.documentoService = documentoService;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean suporta(String operacao) {
        if (operacao == null) return false;
        for (TipoCertidao tipo : TipoCertidao.values()) {
            if (tipo.operacao().equals(operacao)) return true;
        }
        return false;
    }

    @Override
    public void aoAdquirir(ExecucaoIntegracao execucao) {
        CertidaoAcompanhamento acompanhamento = acompanhamento(execucao);
        acompanhamento.marcarProcessando(execucao.getId());
        historicoRepository.save(new HistoricoCertidao(acompanhamento));
    }

    @Override
    public void aoConcluir(ExecucaoIntegracao execucao, Object resultadoNormalizado) {
        CertidaoAcompanhamento acompanhamento = acompanhamento(execucao);
        Map<String, Object> resultado = mapaResultado(resultadoNormalizado);
        ResultadoCertidao estado = enumObrigatorio(
                ResultadoCertidao.class,
                texto(resultado, "resultado"),
                "RESULTADO_CERTIDAO_INVALIDO",
                "erros.resultadoCertidaoInvalido"
        );
        UUID acompanhamentoRecebido = uuid(resultado, "acompanhamentoId");
        if (acompanhamentoRecebido != null && !acompanhamentoRecebido.equals(acompanhamento.getId())) {
            throw new ExcecaoNegocio(
                    "RESULTADO_EXECUCAO_INCONSISTENTE",
                    "erros.resultadoExecucaoInconsistente",
                    HttpStatus.CONFLICT
            );
        }

        LocalDate emitidaEm = data(resultado, "emitidaEm");
        LocalDate validaAte = data(resultado, "validaAte");
        UUID documentoId = uuid(resultado, "documentoId");
        validarResultadoNormalizado(acompanhamento, estado, emitidaEm, validaAte, documentoId);

        TipoProvedor modo = modo(execucao);
        try {
            acompanhamento.aplicarResultado(
                    estado,
                    texto(resultado, "numeroCertidao", "numero"),
                    emitidaEm,
                    validaAte,
                    documentoId,
                    execucao.getProvedorCodigo(),
                    modo,
                    execucao.getId(),
                    texto(resultado, "mensagemFonte", "mensagem")
            );
        } catch (IllegalArgumentException exception) {
            throw new ExcecaoNegocio(
                    "RESULTADO_CERTIDAO_INVALIDO",
                    "erros.resultadoCertidaoInvalido",
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    exception
            );
        }
        historicoRepository.save(new HistoricoCertidao(acompanhamento));
        notificarResultado(acompanhamento);
        auditoriaService.registrar(
                "CERTIDAO_ATUALIZADA_POR_EXECUCAO",
                "CERTIDAO_ACOMPANHAMENTO",
                acompanhamento.getId(),
                Map.of(
                        "execucaoId", execucao.getId(),
                        "resultado", estado.name(),
                        "provedor", String.valueOf(execucao.getProvedorCodigo())
                )
        );
    }

    @Override
    public void aoFalhar(ExecucaoIntegracao execucao) {
        CertidaoAcompanhamento acompanhamento = acompanhamento(execucao);
        TipoProvedor modo = modo(execucao);
        String mensagem = execucao.getErroResumo() == null
                ? execucao.getErroCodigo()
                : execucao.getErroResumo();

        if (execucao.getStatus() == StatusExecucao.RETRY_AGENDADO) {
            acompanhamento.reagendar(
                    execucao.getId(),
                    execucao.getProvedorCodigo(),
                    modo,
                    mensagem
            );
            historicoRepository.save(new HistoricoCertidao(acompanhamento));
            return;
        }

        if (execucao.getStatus() == StatusExecucao.FONTE_INDISPONIVEL) {
            acompanhamento.fonteIndisponivel(
                    execucao.getId(),
                    execucao.getProvedorCodigo(),
                    modo,
                    mensagem
            );
            notificacaoService.criar(
                    TipoNotificacao.AVISO,
                    "certidoes.alertas.fonteIndisponivelTitulo",
                    "certidoes.alertas.fonteIndisponivelMensagem",
                    "/certidoes",
                    null
            );
        } else {
            acompanhamento.falhar(
                    execucao.getId(),
                    execucao.getProvedorCodigo(),
                    modo,
                    mensagem
            );
        }
        historicoRepository.save(new HistoricoCertidao(acompanhamento));
    }

    @Override
    public void aoAguardarHumano(ExecucaoIntegracao execucao) {
        CertidaoAcompanhamento acompanhamento = acompanhamento(execucao);
        acompanhamento.exigirAcaoManual(
                execucao.getId(),
                execucao.getProvedorCodigo(),
                modo(execucao),
                execucao.getErroResumo()
        );
        historicoRepository.save(new HistoricoCertidao(acompanhamento));
    }

    @Override
    public void aoRetomar(ExecucaoIntegracao execucao) {
        CertidaoAcompanhamento acompanhamento = acompanhamento(execucao);
        acompanhamento.reagendar(
                execucao.getId(),
                execucao.getProvedorCodigo(),
                modo(execucao),
                "A intervenção foi concluída e a execução será retomada."
        );
        historicoRepository.save(new HistoricoCertidao(acompanhamento));
    }

    @Override
    public void aoCancelar(ExecucaoIntegracao execucao) {
        CertidaoAcompanhamento acompanhamento = acompanhamento(execucao);
        acompanhamento.falhar(
                execucao.getId(),
                execucao.getProvedorCodigo(),
                modo(execucao),
                execucao.getMotivoCancelamento() == null
                        ? "A execução foi cancelada."
                        : execucao.getMotivoCancelamento()
        );
        historicoRepository.save(new HistoricoCertidao(acompanhamento));
    }

    @Override
    public Optional<ComandoCriarExecucao> fallbackAposFalha(ExecucaoIntegracao execucao) {
        if (execucao.getStatus() != StatusExecucao.FALHA
                && execucao.getStatus() != StatusExecucao.FONTE_INDISPONIVEL) {
            return Optional.empty();
        }
        PoliticaAquisicaoService.PoliticaResolvida politica;
        try {
            politica = politicaService.resolver(execucao.getOperacao());
        } catch (ExcecaoNegocio exception) {
            return Optional.empty();
        }
        List<DefinicaoProvedor> provedores = politica.provedores();
        int atual = -1;
        for (int i = 0; i < provedores.size(); i++) {
            if (provedores.get(i).getCodigo().equals(execucao.getProvedorCodigo())) {
                atual = i;
                break;
            }
        }
        DefinicaoProvedor proximo = null;
        for (int i = Math.max(atual + 1, 0); i < provedores.size(); i++) {
            if (!provedores.get(i).getCodigo().equals(execucao.getProvedorCodigo())) {
                proximo = provedores.get(i);
                break;
            }
        }
        if (proximo == null) return Optional.empty();

        Map<String, Object> payload = lerMapa(execucao.getPayloadJson(), "PAYLOAD_EXECUCAO_INVALIDO");
        return Optional.of(new ComandoCriarExecucao(
                execucao.getEmpresaId(),
                execucao.getOperacao(),
                proximo.getCodigo(),
                Math.max(0, execucao.getPrioridade() - 1),
                Math.max(1, proximo.getMaxRetries() + 1),
                payload,
                "FALLBACK:" + execucao.getId() + ":" + proximo.getCodigo(),
                execucao.getId()
        ));
    }

    @Override
    public void aoCriarFallback(ExecucaoIntegracao anterior, ExecucaoIntegracao fallback) {
        CertidaoAcompanhamento acompanhamento = acompanhamento(anterior);
        TipoProvedor modoFallback = modo(fallback);
        if (modoFallback == TipoProvedor.MANUAL) {
            fallback.aguardarHumano(
                    StatusExecucao.AGUARDANDO_HUMANO,
                    "RESULTADO_MANUAL_NECESSARIO",
                    "Os providers automáticos não concluíram a consulta. Registre a certidão manualmente."
            );
            acompanhamento.exigirAcaoManual(
                    fallback.getId(),
                    fallback.getProvedorCodigo(),
                    modoFallback,
                    "Os providers anteriores não concluíram a consulta. Registre o resultado manualmente."
            );
            int timeout = politicaService.resolver(fallback.getOperacao())
                    .politica()
                    .getTimeoutHumanoMinutos();
            intervencaoRegistroService.criar(
                    fallback.getId(),
                    acompanhamento.getEmpresaId(),
                    TipoIntervencao.OUTRA,
                    "certidoes.intervencao.titulo",
                    "certidoes.intervencao.instrucao",
                    null,
                    Duration.ofMinutes(timeout)
            );
        } else {
            acompanhamento.agendar(
                    fallback.getId(),
                    fallback.getProvedorCodigo(),
                    modoFallback
            );
        }
        historicoRepository.save(new HistoricoCertidao(acompanhamento));
        auditoriaService.registrar(
                "CERTIDAO_FALLBACK_AGENDADO",
                "CERTIDAO_ACOMPANHAMENTO",
                acompanhamento.getId(),
                Map.of(
                        "execucaoAnteriorId", anterior.getId(),
                        "execucaoFallbackId", fallback.getId(),
                        "provedor", String.valueOf(fallback.getProvedorCodigo()),
                        "modo", modoFallback.name()
                )
        );
    }

    private CertidaoAcompanhamento acompanhamento(ExecucaoIntegracao execucao) {
        Map<String, Object> payload = lerMapa(execucao.getPayloadJson(), "PAYLOAD_EXECUCAO_INVALIDO");
        UUID id = uuid(payload, "acompanhamentoId");
        if (id == null) {
            throw new ExcecaoNegocio(
                    "PAYLOAD_EXECUCAO_INVALIDO",
                    "erros.payloadExecucaoInvalido",
                    HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException(
                "CERTIDAO_NAO_ENCONTRADA",
                "erros.certidaoNaoEncontrada"
        ));
    }

    private TipoProvedor modo(ExecucaoIntegracao execucao) {
        return provedorRepository.findByCodigo(execucao.getProvedorCodigo())
                .map(provedor -> provedor.getTipo())
                .orElseGet(() -> "MANUAL".equalsIgnoreCase(execucao.getProvedorCodigo())
                        ? TipoProvedor.MANUAL
                        : TipoProvedor.PORTAL_ASSISTIDO);
    }

    private Map<String, Object> mapaResultado(Object valor) {
        if (valor instanceof Map<?, ?> mapa) {
            Map<String, Object> convertido = new LinkedHashMap<>();
            mapa.forEach((chave, item) -> convertido.put(String.valueOf(chave), item));
            return convertido;
        }
        throw new ExcecaoNegocio(
                "RESULTADO_CERTIDAO_INVALIDO",
                "erros.resultadoCertidaoInvalido",
                HttpStatus.UNPROCESSABLE_ENTITY
        );
    }

    private Map<String, Object> lerMapa(String json, String codigo) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() { });
        } catch (JsonProcessingException exception) {
            throw new ExcecaoNegocio(
                    codigo,
                    "erros.payloadExecucaoInvalido",
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    exception
            );
        }
    }

    private String texto(Map<String, Object> mapa, String... chaves) {
        for (String chave : chaves) {
            Object valor = mapa.get(chave);
            if (valor != null) {
                String texto = String.valueOf(valor).trim();
                if (!texto.isBlank() && !"null".equalsIgnoreCase(texto)) return texto;
            }
        }
        return null;
    }

    private UUID uuid(Map<String, Object> mapa, String chave) {
        String valor = texto(mapa, chave);
        if (valor == null) return null;
        try {
            return UUID.fromString(valor);
        } catch (IllegalArgumentException exception) {
            throw new ExcecaoNegocio(
                    "UUID_RESULTADO_INVALIDO",
                    "erros.resultadoExecucaoInconsistente",
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    exception
            );
        }
    }

    private LocalDate data(Map<String, Object> mapa, String chave) {
        String valor = texto(mapa, chave);
        if (valor == null) return null;
        try {
            return LocalDate.parse(valor);
        } catch (java.time.format.DateTimeParseException exception) {
            throw new ExcecaoNegocio(
                    "DATA_RESULTADO_INVALIDA",
                    "erros.resultadoCertidaoInvalido",
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    exception
            );
        }
    }

    private <E extends Enum<E>> E enumObrigatorio(
            Class<E> tipo,
            String valor,
            String codigo,
            String mensagemKey
    ) {
        try {
            if (valor == null) throw new IllegalArgumentException("valor ausente");
            return Enum.valueOf(tipo, valor.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ExcecaoNegocio(codigo, mensagemKey, HttpStatus.UNPROCESSABLE_ENTITY, exception);
        }
    }

    private void validarResultadoNormalizado(
            CertidaoAcompanhamento acompanhamento,
            ResultadoCertidao estado,
            LocalDate emitidaEm,
            LocalDate validaAte,
            UUID documentoId
    ) {
        if (estado == ResultadoCertidao.DESCONHECIDO) {
            throw new ExcecaoNegocio(
                    "RESULTADO_CERTIDAO_INVALIDO",
                    "erros.resultadoCertidaoInvalido",
                    HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        if (emitidaEm != null && validaAte != null && validaAte.isBefore(emitidaEm)) {
            throw new ExcecaoNegocio(
                    "DATA_RESULTADO_INVALIDA",
                    "erros.resultadoCertidaoInvalido",
                    HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        if ((estado == ResultadoCertidao.REGULAR
                || estado == ResultadoCertidao.POSITIVA_COM_EFEITO_NEGATIVA)
                && (emitidaEm == null || validaAte == null)) {
            throw new ExcecaoNegocio(
                    "DATAS_CERTIDAO_OBRIGATORIAS",
                    "erros.datasCertidaoObrigatorias",
                    HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        if (estado != ResultadoCertidao.INCOMPLETA && documentoId == null) {
            throw new ExcecaoNegocio(
                    "DOCUMENTO_CERTIDAO_OBRIGATORIO",
                    "erros.documentoCertidaoObrigatorio",
                    HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        if (documentoId != null) {
            documentoService.obterAtivoDaEmpresa(documentoId, acompanhamento.getEmpresaId());
        }
    }

    private void notificarResultado(CertidaoAcompanhamento acompanhamento) {
        if (acompanhamento.getResultado() == ResultadoCertidao.IRREGULAR) {
            notificacaoService.criar(
                    TipoNotificacao.ACAO_NECESSARIA,
                    "certidoes.alertas.irregularTitulo",
                    "certidoes.alertas.irregularMensagem",
                    "/certidoes",
                    null
            );
            acompanhamento.registrarAlertaIrregular();
        }
    }
}
