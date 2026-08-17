package br.com.contabilidade.infraestrutura;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.contabilidade.ContabilidadeApplication;
import jakarta.persistence.EntityManagerFactory;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("local")
class BancoPostgresqlIntegracaoTest {

    private static final Logger LOGGER = LoggerFactory.getLogger(BancoPostgresqlIntegracaoTest.class);
    private static final String POSTGRES_IMAGE = "postgres:17-alpine";
    private static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse(POSTGRES_IMAGE));
    private static final DatabaseConfig DATABASE = configurarDatabase();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void configurarBanco(DynamicPropertyRegistry propriedades) {
        propriedades.add("spring.datasource.url", DATABASE::url);
        propriedades.add("spring.datasource.username", DATABASE::username);
        propriedades.add("spring.datasource.password", DATABASE::password);
        propriedades.add("app.security.enabled", () -> false);
    }

    @AfterAll
    static void encerrarContainer() {
        if (POSTGRES.isRunning()) {
            POSTGRES.stop();
        }
    }

    @Test
    void deveAplicarTodasAsMigracoesEValidarEstruturaMaisRecente() throws Exception {
        var recursos = new PathMatchingResourcePatternResolver()
                .getResources("classpath*:db/migration/V*.sql");
        Set<String> scriptsEsperados = Arrays.stream(recursos)
                .map(recurso -> recurso.getFilename())
                .collect(Collectors.toSet());

        Set<String> scriptsAplicados = Set.copyOf(jdbcTemplate.queryForList(
                "SELECT script FROM flyway_schema_history WHERE success = true AND type = 'SQL'",
                String.class));
        Integer migracoesComFalha = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE success = false",
                Integer.class);

        assertThat(scriptsEsperados).isNotEmpty().isEqualTo(scriptsAplicados);
        assertThat(migracoesComFalha).isZero();
        assertThat(tabelaExiste("worker_heartbeat_historico")).isTrue();
        assertThat(indiceExiste("idx_worker_heartbeat_historico_worker_data")).isTrue();
        assertThat(indiceExiste("idx_worker_heartbeat_historico_data")).isTrue();
        assertThat(entityManagerFactory.isOpen()).isTrue();

        Integer migracoesAntesDaReinicializacao = quantidadeMigracoesAplicadas();
        try (ConfigurableApplicationContext segundoContexto = new SpringApplicationBuilder(ContabilidadeApplication.class)
                .web(WebApplicationType.NONE)
                .initializers(contexto -> TestPropertyValues.of(Map.of(
                        "spring.datasource.url", DATABASE.url(),
                        "spring.datasource.username", DATABASE.username(),
                        "spring.datasource.password", DATABASE.password(),
                        "app.security.enabled", "false"))
                        .applyTo(contexto))
                .run()) {
            assertThat(segundoContexto.getBean(EntityManagerFactory.class).isOpen()).isTrue();
        }
        assertThat(quantidadeMigracoesAplicadas()).isEqualTo(migracoesAntesDaReinicializacao);

        String versaoPostgresql = jdbcTemplate.queryForObject("SHOW server_version", String.class);
        LOGGER.info("PostgreSQL de integração validado: imagem={}, versão={}", DATABASE.image(), versaoPostgresql);
        if (!DATABASE.external()) {
            assertThat(versaoPostgresql).startsWith("17.");
        }
    }

    @Test
    void deveExporSomenteRotasAtuaisDaConsoleTecnicaComPostgresqlControlado() throws Exception {
        mockMvc.perform(get("/api/console-tecnica/resumo")
                        .header("X-Correlation-Id", "val-tech-console-001"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-Id", "val-tech-console-001"))
                .andExpect(jsonPath("$.banco.status").value("SAUDAVEL"))
                .andExpect(jsonPath("$.worker.status").value("INDISPONIVEL"))
                .andExpect(jsonPath("$.worker.detalheSeguro").value("SEM_HEARTBEAT_REGISTRADO"));

        mockMvc.perform(get("/api/console-tecnica/configuracao"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workerTokenConfigurado").isBoolean())
                .andExpect(jsonPath("$.segredoSessaoConfigurado").isBoolean())
                .andExpect(jsonPath("$.workerToken").doesNotExist())
                .andExpect(jsonPath("$.segredoSessao").doesNotExist());

        mockMvc.perform(get("/api/console-tecnica/workers/historico")
                        .queryParam("inicio", "2025-01-01")
                        .queryParam("fim", "2026-08-17"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("PERIODO_HEARTBEAT_EXCEDIDO"));
    }

    private Integer quantidadeMigracoesAplicadas() {
        return jdbcTemplate.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE success = true AND type = 'SQL'",
                Integer.class);
    }

    private boolean tabelaExiste(String tabela) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT to_regclass('public.' || ?) IS NOT NULL", Boolean.class, tabela));
    }

    private boolean indiceExiste(String indice) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT to_regclass('public.' || ?) IS NOT NULL", Boolean.class, indice));
    }

    private static DatabaseConfig configurarDatabase() {
        boolean externalAuthorized = Boolean.parseBoolean(
                System.getenv().getOrDefault("CONTABILIDADE_TEST_EXTERNAL_DATABASE", "false"));
        if (externalAuthorized) {
            String externalUrl = variavelObrigatoria("SPRING_DATASOURCE_URL");
            String username = variavelObrigatoria("SPRING_DATASOURCE_USERNAME");
            String password = variavelObrigatoria("SPRING_DATASOURCE_PASSWORD");
            return new DatabaseConfig(externalUrl, username, password, "external-authorized", true);
        }

        POSTGRES.start();
        return new DatabaseConfig(
                POSTGRES.getJdbcUrl(),
                POSTGRES.getUsername(),
                POSTGRES.getPassword(),
                POSTGRES_IMAGE,
                false);
    }

    private static String variavelObrigatoria(String nome) {
        String valor = System.getenv(nome);
        if (valor == null || valor.isBlank()) {
            throw new IllegalStateException(nome + " deve ser definida para a campanha com banco externo");
        }
        return valor;
    }

    private record DatabaseConfig(String url, String username, String password, String image, boolean external) {}
}
