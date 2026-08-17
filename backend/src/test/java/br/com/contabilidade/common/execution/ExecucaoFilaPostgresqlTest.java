package br.com.contabilidade.common.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "app.security.enabled=false",
                "spring.task.scheduling.enabled=false"
        })
@ActiveProfiles("local")
@Timeout(30)
class ExecucaoFilaPostgresqlTest {

    private static final String OPERACAO = "TESTE_FILA_CRITICA";
    private static final String PROVEDOR = "PROVEDOR_SINTETICO";
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(
            DockerImageName.parse("postgres:17-alpine"));

    static {
        POSTGRES.start();
    }

    @Autowired
    private ExecucaoFilaService service;

    @Autowired
    private ExecucaoIntegracaoRepository repository;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @DynamicPropertySource
    static void configurarPostgresql(DynamicPropertyRegistry propriedades) {
        propriedades.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        propriedades.add("spring.datasource.username", POSTGRES::getUsername);
        propriedades.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @AfterAll
    static void encerrarPostgresql() {
        POSTGRES.stop();
    }

    @Test
    void criacaoEhIdempotenteEMesmaChaveNaoAceitaComandoDivergente() {
        String chave = chave("criacao");
        ComandoCriarExecucao comando = comando(OPERACAO, PROVEDOR, 100, 3, chave, Map.of("pagina", 1));

        ExecucaoFilaService.ResultadoCriacaoExecucao primeira = service.criarComResultado(comando);
        ExecucaoFilaService.ResultadoCriacaoExecucao repetida = service.criarComResultado(comando);

        assertThat(primeira.nova()).isTrue();
        assertThat(repetida.nova()).isFalse();
        assertThat(repetida.execucao().getId()).isEqualTo(primeira.execucao().getId());
        assertThatThrownBy(() -> service.criarComResultado(
                comando(OPERACAO + "_OUTRA", PROVEDOR, 100, 3, chave, Map.of("pagina", 1))))
                .isInstanceOfSatisfying(ExcecaoNegocio.class,
                        erro -> assertThat(erro.getCodigo()).isEqualTo("IDEMPOTENCY_KEY_CONFLITANTE"));
    }

    @Test
    void workersConcorrentesNuncaRecebemAMesmaExecucao() throws Exception {
        service.criar(comando(OPERACAO, PROVEDOR, 100, 3, chave("concorrente-a"), Map.of()));
        service.criar(comando(OPERACAO, PROVEDOR, 100, 3, chave("concorrente-b"), Map.of()));
        CountDownLatch largada = new CountDownLatch(1);

        try (ExecutorService workers = Executors.newFixedThreadPool(2)) {
            Future<ExecucaoFilaService.ExecucaoLease> primeiro = workers.submit(
                    () -> adquirirApos(largada, "worker-a"));
            Future<ExecucaoFilaService.ExecucaoLease> segundo = workers.submit(
                    () -> adquirirApos(largada, "worker-b"));
            largada.countDown();

            assertThat(primeiro.get(10, TimeUnit.SECONDS).id())
                    .isNotEqualTo(segundo.get(10, TimeUnit.SECONDS).id());
        }
    }

    @Test
    void prioridadeEOrdemSaoRespeitadasESkipLockedMantemProgresso() throws Exception {
        ExecucaoIntegracao antiga = service.criar(
                comando(OPERACAO, PROVEDOR, 10, 3, chave("ordem-antiga"), Map.of()));
        Thread.sleep(10);
        ExecucaoIntegracao prioritaria = service.criar(
                comando(OPERACAO, PROVEDOR, 900, 3, chave("ordem-prioritaria"), Map.of()));
        ExecucaoIntegracao posterior = service.criar(
                comando(OPERACAO, PROVEDOR, 10, 3, chave("ordem-posterior"), Map.of()));

        assertThat(adquirir("worker-prioridade").id()).isEqualTo(prioritaria.getId());

        CountDownLatch bloqueioAdquirido = new CountDownLatch(1);
        CountDownLatch liberarBloqueio = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            Future<?> bloqueador = executor.submit(() -> new TransactionTemplate(transactionManager).executeWithoutResult(
                    status -> {
                        jdbc.queryForObject(
                                "select id from execucoes_integracao where id = ? for update",
                                UUID.class,
                                antiga.getId());
                        bloqueioAdquirido.countDown();
                        aguardar(liberarBloqueio);
                    }));
            assertThat(bloqueioAdquirido.await(5, TimeUnit.SECONDS)).isTrue();
            assertThat(adquirir("worker-skip-locked").id()).isEqualTo(posterior.getId());
            liberarBloqueio.countDown();
            bloqueador.get(5, TimeUnit.SECONDS);
        }
    }

