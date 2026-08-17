package br.com.contabilidade.common.technical;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import br.com.contabilidade.common.execution.ExecucaoIntegracaoRepository;
import br.com.contabilidade.common.intervention.SolicitacaoIntervencaoRepository;
import br.com.contabilidade.common.security.SecurityConfig;
import br.com.contabilidade.common.security.PermissaoService;
import br.com.contabilidade.common.worker.WorkerHeartbeatStatusService;
import br.com.contabilidade.common.web.CorrelationIdFilter;
import java.util.List;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

@WebMvcTest(ConsoleTecnicaController.class)
@TestPropertySource(properties = "app.security.enabled=true")
@Import({SecurityConfig.class, PermissaoService.class,
        ConsoleTecnicaAuthorizationTest.MetricsTestConfiguration.class})
class ConsoleTecnicaAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExecucaoIntegracaoRepository execucaoRepository;

    @MockitoBean
    private SolicitacaoIntervencaoRepository intervencaoRepository;

    @MockitoBean
    private WorkerHeartbeatStatusService workerHeartbeatStatusService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private JdbcTemplate jdbcTemplate;

    @TestConfiguration
    static class MetricsTestConfiguration {
        @Bean
        MeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }

    @BeforeEach
    void configurarResumo() {
        when(workerHeartbeatStatusService.resumir(any())).thenReturn(
                new WorkerHeartbeatStatusService.ResumoWorkers(
                        "INDISPONIVEL", "SEM_HEARTBEAT_REGISTRADO", List.of(), 0, false, 90, 300));
    }

    @Test
    void permiteAutoridadeDaConsoleTecnica() throws Exception {
        mockMvc.perform(get("/api/console-tecnica/resumo")
                        .with(user("tecnico").authorities(() -> "CONSOLE_TECNICA_LER")))
                .andExpect(status().isOk());
    }

    @Test
    void negaUsuarioSemAutoridadeDaConsoleTecnica() throws Exception {
        mockMvc.perform(get("/api/console-tecnica/resumo")
                        .header(CorrelationIdFilter.HEADER, "auth-denied-test")
                        .with(user("leitor").authorities(() -> "EMPRESA_LER")))
                .andExpect(status().isForbidden())
                .andExpect(header().string(CorrelationIdFilter.HEADER, "auth-denied-test"))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.codigo").value("ACESSO_NEGADO"))
                .andExpect(jsonPath("$.mensagemKey").value("erros.acessoNegado"))
                .andExpect(jsonPath("$.correlationId").value("auth-denied-test"))
                .andExpect(jsonPath("$.caminho").value("/api/console-tecnica/resumo"));
    }

    @Test
    void mantemAutenticacaoAusenteComoNaoAutorizada() throws Exception {
        mockMvc.perform(get("/api/console-tecnica/resumo"))
                .andExpect(status().isUnauthorized());
    }
}
