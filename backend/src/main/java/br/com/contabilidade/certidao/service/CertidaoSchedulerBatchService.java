package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class CertidaoSchedulerBatchService {

    private static final Set<String> CONFIGURACOES_IGNORAVEIS = Set.of(
            "SEM_PROVEDOR_DISPONIVEL",
            "POLITICA_DESABILITADA",
            "POLITICA_NAO_ENCONTRADA"
    );

    private final CertidaoService certidaoService;
    private final CertidaoAlertaService alertaService;
    private final CertidaoAcompanhamentoRepository certidaoRepository;
    private final EmpresaRepository empresaRepository;
    private final int inicializacaoBatchSize;
    private final int agendamentoBatchSize;
    private final int alertaBatchSize;
    private final AtomicReference<UUID> cursorEmpresas = new AtomicReference<>();
    private final AtomicReference<UUID> cursorAgendamento = new AtomicReference<>();
    private final AtomicReference<UUID> cursorAlertas = new AtomicReference<>();

    public CertidaoSchedulerBatchService(
            CertidaoService certidaoService,
            CertidaoAlertaService alertaService,
            CertidaoAcompanhamentoRepository certidaoRepository,
            EmpresaRepository empresaRepository,
            @Value("${app.certificate.initialization-batch-size:100}") int inicializacaoBatchSize,
            @Value("${app.certificate.scheduler-batch-size:200}") int agendamentoBatchSize,
            @Value("${app.certificate.alert-batch-size:300}") int alertaBatchSize
    ) {
        this.certidaoService = certidaoService;
        this.alertaService = alertaService;
        this.certidaoRepository = certidaoRepository;
        this.empresaRepository = empresaRepository;
        this.inicializacaoBatchSize = limitar(inicializacaoBatchSize);
        this.agendamentoBatchSize = limitar(agendamentoBatchSize);
        this.alertaBatchSize = limitar(alertaBatchSize);
    }

    public synchronized ResultadoLote agendarVencidas() {
        int empresasInicializadas = inicializarLoteEmpresas();
        Instant agora = Instant.now();
        List<UUID> ids = proximoLoteAgendamento(agora);
        int processados = 0;
        int ignorados = 0;

        for (UUID id : ids) {
            try {
                certidaoService.solicitar(
                        id,
                        "CERTIDAO:SCHEDULER:" + id + ":" + LocalDate.now()
                );
                processados++;
            } catch (ExcecaoNegocio exception) {
                if (!CONFIGURACOES_IGNORAVEIS.contains(exception.getCodigo())) throw exception;
                ignorados++;
            }
        }

        avancar(cursorAgendamento, ids);
        return new ResultadoLote(empresasInicializadas, ids.size(), processados, ignorados);
    }

    public synchronized ResultadoLote emitirAlertas() {
        int empresasInicializadas = inicializarLoteEmpresas();
        List<UUID> ids = proximoLoteAlertas();
        int emitidos = 0;
        LocalDate hoje = LocalDate.now();

        for (UUID id : ids) {
            if (alertaService.emitirSeNecessario(id, hoje)) emitidos++;
        }

        avancar(cursorAlertas, ids);
        return new ResultadoLote(empresasInicializadas, ids.size(), emitidos, 0);
    }

    private int inicializarLoteEmpresas() {
        UUID cursor = cursorEmpresas.get();
        PageRequest limite = PageRequest.of(0, inicializacaoBatchSize);
        List<UUID> ids = cursor == null
                ? empresaRepository.buscarPrimeirosIdsAtivos(limite)
                : empresaRepository.buscarIdsAtivosApos(cursor, limite);

        if (ids.isEmpty() && cursor != null) {
            ids = empresaRepository.buscarPrimeirosIdsAtivos(limite);
        }

        for (UUID empresaId : ids) {
            certidaoService.listarPorEmpresa(empresaId);
        }

        avancar(cursorEmpresas, ids);
        return ids.size();
    }

    private List<UUID> proximoLoteAgendamento(Instant agora) {
        UUID cursor = cursorAgendamento.get();
        PageRequest limite = PageRequest.of(0, agendamentoBatchSize);
        List<UUID> ids = cursor == null
                ? certidaoRepository.buscarPrimeirosIdsParaAgendamento(agora, limite)
                : certidaoRepository.buscarIdsParaAgendamentoApos(agora, cursor, limite);

        if (ids.isEmpty() && cursor != null) {
            ids = certidaoRepository.buscarPrimeirosIdsParaAgendamento(agora, limite);
        }
        return ids;
    }

    private List<UUID> proximoLoteAlertas() {
        UUID cursor = cursorAlertas.get();
        PageRequest limite = PageRequest.of(0, alertaBatchSize);
        List<UUID> ids = cursor == null
                ? certidaoRepository.buscarPrimeirosIdsAtivos(limite)
                : certidaoRepository.buscarIdsAtivosApos(cursor, limite);

        if (ids.isEmpty() && cursor != null) {
            ids = certidaoRepository.buscarPrimeirosIdsAtivos(limite);
        }
        return ids;
    }

    private void avancar(AtomicReference<UUID> cursor, List<UUID> ids) {
        if (!ids.isEmpty()) cursor.set(ids.get(ids.size() - 1));
    }

    private static int limitar(int valor) {
        return Math.min(Math.max(valor, 1), 5_000);
    }

    public record ResultadoLote(
            int empresasInicializadas,
            int candidatos,
            int processados,
            int ignorados
    ) {
    }
}