    @Test
    void tokenAusenteDivergenteOuExpiradoBloqueiaRenovacaoEConclusao() {
        ExecucaoIntegracao execucao = service.criar(
                comando(OPERACAO, PROVEDOR, 100, 3, chave("lease-invalido"), Map.of()));
        ExecucaoFilaService.ExecucaoLease lease = adquirir("worker-lease");
        assertThat(lease.id()).isEqualTo(execucao.getId());

        assertLeaseInvalido(() -> service.renovarLease(execucao.getId(), null, Duration.ofMinutes(1)));
        assertLeaseInvalido(() -> service.concluir(
                execucao.getId(), UUID.randomUUID(), null, Map.of(), null, null));

        jdbc.update("update execucoes_integracao set lease_ate = current_timestamp - interval '1 second' where id = ?",
                execucao.getId());
        assertLeaseInvalido(() -> service.renovarLease(execucao.getId(), lease.leaseToken(), Duration.ofMinutes(1)));
        assertLeaseInvalido(() -> service.concluir(
                execucao.getId(), lease.leaseToken(), null, Map.of(), null, null));
    }

    @Test
    void recuperacaoDeLeaseAgendaRetryEAtingindoLimiteTerminaEmFalhaELimpaOwnership() {
        ExecucaoIntegracao retry = service.criar(
                comando(OPERACAO, PROVEDOR, 100, 2, chave("recovery-retry"), Map.of()));
        ExecucaoFilaService.ExecucaoLease leaseRetry = adquirir("worker-retry");
        expirar(leaseRetry.id());

        assertThat(service.recuperarLeasesExpirados()).isEqualTo(1);
        ExecucaoIntegracao recuperada = recarregar(retry.getId());
        assertThat(recuperada.getStatus()).isEqualTo(StatusExecucao.RETRY_AGENDADO);
        assertThat(recuperada.getProximaTentativaEm()).isAfter(Instant.now());
        assertOwnershipLimpo(recuperada);

        jdbc.update("update execucoes_integracao set proxima_tentativa_em = current_timestamp where id = ?", retry.getId());
        ExecucaoFilaService.ExecucaoLease leaseFinal = adquirir("worker-final");
        expirar(leaseFinal.id());
        assertThat(service.recuperarLeasesExpirados()).isEqualTo(1);

        ExecucaoIntegracao falha = recarregar(retry.getId());
        assertThat(falha.getStatus()).isEqualTo(StatusExecucao.FALHA);
        assertThat(falha.getErroCodigo()).isEqualTo("LEASE_EXPIRADO");
        assertThat(falha.getFinalizadaEm()).isNotNull();
        assertOwnershipLimpo(falha);
    }

    @Test
    void retryRespeitaMaximoBackoffEMantemCustoEmUmaUnicaMoeda() {
        ExecucaoIntegracao execucao = service.criar(
                comando(OPERACAO, PROVEDOR, 100, 2, chave("retry-custo"), Map.of()));
        ExecucaoFilaService.ExecucaoLease primeiro = adquirir("worker-custo-1");

        service.falhar(execucao.getId(), primeiro.leaseToken(), "TEMP", "temporario", true, false,
                new BigDecimal("1.2500"), "brl");
        ExecucaoIntegracao retry = recarregar(execucao.getId());
        assertThat(retry.getStatus()).isEqualTo(StatusExecucao.RETRY_AGENDADO);
        assertThat(Duration.between(Instant.now(), retry.getProximaTentativaEm()).toSeconds())
                .isBetween(55L, 60L);
        assertThat(retry.getCustoEstimado()).isEqualByComparingTo("1.2500");
        assertThat(retry.getMoeda()).isEqualTo("BRL");

        jdbc.update("update execucoes_integracao set proxima_tentativa_em = current_timestamp where id = ?", execucao.getId());
        ExecucaoFilaService.ExecucaoLease segundo = adquirir("worker-custo-2");
        service.falhar(execucao.getId(), segundo.leaseToken(), "FINAL", "limite", true, false,
                new BigDecimal("0.7500"), "BRL");

        ExecucaoIntegracao terminal = recarregar(execucao.getId());
        assertThat(terminal.getStatus()).isEqualTo(StatusExecucao.FALHA);
        assertThat(terminal.getTentativas()).isEqualTo(2);
        assertThat(terminal.getCustoEstimado()).isEqualByComparingTo("2.0000");
    }

