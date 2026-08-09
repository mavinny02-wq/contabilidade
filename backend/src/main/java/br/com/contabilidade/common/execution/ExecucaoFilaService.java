package br.com.contabilidade.common.execution;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExecucaoFilaService {

    private final ExecucaoIntegracaoRepository repository;
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final AuditoriaService auditoriaService;
    private final List<ExecucaoLifecycleHandler> lifecycleHandlers;

    public ExecucaoFilaService(
            ExecucaoIntegracaoRepository repository,
            NamedParameterJdbcTemplate jdbc,
            ObjectMapper objectMapper,
            AuditoriaService auditoriaService,
            List<ExecucaoLifecycleHandler> lifecycleHandlers
    ) {
        this.repository = repository;
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.auditoriaService = auditoriaService;
        this.lifecycleHandlers = List.copyOf(lifecycleHandlers);
    }

    @Transactional
    public ExecucaoIntegracao criar(ComandoCriarExecucao comando) {
        return criarComResultado(comando).execucao();
    }

    @Transactional
    public ResultadoCriacaoExecucao criarComResultado(ComandoCriarExecucao comando) {
        String operacao = exigirTexto(comando.operacao(), "operacao");
        String provedor = limpar(comando.provedorCodigo());
        String payloadJson = serializar(comando.payload());
        String chave = limpar(comando.idempotencyKey());

        if (chave != null) {
            Optional<ExecucaoIntegracao> existente = repository.findByIdempotencyKey(chave);
            if (existente.isPresent()) {
                ExecucaoIntegracao atual = existente.get();
                if (!Objects.equals(atual.getEmpresaId(), comando.empresaId())
                        || !Objects.equals(atual.getOperacao(), operacao)
                        || !Objects.equals(atual.getProvedorCodigo(), provedor)
                        || !Objects.equals(atual.getPayloadJson(), payloadJson)) {
                    throw new ExcecaoNegocio(
                            "IDEMPOTENCY_KEY_CONFLITANTE",
                            "erros.idempotencyKeyConflitante",
                            HttpStatus.CONFLICT
                    );
                }
                return new ResultadoCriacaoExecucao(atual, false);
            }
        }

        ExecucaoIntegracao execucao = new ExecucaoIntegracao(
                comando.empresaId(),
                operacao,
                provedor,
                comando.prioridade(),
                comando.maxTentativas(),
                payloadJson,
                chave,
                comando.execucaoAnteriorId()
        );
        ExecucaoIntegracao salva = repository.save(execucao);
        auditoriaService.registrar(
                "EXECUCAO_CRIADA",
                "EXECUCAO_INTEGRACAO",
                salva.getId(),
                Map.of(
                        "operacao", salva.getOperacao(),
                        "provedor", String.valueOf(salva.getProvedorCodigo())
                )
        );
        return new ResultadoCriacaoExecucao(salva, true);
    }

    @Transactional
    public Optional<ExecucaoLease> adquirir(
            String workerId,
            List<String> operacoes,
            List<String> provedores,
            Duration duracaoLease
    ) {
        List<String> operacoesSeguras = normalizarLista(operacoes, 100, 100);
        List<String> provedoresSeguros = normalizarLista(provedores, 100, 100);
        if (operacoesSeguras.isEmpty() || provedoresSeguros.isEmpty()) {
            return Optional.empty();
        }
        String workerSeguro = limitar(workerId, 120);
        if (workerSeguro == null) {
            throw new ExcecaoNegocio(
                    "WORKER_ID_OBRIGATORIO",
                    "erros.workerIdObrigatorio",
                    HttpStatus.BAD_REQUEST
            );
        }

        UUID token = UUID.randomUUID();
        Instant leaseAte = Instant.now().plus(duracaoLease.isNegative() || duracaoLease.isZero()
                ? Duration.ofMinutes(2)
                : duracaoLease);
        String sql = """
                with candidata as (
                    select id
                      from execucoes_integracao
                     where status in ('NA_FILA', 'RETRY_AGENDADO')
                       and (proxima_tentativa_em is null or proxima_tentativa_em <= current_timestamp)
                       and (lease_ate is null or lease_ate < current_timestamp)
                       and operacao in (:operacoes)
                       and provedor_codigo in (:provedores)
                     order by prioridade desc, criado_em asc
                     for update skip locked
                     limit 1
                )
                update execucoes_integracao e
                   set status = 'EXECUTANDO',
                       tentativas = tentativas + 1,
                       iniciada_em = coalesce(iniciada_em, current_timestamp),
                       lease_token = :token,
                       lease_ate = :leaseAte,
                       worker_id = :workerId,
                       atualizado_em = current_timestamp,
                       versao = versao + 1
                  from candidata
                 where e.id = candidata.id
                returning e.*
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("operacoes", operacoesSeguras)
                .addValue("provedores", provedoresSeguros)
                .addValue("token", token)
                .addValue("leaseAte", leaseAte)
                .addValue("workerId", workerSeguro);
        List<ExecucaoLease> rows = jdbc.query(sql, params, new LeaseRowMapper());
        Optional<ExecucaoLease> lease = rows.stream().findFirst();
        lease.ifPresent(item -> {
            ExecucaoIntegracao execucao = buscar(item.id());
            acionar(execucao, handler -> handler.aoAdquirir(execucao));
            auditoriaService.registrar(
                    "EXECUCAO_ADQUIRIDA",
                    "EXECUCAO_INTEGRACAO",
                    execucao.getId(),
                    Map.of("workerId", workerSeguro, "tentativa", execucao.getTentativas())
            );
        });
        return lease;
    }

    @Transactional
    public Instant renovarLease(UUID id, UUID token, Duration duracao) {
        Instant leaseAte = Instant.now().plus(duracao.isNegative() || duracao.isZero()
                ? Duration.ofMinutes(2)
                : duracao);
        int alteradas = jdbc.update(
                """
                update execucoes_integracao
                   set lease_ate = :leaseAte,
                       atualizado_em = current_timestamp,
                       versao = versao + 1
                 where id = :id
                   and lease_token = :token
                   and status = 'EXECUTANDO'
                """,
                Map.of("id", id, "token", token, "leaseAte", leaseAte)
        );
        if (alteradas == 0) throw leaseInvalido();
        return leaseAte;
    }

    @Transactional
    public ExecucaoIntegracao concluir(
            UUID id,
            UUID token,
            String protocolo,
            Object resultado,
            BigDecimal custo,
            String moeda
    ) {
        ExecucaoIntegracao execucao = buscarComLease(id, token);
        try {
            execucao.concluir(protocolo, serializar(resultado), custo, moeda);
        } catch (IllegalStateException exception) {
            throw transicaoInvalida(exception);
        }
        acionar(execucao, handler -> handler.aoConcluir(execucao, resultado));
        auditoriaService.registrar(
                "EXECUCAO_CONCLUIDA",
                "EXECUCAO_INTEGRACAO",
                id,
                Map.of("operacao", execucao.getOperacao())
        );
        return execucao;
    }

    @Transactional
    public ExecucaoIntegracao falhar(
            UUID id,
            UUID token,
            String codigo,
            String resumo,
            boolean retryable,
            boolean fonteIndisponivel
    ) {
        ExecucaoIntegracao execucao = buscarComLease(id, token);
        boolean agendouRetry = retryable && execucao.podeTentarNovamente();
        try {
            if (agendouRetry) {
                execucao.agendarRetry(
                        codigo,
                        resumo,
                        Instant.now().plus(segundoBackoff(execucao.getTentativas()))
                );
            } else {
                execucao.falharDefinitivo(codigo, resumo, fonteIndisponivel);
            }
        } catch (IllegalStateException exception) {
            throw transicaoInvalida(exception);
        }
        acionar(execucao, handler -> handler.aoFalhar(execucao));
        Optional<ExecucaoIntegracao> fallback = agendouRetry
                ? Optional.empty()
                : criarFallbackSeDisponivel(execucao);
        auditoriaService.registrar(
                "EXECUCAO_FALHOU",
                "EXECUCAO_INTEGRACAO",
                id,
                Map.of(
                        "codigo", String.valueOf(codigo),
                        "retryAgendado", agendouRetry,
                        "status", execucao.getStatus().name(),
                        "fallbackExecucaoId", fallback.map(item -> item.getId().toString()).orElse("")
                )
        );
        return execucao;
    }

    @Transactional
    public ExecucaoIntegracao aguardarHumano(
            UUID id,
            UUID token,
            StatusExecucao status,
            String codigo,
            String resumo
    ) {
        ExecucaoIntegracao execucao = buscarComLease(id, token);
        try {
            execucao.aguardarHumano(status, codigo, resumo);
        } catch (IllegalArgumentException | IllegalStateException exception) {
            throw transicaoInvalida(exception);
        }
        acionar(execucao, handler -> handler.aoAguardarHumano(execucao));
        auditoriaService.registrar(
                "EXECUCAO_AGUARDANDO_HUMANO",
                "EXECUCAO_INTEGRACAO",
                id,
                Map.of("status", status.name(), "codigo", String.valueOf(codigo))
        );
        return execucao;
    }

    @Transactional
    public ExecucaoIntegracao concluirIntervencao(UUID id, Object resultado) {
        ExecucaoIntegracao execucao = buscar(id);
        if (!execucao.getStatus().esperaHumana()) {
            throw new ExcecaoNegocio(
                    "EXECUCAO_NAO_AGUARDA_HUMANO",
                    "erros.execucaoNaoAguardaHumano",
                    HttpStatus.CONFLICT
            );
        }
        try {
            execucao.concluir(null, serializar(resultado), null, null);
        } catch (IllegalStateException exception) {
            throw transicaoInvalida(exception);
        }
        acionar(execucao, handler -> handler.aoConcluir(execucao, resultado));
        auditoriaService.registrar(
                "EXECUCAO_CONCLUIDA_MANUALMENTE",
                "EXECUCAO_INTEGRACAO",
                id,
                Map.of("operacao", execucao.getOperacao())
        );
        return execucao;
    }

    @Transactional
    public ExecucaoIntegracao expirarIntervencao(UUID id) {
        ExecucaoIntegracao execucao = buscar(id);
        if (!execucao.getStatus().esperaHumana()) return execucao;
        try {
            execucao.falharDefinitivo(
                    "INTERVENCAO_EXPIRADA",
                    "A intervenção humana expirou sem conclusão.",
                    false
            );
        } catch (IllegalStateException exception) {
            throw transicaoInvalida(exception);
        }
        acionar(execucao, handler -> handler.aoFalhar(execucao));
        Optional<ExecucaoIntegracao> fallback = criarFallbackSeDisponivel(execucao);
        auditoriaService.registrar(
                "EXECUCAO_INTERVENCAO_EXPIRADA",
                "EXECUCAO_INTEGRACAO",
                id,
                Map.of(
                        "operacao", execucao.getOperacao(),
                        "fallbackExecucaoId", fallback.map(item -> item.getId().toString()).orElse("")
                )
        );
        return execucao;
    }

    @Transactional
    public ExecucaoIntegracao retomar(UUID id) {
        ExecucaoIntegracao execucao = buscar(id);
        try {
            execucao.retomarDaIntervencao();
        } catch (IllegalStateException exception) {
            throw new ExcecaoNegocio(
                    "EXECUCAO_NAO_AGUARDA_HUMANO",
                    "erros.execucaoNaoAguardaHumano",
                    HttpStatus.CONFLICT,
                    exception
            );
        }
        acionar(execucao, handler -> handler.aoRetomar(execucao));
        auditoriaService.registrar(
                "EXECUCAO_RETOMADA",
                "EXECUCAO_INTEGRACAO",
                id,
                Map.of("operacao", execucao.getOperacao())
        );
        return execucao;
    }

    @Transactional
    public void cancelar(UUID id, String motivo) {
        ExecucaoIntegracao execucao = buscar(id);
        try {
            execucao.cancelar(motivo);
        } catch (IllegalStateException exception) {
            throw new ExcecaoNegocio(
                    "EXECUCAO_NAO_CANCELAVEL",
                    "erros.execucaoNaoCancelavel",
                    HttpStatus.CONFLICT,
                    exception
            );
        }
        acionar(execucao, handler -> handler.aoCancelar(execucao));
        auditoriaService.registrar(
                "EXECUCAO_CANCELADA",
                "EXECUCAO_INTEGRACAO",
                id,
                Map.of("motivo", String.valueOf(motivo))
        );
    }

    @Transactional
    public int recuperarLeasesExpirados() {
        List<UUID> ids = jdbc.query(
                """
                with expiradas as (
                    select id
                      from execucoes_integracao
                     where status = 'EXECUTANDO'
                       and lease_ate < current_timestamp
                     order by lease_ate asc
                     for update skip locked
                     limit 100
                )
                update execucoes_integracao e
                   set status = case
                           when e.tentativas < e.max_tentativas then 'RETRY_AGENDADO'
                           else 'FALHA'
                       end,
                       proxima_tentativa_em = case
                           when e.tentativas < e.max_tentativas
                               then current_timestamp + interval '1 minute'
                           else null
                       end,
                       erro_codigo = 'LEASE_EXPIRADO',
                       erro_resumo = 'O worker não renovou o lease dentro do prazo.',
                       finalizada_em = case
                           when e.tentativas >= e.max_tentativas then current_timestamp
                           else e.finalizada_em
                       end,
                       lease_token = null,
                       lease_ate = null,
                       worker_id = null,
                       atualizado_em = current_timestamp,
                       versao = e.versao + 1
                  from expiradas
                 where e.id = expiradas.id
                returning e.id
                """,
                new MapSqlParameterSource(),
                (rs, rowNum) -> rs.getObject("id", UUID.class)
        );
        if (ids.isEmpty()) return 0;

        ids.stream().map(this::buscar).forEach(execucao -> {
            acionar(execucao, handler -> handler.aoFalhar(execucao));
            Optional<ExecucaoIntegracao> fallback = execucao.getStatus().terminal()
                    ? criarFallbackSeDisponivel(execucao)
                    : Optional.empty();
            auditoriaService.registrar(
                    "EXECUCAO_LEASE_EXPIRADO",
                    "EXECUCAO_INTEGRACAO",
                    execucao.getId(),
                    Map.of(
                            "status", execucao.getStatus().name(),
                            "fallbackExecucaoId", fallback.map(item -> item.getId().toString()).orElse("")
                    )
            );
        });
        return ids.size();
    }

    @Transactional(readOnly = true)
    public ExecucaoIntegracao buscar(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException(
                "EXECUCAO_NAO_ENCONTRADA",
                "erros.execucaoNaoEncontrada"
        ));
    }

    private ExecucaoIntegracao buscarComLease(UUID id, UUID token) {
        ExecucaoIntegracao execucao = buscar(id);
        if (token == null
                || execucao.getStatus() != StatusExecucao.EXECUTANDO
                || execucao.getLeaseToken() == null
                || !execucao.getLeaseToken().equals(token)
                || execucao.getLeaseAte() == null
                || execucao.getLeaseAte().isBefore(Instant.now())) {
            throw leaseInvalido();
        }
        return execucao;
    }

    private Optional<ExecucaoIntegracao> criarFallbackSeDisponivel(ExecucaoIntegracao anterior) {
        for (ExecucaoLifecycleHandler handler : lifecycleHandlers) {
            if (!handler.suporta(anterior.getOperacao())) continue;
            Optional<ComandoCriarExecucao> comando = handler.fallbackAposFalha(anterior);
            if (comando.isEmpty()) continue;
            ResultadoCriacaoExecucao criacao = criarComResultado(comando.get());
            if (criacao.nova()) {
                handler.aoCriarFallback(anterior, criacao.execucao());
            }
            return Optional.of(criacao.execucao());
        }
        return Optional.empty();
    }

    private void acionar(ExecucaoIntegracao execucao, Consumer<ExecucaoLifecycleHandler> acao) {
        lifecycleHandlers.stream()
                .filter(handler -> handler.suporta(execucao.getOperacao()))
                .forEach(acao);
    }

    private ExcecaoNegocio leaseInvalido() {
        return new ExcecaoNegocio(
                "LEASE_INVALIDO",
                "erros.leaseInvalido",
                HttpStatus.CONFLICT
        );
    }

    private ExcecaoNegocio transicaoInvalida(RuntimeException exception) {
        return new ExcecaoNegocio(
                "TRANSICAO_EXECUCAO_INVALIDA",
                "erros.transicaoExecucaoInvalida",
                HttpStatus.CONFLICT,
                exception
        );
    }

    private Duration segundoBackoff(int tentativa) {
        long segundos = Math.min(
                3600,
                60L * (1L << Math.min(Math.max(tentativa - 1, 0), 5))
        );
        return Duration.ofSeconds(segundos);
    }

    private String serializar(Object valor) {
        if (valor == null) return null;
        try {
            return objectMapper.writeValueAsString(valor);
        } catch (JsonProcessingException exception) {
            throw new ExcecaoNegocio(
                    "PAYLOAD_INVALIDO",
                    "erros.payloadInvalido",
                    HttpStatus.BAD_REQUEST,
                    exception
            );
        }
    }


    private List<String> normalizarLista(List<String> valores, int maxItens, int maxTamanho) {
        if (valores == null || valores.isEmpty()) return List.of();
        LinkedHashSet<String> unicos = new LinkedHashSet<>();
        for (String valor : valores) {
            String limpo = limitar(valor, maxTamanho);
            if (limpo != null) unicos.add(limpo);
            if (unicos.size() >= maxItens) break;
        }
        return List.copyOf(unicos);
    }

    private String exigirTexto(String valor, String nome) {
        if (valor == null || valor.isBlank()) {
            throw new ExcecaoNegocio(
                    "CAMPO_OBRIGATORIO",
                    "erros.campoObrigatorio",
                    HttpStatus.BAD_REQUEST
            );
        }
        return valor.trim();
    }

    private String limpar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private String limitar(String valor, int tamanho) {
        String limpo = limpar(valor);
        return limpo == null || limpo.length() <= tamanho
                ? limpo
                : limpo.substring(0, tamanho);
    }

    public record ResultadoCriacaoExecucao(ExecucaoIntegracao execucao, boolean nova) { }

    public record ExecucaoLease(
            UUID id,
            UUID empresaId,
            String operacao,
            String provedorCodigo,
            String payloadJson,
            UUID leaseToken,
            Instant leaseAte,
            int tentativa,
            int maxTentativas
    ) {
    }

    private static final class LeaseRowMapper implements RowMapper<ExecucaoLease> {
        @Override
        public ExecucaoLease mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new ExecucaoLease(
                    rs.getObject("id", UUID.class),
                    rs.getObject("empresa_id", UUID.class),
                    rs.getString("operacao"),
                    rs.getString("provedor_codigo"),
                    rs.getString("payload_json"),
                    rs.getObject("lease_token", UUID.class),
                    rs.getTimestamp("lease_ate").toInstant(),
                    rs.getInt("tentativas"),
                    rs.getInt("max_tentativas")
            );
        }
    }
}
