package br.com.contabilidade.certidao.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import br.com.contabilidade.certidao.repository.HistoricoCertidaoRepository;
import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.document.DocumentoService;
import br.com.contabilidade.common.execution.ExecucaoFilaService;
import br.com.contabilidade.common.integration.PoliticaAquisicaoService;
import br.com.contabilidade.common.intervention.IntervencaoService;
import br.com.contabilidade.common.notification.NotificacaoService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CertidaoServiceTest {

    @Mock private CertidaoAcompanhamentoRepository repository;
    @Mock private HistoricoCertidaoRepository historicoRepository;
    @Mock private EmpresaCertidaoConsulta empresaConsulta;
    @Mock private PoliticaAquisicaoService politicaService;
    @Mock private ExecucaoFilaService filaService;
    @Mock private IntervencaoService intervencaoService;
    @Mock private DocumentoService documentoService;
    @Mock private NotificacaoService notificacaoService;
    @Mock private AuditoriaService auditoriaService;

    @Test
    void inicializaCertidoesAplicaveisUsandoSomenteProjecaoDaPorta() {
        UUID empresaId = UUID.randomUUID();
        UUID estabelecimentoId = UUID.randomUUID();
        var estabelecimento = new EmpresaCertidaoConsulta.EstabelecimentoCertidaoProjecao(
                estabelecimentoId, "11111111000111", "PR", true, true);
        when(empresaConsulta.buscarEmpresa(empresaId)).thenReturn(Optional.of(
                new EmpresaCertidaoConsulta.EmpresaCertidaoProjecao(empresaId, List.of(estabelecimento))));
        when(repository.findByEstabelecimentoIdAndTipo(any(), any())).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(repository.findByEmpresaIdAndAtivaTrueOrderByEstabelecimentoIdAscTipoAsc(empresaId))
                .thenReturn(List.of());

        var resultado = service().listarPorEmpresa(empresaId);

        assertThat(resultado).isEmpty();
        verify(empresaConsulta).buscarEmpresa(empresaId);
        verify(repository).findByEstabelecimentoIdAndTipo(
                estabelecimentoId, TipoCertidao.FEDERAL_RFB_PGFN);
    }

    private CertidaoService service() {
        return new CertidaoService(repository, historicoRepository, empresaConsulta, politicaService,
                filaService, intervencaoService, documentoService, notificacaoService, auditoriaService);
    }
}