    @Test
    void fallbackTerminalRepetidoNaoCriaSucessoresDuplicados() {
        ExecucaoIntegracao origem = service.criar(
                comando("FALLBACK_ORIGEM", PROVEDOR, 100, 1, chave("fallback-origem"), Map.of()));
        ExecucaoFilaService.ExecucaoLease lease = service.adquirir(
                "worker-fallback", List.of("FALLBACK_ORIGEM"), List.of(PROVEDOR), Duration.ofMinutes(1))
                .orElseThrow();
        expirar(lease.id());

        assertThat(service.recuperarLeasesExpirados()).isEqualTo(1);
        assertThat(service.recuperarLeasesExpirados()).isZero();
        assertThat(repository.findByIdempotencyKey("fallback-" + origem.getId())).isPresent();
        assertThat(jdbc.queryForObject(
                "select count(*) from execucoes_integracao where execucao_anterior_id = ?",
                Integer.class,
                origem.getId())).isEqualTo(1);
    }

    private ExecucaoFilaService.ExecucaoLease adquirirApos(CountDownLatch largada, String worker) {
        aguardar(largada);
        return adquirir(worker);
    }

    private ExecucaoFilaService.ExecucaoLease adquirir(String worker) {
        return service.adquirir(worker, List.of(OPERACAO), List.of(PROVEDOR), Duration.ofMinutes(1))
                .orElseThrow();
    }

    private void expirar(UUID id) {
        jdbc.update("update execucoes_integracao set lease_ate = current_timestamp - interval '1 second' where id = ?", id);
    }

    private ExecucaoIntegracao recarregar(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    private void assertOwnershipLimpo(ExecucaoIntegracao execucao) {
        assertThat(execucao.getLeaseToken()).isNull();
        assertThat(execucao.getLeaseAte()).isNull();
        assertThat(execucao.getWorkerId()).isNull();
    }

    private void assertLeaseInvalido(Runnable acao) {
        assertThatThrownBy(acao::run)
                .isInstanceOfSatisfying(ExcecaoNegocio.class,
                        erro -> assertThat(erro.getCodigo()).isEqualTo("LEASE_INVALIDO"));
    }

    private static void aguardar(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new AssertionError("Barreira concorrente excedeu o timeout");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AssertionError("Espera concorrente interrompida", exception);
        }
    }

    private static ComandoCriarExecucao comando(
            String operacao,
            String provedor,
            int prioridade,
            int maxTentativas,
            String chave,
            Object payload
    ) {
        return new ComandoCriarExecucao(
                null, operacao, provedor, prioridade, maxTentativas, payload, chave, null);
    }

    private static String chave(String cenario) {
        return "str-qa-be-001-" + cenario + "-" + UUID.randomUUID();
    }

    @TestConfiguration
    static class FallbackTestConfiguration {

        @Bean
        @Primary
        ExecucaoLifecycleHandler fallbackSintetico() {
            return new ExecucaoLifecycleHandler() {
                @Override
                public boolean suporta(String operacao) {
                    return "FALLBACK_ORIGEM".equals(operacao);
                }

                @Override
                public Optional<ComandoCriarExecucao> fallbackAposFalha(ExecucaoIntegracao execucao) {
                    return Optional.of(new ComandoCriarExecucao(
                            null,
                            "FALLBACK_DESTINO",
                            PROVEDOR,
                            100,
                            1,
                            Map.of("origem", execucao.getId()),
                            "fallback-" + execucao.getId(),
                            execucao.getId()));
                }
            };
        }
    }
}
