package br.com.contabilidade.dashboard;

import br.com.contabilidade.certidao.service.CertidaoService;
import br.com.contabilidade.common.document.DocumentoService;
import br.com.contabilidade.common.execution.ExecucaoIntegracaoRepository;
import br.com.contabilidade.common.execution.StatusExecucao;
import br.com.contabilidade.common.intervention.SolicitacaoIntervencaoRepository;
import br.com.contabilidade.common.intervention.StatusIntervencao;
import br.com.contabilidade.common.notification.NotificacaoService;
import br.com.contabilidade.empresa.service.EmpresaService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final EmpresaService empresaService;
    private final DocumentoService documentoService;
    private final ExecucaoIntegracaoRepository execucaoRepository;
    private final SolicitacaoIntervencaoRepository intervencaoRepository;
    private final NotificacaoService notificacaoService;
    private final CertidaoService certidaoService;

    public DashboardController(
            EmpresaService empresaService,
            DocumentoService documentoService,
            ExecucaoIntegracaoRepository execucaoRepository,
            SolicitacaoIntervencaoRepository intervencaoRepository,
            NotificacaoService notificacaoService,
            CertidaoService certidaoService
    ) {
        this.empresaService = empresaService;
        this.documentoService = documentoService;
        this.execucaoRepository = execucaoRepository;
        this.intervencaoRepository = intervencaoRepository;
        this.notificacaoService = notificacaoService;
        this.certidaoService = certidaoService;
    }

    @GetMapping("/resumo")
    public DashboardResumo resumo() {
        CertidaoService.ResumoCertidoes certidoes = certidaoService.contarResumo();
        return new DashboardResumo(
                empresaService.contarAtivas(),
                documentoService.contarAtivos(),
                execucaoRepository.countByStatusIn(List.of(
                        StatusExecucao.NA_FILA,
                        StatusExecucao.EXECUTANDO,
                        StatusExecucao.RETRY_AGENDADO
                )),
                intervencaoRepository.countByStatusIn(List.of(
                        StatusIntervencao.PENDENTE,
                        StatusIntervencao.EM_ATENDIMENTO
                )),
                notificacaoService.contarNaoLidas(),
                certidoes.regulares(),
                certidoes.atencao(),
                certidoes.acaoManual()
        );
    }

    public record DashboardResumo(
            long empresasAtivas,
            long documentosAtivos,
            long execucoesAbertas,
            long intervencoesPendentes,
            long notificacoesNaoLidas,
            long certidoesRegulares,
            long certidoesAtencao,
            long certidoesAcaoManual
    ) {
    }
}
