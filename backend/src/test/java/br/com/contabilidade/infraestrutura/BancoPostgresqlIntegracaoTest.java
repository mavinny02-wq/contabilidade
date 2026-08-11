package br.com.contabilidade.infraestrutura;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.EntityManagerFactory;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("local")
class BancoPostgresqlIntegracaoTest {

    private static final String URL_PADRAO =
            "jdbc:postgresql://127.0.0.1:5432/contabilidade_codex_backend";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @DynamicPropertySource
    static void configurarBanco(DynamicPropertyRegistry propriedades) {
        propriedades.add("spring.datasource.url", () -> ambiente("SPRING_DATASOURCE_URL", URL_PADRAO));
        propriedades.add("spring.datasource.username", () -> ambiente("SPRING_DATASOURCE_USERNAME", "contabilidade"));
        propriedades.add("spring.datasource.password", () -> ambiente("SPRING_DATASOURCE_PASSWORD", "contabilidade"));
        propriedades.add("app.security.enabled", () -> false);
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
    }

    private boolean tabelaExiste(String tabela) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT to_regclass('public.' || ?) IS NOT NULL", Boolean.class, tabela));
    }

    private boolean indiceExiste(String indice) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT to_regclass('public.' || ?) IS NOT NULL", Boolean.class, indice));
    }

    private static String ambiente(String nome, String padrao) {
        return System.getenv().getOrDefault(nome, padrao);
    }
}
