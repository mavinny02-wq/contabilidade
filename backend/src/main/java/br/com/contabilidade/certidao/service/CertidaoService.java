package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.api.CertidaoResponse;
import br.com.contabilidade.certidao.api.HistoricoCertidaoResponse;
import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.HistoricoCertidao;
import br.com.contabilidade.certidao.domain.ResultadoCertidao;
import br.com.contabilidade.certidao.domain.SituacaoConsultaCertidao;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import br.com.contabilidade.certidao.repository.HistoricoCertidaoRepository;
import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.document.DocumentoService;
import br.com.contabilidade.common.document.OrigemDocumento;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import br.com.contabilidade.common.execution.ComandoCriarExecucao;
import br.com.contabilidade.common.execution.ExecucaoFilaService;
import br.com.contabilidade.common.execution.ExecucaoIntegracao;
import br.com.contabilidade.common.execution.StatusExecucao;
import br.com.contabilidade.common.integration.DefinicaoProvedor;
import br.com.contabilidade.common.integration.PoliticaAquisicaoService;
import br.com.contabilidade.common.integration.TipoProvedor;
import br.com.contabilidade.common.intervention.IntervencaoService;
import br.com.contabilidade.common.intervention.TipoIntervencao;
import br.com.contabilidade.common.notification.NotificacaoService;
import br.com.contabilidade.common.notification.TipoNotificacao;
import br.com.contabilidade.empresa.domain.Empresa;
import br.com.contabilidade.empresa.domain.Estabelecimento;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import br.com.contabilidade.empresa.repository.EstabelecimentoRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CertidaoService {

    private final CertidaoAcompanhamentoRepository repository;
    private final HistoricoCertidaoRepository historicoRepository;
    private final EmpresaRepository empresaRepository;
    private final EstabelecimentoRepository estabelecimentoRepository;
    private final PoliticaAquisicaoService politicaService;
    private final ExecucaoFilaService filaService;
    private final IntervencaoService intervencaoService;
    private final DocumentoService documentoService;
    private final NotificacaoService notificacaoService;
    private final AuditoriaService auditoriaService;

    public CertidaoService(CertidaoAcompanhamentoRepository repository,
                           HistoricoCertidaoRepository historicoRepository,
                           EmpresaRepository empresaRepository,
                           EstabelecimentoRepository estabelecimentoRepository,
                           PoliticaAquisicaoService politicaService,
                           ExecucaoFilaService filaService,
                           IntervencaoService intervencaoService,
                           DocumentoService documentoService,
                           NotificacaoService notificacaoService,
                           AuditoriaService auditoriaService) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.empresaRepository = empresaRepository;
        this.estabelecimentoRepository = estabelecimentoRepository;
        this.politicaService = politicaService;
        this.filaService = filaService;
        this.intervencaoService = intervencaoService;
        this.documentoService = documentoService;
        this.notificacaoService = notificacaoService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public List<CertidaoResponse> listarPorEmpresa(UUID empresaId) {
        Empresa empresa = buscarEmpresa(empresaId);
        inicializarAusentes(empresa);
        Map<UUID, String> cnpjs = cnpjs(empresa);
        return repository.findByEmpresaIdAndAtivaTrueOrderByEstabelecimentoIdAscTipoAsc(empresaId)
                .stream().map(item -> CertidaoResponse.de(item, cnpjs.get(item.getEstabelecimentoId()),
                        LocalDate.now())).toList();
    }

    @Transactional
    public List<CertidaoResponse> listarTodas() {
        empresaRepository.findByAtivaTrueOrderByRazaoSocialAsc().forEach(this::inicializarAusentes);
        Map<UUID, String> cnpjs = new java.util.HashMap<>();
        estabelecimentoRepository.findAll().forEach(item -> cnpjs.put(item.getId(), item.getCnpj()));
        return repository.findByAtivaTrueOrderByEmpresaIdAscEstabelecimentoIdAscTipoAsc().stream()
                .map(item -> CertidaoResponse.de(item, cnpjs.get(item.getEstabelecimentoId()),
                        LocalDate.now())).toList();
    }

    @Transactional
    public CertidaoResponse solicitar(UUID acompanhamentoId, String idempotencyKey) {
        CertidaoAcompanhamento acompanhamento = buscarAtiva(acompanhamentoId);
        Estabelecimento estabelecimento = buscarEstabelecimento(acompanhamento.getEstabelecimentoId());
        if (acompanhamento.getUltimaExecucaoId() != null) {
            ExecucaoIntegracao ultima = filaService.buscar(acompanhamento.getUltimaExecucaoId());
            if (!ultima.getStatus().terminal()) {
                return CertidaoResponse.de(acompanhamento, estabelecimento.getCnpj(), LocalDate.now());
            }
        }
        PoliticaAquisicaoService.PoliticaResolvida politica = politicaService.resolver(
                acompanhamento.getTipo().operacao());
        DefinicaoProvedor provedor = politica.primario();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("acompanhamentoId", acompanhamento.getId());
        payload.put("empresaId", acompanhamento.getEmpresaId());
        payload.put("estabelecimentoId", acompanhamento.getEstabelecimentoId());
        payload.put("cnpj", estabelecimento.getCnpj());
        payload.put("tipo", acompanhamento.getTipo().name());
        payload.put("permitirIntervencao", politica.politica().isPermitirIntervencao());
        payload.put("timeoutHumanoMinutos", politica.politica().getTimeoutHumanoMinutos());
        payload.put("provedorTimeoutSegundos", provedor.getTimeoutSegundos());
        payload.put("provedorCustoEstimadoPorChamada", provedor.getCustoEstimadoPadrao());
        payload.put("provedorMoeda", provedor.getMoeda());

        String chave = idempotencyKey == null || idempotencyKey.isBlank()
                ? "CERTIDAO:" + acompanhamento.getId() + ":" + UUID.randomUUID()
                : idempotencyKey.trim();
        ExecucaoFilaService.ResultadoCriacaoExecucao criacao = filaService.criarComResultado(
                new ComandoCriarExecucao(
                        acompanhamento.getEmpresaId(), acompanhamento.getTipo().operacao(),
                        provedor.getCodigo(), 100, Math.max(1, provedor.getMaxRetries() + 1),
                        payload, chave, acompanhamento.getUltimaExecucaoId()
                )
        );
        ExecucaoIntegracao execucao = criacao.execucao();
        if (!criacao.nova()) {
            return CertidaoResponse.de(acompanhamento, estabelecimento.getCnpj(), LocalDate.now());
        }
        acompanhamento.agendar(execucao.getId(), provedor.getCodigo(), provedor.getTipo());
        historicoRepository.save(new HistoricoCertidao(acompanhamento));

        if (provedor.getTipo() == TipoProvedor.MANUAL) {
            execucao.aguardarHumano(StatusExecucao.AGUARDANDO_HUMANO,
                    "RESULTADO_MANUAL_NECESSARIO", "Registre a certidão obtida manualmente.");
            acompanhamento.exigirAcaoManual(execucao.getId(), provedor.getCodigo(),
                    provedor.getTipo(), "A política atual exige registro manual da certidão.");
            historicoRepository.save(new HistoricoCertidao(acompanhamento));
            intervencaoService.criar(execucao.getId(), acompanhamento.getEmpresaId(),
                    TipoIntervencao.OUTRA, "certidoes.intervencao.titulo",
                    "certidoes.intervencao.instrucao", null,
                    Duration.ofMinutes(politica.politica().getTimeoutHumanoMinutos()));
        }
        auditoriaService.registrar("CERTIDAO_SOLICITADA", "CERTIDAO_ACOMPANHAMENTO",
                acompanhamento.getId(), Map.of("provedor", provedor.getCodigo(),
                        "execucaoId", execucao.getId()));
        return CertidaoResponse.de(acompanhamento, estabelecimento.getCnpj(), LocalDate.now());
    }

    @Transactional
    public List<CertidaoResponse> solicitarTodas(UUID empresaId) {
        List<CertidaoResponse> saida = new ArrayList<>();
        for (CertidaoResponse item : listarPorEmpresa(empresaId)) {
            try {
                saida.add(solicitar(item.id(), null));
            } catch (ExcecaoNegocio exception) {
                if (!List.of(
                        "SEM_PROVEDOR_DISPONIVEL",
                        "POLITICA_DESABILITADA",
                        "POLITICA_NAO_ENCONTRADA"
                ).contains(exception.getCodigo())) {
                    throw exception;
                }
            }
        }
        return saida;
    }

    @Transactional
    public CertidaoResponse registrarManual(UUID acompanhamentoId, ResultadoCertidao resultado,
                                            String numero, LocalDate emitidaEm, LocalDate validaAte,
                                            String mensagem, MultipartFile arquivo) {
        CertidaoAcompanhamento acompanhamento = buscarAtiva(acompanhamentoId);
        Estabelecimento estabelecimento = buscarEstabelecimento(acompanhamento.getEstabelecimentoId());
        validarResultadoManual(resultado, emitidaEm, validaAte, arquivo);
        UUID documentoId = null;
        if (arquivo != null && !arquivo.isEmpty()) {
            documentoId = documentoService.enviarComOrigem(acompanhamento.getEmpresaId(),
                    "CERTIDAO_" + acompanhamento.getTipo().name(), arquivo, emitidaEm, validaAte,
                    OrigemDocumento.MANUAL).id();
        }
        UUID execucaoId = acompanhamento.getUltimaExecucaoId();
        Map<String, Object> resultadoNormalizado = new LinkedHashMap<>();
        resultadoNormalizado.put("acompanhamentoId", acompanhamento.getId());
        resultadoNormalizado.put("resultado", resultado.name());
        resultadoNormalizado.put("numeroCertidao", numero);
        resultadoNormalizado.put("emitidaEm", emitidaEm == null ? null : emitidaEm.toString());
        resultadoNormalizado.put("validaAte", validaAte == null ? null : validaAte.toString());
        resultadoNormalizado.put("documentoId", documentoId);
        resultadoNormalizado.put("mensagemFonte", mensagem);

        boolean concluidaPeloMotor = false;
        if (execucaoId != null) {
            ExecucaoIntegracao execucao = filaService.buscar(execucaoId);
            if (execucao.getStatus().esperaHumana()) {
                filaService.concluirIntervencao(execucaoId, resultadoNormalizado);
                intervencaoService.resolverPorExecucao(execucaoId, "sistema",
                        "Resultado manual da certidão registrado.");
                concluidaPeloMotor = true;
            } else if (!execucao.getStatus().terminal()) {
                filaService.cancelar(execucaoId, "Resultado manual da certidão registrado.");
            }
        }
        if (!concluidaPeloMotor) {
            acompanhamento.aplicarResultado(resultado, numero, emitidaEm, validaAte, documentoId,
                    "MANUAL", TipoProvedor.MANUAL, execucaoId, mensagem);
            historicoRepository.save(new HistoricoCertidao(acompanhamento));
            notificarResultado(acompanhamento);
        }
        auditoriaService.registrar("CERTIDAO_REGISTRADA_MANUALMENTE", "CERTIDAO_ACOMPANHAMENTO",
                acompanhamento.getId(), Map.of("resultado", resultado.name(),
                        "documentoId", String.valueOf(documentoId)));
        return CertidaoResponse.de(acompanhamento, estabelecimento.getCnpj(), LocalDate.now());
    }

    @Transactional(readOnly = true)
    public Page<HistoricoCertidaoResponse> historico(UUID acompanhamentoId, int pagina, int tamanho) {
        buscar(acompanhamentoId);
        return historicoRepository.findByAcompanhamentoIdOrderByObservadaEmDesc(acompanhamentoId,
                PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100)))
                .map(HistoricoCertidaoResponse::de);
    }

    @Transactional
    public int agendarVencidas() {
        empresaRepository.findByAtivaTrueOrderByRazaoSocialAsc().forEach(this::inicializarAusentes);
        int total = 0;
        for (CertidaoAcompanhamento item : repository.findByAtivaTrueAndProximaConsultaEmBefore(Instant.now())) {
            try {
                solicitar(item.getId(), "CERTIDAO:SCHEDULER:" + item.getId() + ":" + LocalDate.now());
                total++;
            } catch (ExcecaoNegocio exception) {
                if (!List.of(
                        "SEM_PROVEDOR_DISPONIVEL",
                        "POLITICA_DESABILITADA",
                        "POLITICA_NAO_ENCONTRADA"
                ).contains(exception.getCodigo())) {
                    throw exception;
                }
                // Configuração sem provider não transforma a situação fiscal.
            }
        }
        return total;
    }

    @Transactional
    public int emitirAlertas() {
        empresaRepository.findByAtivaTrueOrderByRazaoSocialAsc().forEach(this::inicializarAusentes);
        int total = 0;
        LocalDate hoje = LocalDate.now();
        for (CertidaoAcompanhamento item : repository.findByAtivaTrueOrderByEmpresaIdAscEstabelecimentoIdAscTipoAsc()) {
            switch (item.statusExibicao(hoje)) {
                case VENCIDA, PROXIMA_DO_VENCIMENTO -> {
                    if (item.getAlertaVencimentoEm() == null) {
                        notificacaoService.criar(TipoNotificacao.AVISO,
                                "certidoes.alertas.vencimentoTitulo",
                                "certidoes.alertas.vencimentoMensagem",
                                "/certidoes", null);
                        item.registrarAlertaVencimento();
                        total++;
                    }
                }
                case IRREGULAR -> {
                    if (item.getAlertaIrregularEm() == null) {
                        notificacaoService.criar(TipoNotificacao.ACAO_NECESSARIA,
                                "certidoes.alertas.irregularTitulo",
                                "certidoes.alertas.irregularMensagem",
                                "/certidoes", null);
                        item.registrarAlertaIrregular();
                        total++;
                    }
                }
                default -> { }
            }
        }
        return total;
    }

    public long contarAtivas() { return repository.countByAtivaTrue(); }

    private void inicializarAusentes(Empresa empresa) {
        for (Estabelecimento estabelecimento : empresa.getEstabelecimentos()) {
            if (!estabelecimento.isAtivo()) continue;
            for (TipoCertidao tipo : TipoCertidao.values()) {
                if (!tipo.aplicavel(estabelecimento.getUf(), estabelecimento.isMatriz())) continue;
                repository.findByEstabelecimentoIdAndTipo(estabelecimento.getId(), tipo)
                        .orElseGet(() -> repository.save(new CertidaoAcompanhamento(
                                empresa.getId(), estabelecimento.getId(), tipo)));
            }
        }
    }

    private Map<UUID, String> cnpjs(Empresa empresa) {
        Map<UUID, String> mapa = new java.util.HashMap<>();
        empresa.getEstabelecimentos().forEach(item -> mapa.put(item.getId(), item.getCnpj()));
        return mapa;
    }

    private void validarResultadoManual(
            ResultadoCertidao resultado,
            LocalDate emitidaEm,
            LocalDate validaAte,
            MultipartFile arquivo
    ) {
        if (resultado == null || resultado == ResultadoCertidao.DESCONHECIDO) {
            throw new ExcecaoNegocio(
                    "RESULTADO_CERTIDAO_INVALIDO",
                    "erros.resultadoCertidaoInvalido",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (emitidaEm != null && validaAte != null && validaAte.isBefore(emitidaEm)) {
            throw new ExcecaoNegocio(
                    "VALIDADE_CERTIDAO_INVALIDA",
                    "erros.resultadoCertidaoInvalido",
                    HttpStatus.BAD_REQUEST
            );
        }
        if ((resultado == ResultadoCertidao.REGULAR
                || resultado == ResultadoCertidao.POSITIVA_COM_EFEITO_NEGATIVA)
                && (emitidaEm == null || validaAte == null)) {
            throw new ExcecaoNegocio(
                    "DATAS_CERTIDAO_OBRIGATORIAS",
                    "erros.datasCertidaoObrigatorias",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (resultado != ResultadoCertidao.INCOMPLETA && (arquivo == null || arquivo.isEmpty())) {
            throw new ExcecaoNegocio(
                    "DOCUMENTO_CERTIDAO_OBRIGATORIO",
                    "erros.documentoCertidaoObrigatorio",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private void notificarResultado(CertidaoAcompanhamento item) {
        if (item.getResultado() == ResultadoCertidao.IRREGULAR) {
            notificacaoService.criar(TipoNotificacao.ACAO_NECESSARIA,
                    "certidoes.alertas.irregularTitulo", "certidoes.alertas.irregularMensagem",
                    "/certidoes", null);
            item.registrarAlertaIrregular();
        }
    }

    private CertidaoAcompanhamento buscar(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException(
                "CERTIDAO_NAO_ENCONTRADA", "erros.certidaoNaoEncontrada"));
    }

    private CertidaoAcompanhamento buscarAtiva(UUID id) {
        CertidaoAcompanhamento acompanhamento = buscar(id);
        if (!acompanhamento.isAtiva()) {
            throw new ExcecaoNegocio(
                    "CERTIDAO_INATIVA",
                    "erros.certidaoInativa",
                    HttpStatus.CONFLICT
            );
        }
        return acompanhamento;
    }

    private Empresa buscarEmpresa(UUID id) {
        return empresaRepository.buscarDetalhada(id).orElseThrow(() -> new RecursoNaoEncontradoException(
                "EMPRESA_NAO_ENCONTRADA", "erros.empresaNaoEncontrada"));
    }

    private Estabelecimento buscarEstabelecimento(UUID id) {
        return estabelecimentoRepository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException(
                "ESTABELECIMENTO_NAO_ENCONTRADO", "erros.estabelecimentoNaoEncontrado"));
    }
    @Transactional
    public ResumoCertidoes contarResumo() {
        empresaRepository.findByAtivaTrueOrderByRazaoSocialAsc().forEach(this::inicializarAusentes);
        LocalDate hoje = LocalDate.now();
        long regulares = 0;
        long atencao = 0;
        long acaoManual = 0;
        for (CertidaoAcompanhamento item : repository.findByAtivaTrueOrderByEmpresaIdAscEstabelecimentoIdAscTipoAsc()) {
            var status = item.statusExibicao(hoje);
            if (status == br.com.contabilidade.certidao.domain.StatusCertidao.REGULAR) {
                regulares++;
            } else if (status == br.com.contabilidade.certidao.domain.StatusCertidao.ACAO_MANUAL_NECESSARIA) {
                acaoManual++;
                atencao++;
            } else if (status != br.com.contabilidade.certidao.domain.StatusCertidao.NAO_CONSULTADA
                    && status != br.com.contabilidade.certidao.domain.StatusCertidao.AGENDADA
                    && status != br.com.contabilidade.certidao.domain.StatusCertidao.EM_PROCESSAMENTO) {
                atencao++;
            }
        }
        return new ResumoCertidoes(regulares, atencao, acaoManual);
    }

    public record ResumoCertidoes(long regulares, long atencao, long acaoManual) { }

}
