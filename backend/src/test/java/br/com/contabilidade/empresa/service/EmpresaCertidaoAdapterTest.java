package br.com.contabilidade.empresa.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.contabilidade.empresa.domain.Empresa;
import br.com.contabilidade.empresa.domain.Estabelecimento;
import br.com.contabilidade.empresa.domain.RegimeTributario;
import br.com.contabilidade.empresa.domain.StatusEmpresa;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import br.com.contabilidade.empresa.repository.EstabelecimentoRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class EmpresaCertidaoAdapterTest {

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private EstabelecimentoRepository estabelecimentoRepository;

    @Test
    void projetaEmpresaEEstabelecimentosSemExporEntidades() {
        Empresa empresa = new Empresa("Empresa Alfa", null, null, null);
        Estabelecimento estabelecimento = new Estabelecimento(
                "11.222.333/0001-81", true, StatusEmpresa.ATIVA, null,
                RegimeTributario.SIMPLES_NACIONAL);
        estabelecimento.atualizar(StatusEmpresa.ATIVA, null, RegimeTributario.SIMPLES_NACIONAL,
                null, null, null, null, "Curitiba", "pr", null);
        empresa.adicionarEstabelecimento(estabelecimento);
        when(empresaRepository.buscarDetalhada(empresa.getId())).thenReturn(java.util.Optional.of(empresa));

        var resultado = new EmpresaCertidaoAdapter(empresaRepository, estabelecimentoRepository)
                .buscarEmpresa(empresa.getId()).orElseThrow();

        assertThat(resultado.id()).isEqualTo(empresa.getId());
        assertThat(resultado.estabelecimentos()).containsExactly(
                new br.com.contabilidade.certidao.service.EmpresaCertidaoConsulta.EstabelecimentoCertidaoProjecao(
                        estabelecimento.getId(), "11222333000181", "PR", true, true));
    }

    @Test
    void preservaPaginacaoPorCursorDoRepositorio() {
        UUID cursor = UUID.randomUUID();
        List<UUID> ids = List.of(UUID.randomUUID());
        when(empresaRepository.buscarIdsAtivosApos(cursor, PageRequest.of(0, 25))).thenReturn(ids);

        var resultado = new EmpresaCertidaoAdapter(empresaRepository, estabelecimentoRepository)
                .buscarIdsAtivosApos(cursor, 25);

        assertThat(resultado).isSameAs(ids);
        verify(empresaRepository).buscarIdsAtivosApos(cursor, PageRequest.of(0, 25));
    }
}
