package br.com.contabilidade.common.technical;

import br.com.contabilidade.common.execution.ExecucaoIntegracaoRepository;
import br.com.contabilidade.common.execution.StatusExecucao;
import br.com.contabilidade.common.intervention.SolicitacaoIntervencaoRepository;
import br.com.contabilidade.common.intervention.StatusIntervencao;
import br.com.contabilidade.common.worker.WorkerHeartbeatStatusService;
import java.nio.file.FileStore;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/console-tecnica")
public class ConsoleTecnicaController {

    private final JdbcTemplate jdbcTemplate;
    private final ExecucaoIntegracaoRepository execucaoRepository;
    private final SolicitacaoIntervencaoRepository intervencaoRepository;
    private final WorkerHeartbeatStatusService workerHeartbeatStatusService;
    private final Path storagePath;

    public ConsoleTecnicaController(
            JdbcTemplate jdbcTemplate,
            ExecucaoIntegracaoRepository execucaoRepository,
            SolicitacaoIntervencaoRepository intervencaoRepository,
            WorkerHeartbeatStatusService workerHeartbeatStatusService,
            @Value("${app.storage.local-path:./dados/documentos}") String storagePath
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.execucaoRepository = execucaoRepository;
        this.intervencaoRepository = intervencaoRepository;
        this.workerHeartbeatStatusService = workerHeartbeatStatusService;
        this.storagePath = Path.of(storagePath).toAbsolutePath().normalize();
    }

    @GetMapping("/resumo")
    @PreAuthorize("@permissaoService.tem('CONSOLE_TECNICA_LER')")
    public ResumoTecnico resumo() {
        Instant agora = Instant.now();
        WorkerHeartbeatStatusService.ResumoWorkers workers = workerHeartbeatStatusService.resumir(agora);
        return new ResumoTecnico(
                agora,
                verificarBanco(),
                verificarStorage(),
                new ComponenteTecnico(
                        "automation-worker",
                        workers.status(),
                        workers.motivoSeguro()
                ),
                workers.workers(),
                workers.totalRegistrados(),
                workers.listaLimitada(),
                workers.degradadoAposSegundos(),
                workers.indisponivelAposSegundos(),
                execucaoRepository.countByStatusIn(List.of(
                        StatusExecucao.NA_FILA,
                        StatusExecucao.EXECUTANDO,
                        StatusExecucao.RETRY_AGENDADO
                )),
                execucaoRepository.countByStatusIn(List.of(
                        StatusExecucao.FALHA,
                        StatusExecucao.FONTE_INDISPONIVEL
                )),
                intervencaoRepository.countByStatusIn(List.of(
                        StatusIntervencao.PENDENTE,
                        StatusIntervencao.EM_ATENDIMENTO
                ))
        );
    }

    private ComponenteTecnico verificarBanco() {
        try {
            Integer resultado = jdbcTemplate.queryForObject("select 1", Integer.class);
            return new ComponenteTecnico(
                    "postgresql",
                    resultado != null && resultado == 1 ? "SAUDAVEL" : "DEGRADADO",
                    null
            );
        } catch (Exception exception) {
            return new ComponenteTecnico("postgresql", "INDISPONIVEL", exception.getClass().getSimpleName());
        }
    }

    private ComponenteTecnico verificarStorage() {
        try {
            Files.createDirectories(storagePath);
            FileStore store = Files.getFileStore(storagePath);
            long disponivel = store.getUsableSpace();
            return new ComponenteTecnico("documentos", "SAUDAVEL", Long.toString(disponivel));
        } catch (Exception exception) {
            return new ComponenteTecnico("documentos", "INDISPONIVEL", exception.getClass().getSimpleName());
        }
    }

    public record ResumoTecnico(
            Instant observadoEm,
            ComponenteTecnico banco,
            ComponenteTecnico storage,
            ComponenteTecnico worker,
            List<WorkerHeartbeatStatusService.WorkerResumo> workers,
            long workersRegistrados,
            boolean workersListaLimitada,
            long workerDegradadoAposSegundos,
            long workerIndisponivelAposSegundos,
            long execucoesAbertas,
            long execucoesComFalha,
            long intervencoesPendentes
    ) {
    }

    public record ComponenteTecnico(String componente, String status, String detalheSeguro) {
    }
}
