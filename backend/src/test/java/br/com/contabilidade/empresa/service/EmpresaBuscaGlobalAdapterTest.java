package br.com.contabilidade.empresa.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.contabilidade.empresa.api.EmpresaResumoResponse;
import br.com.contabilidade.empresa.domain.RegimeTributario;
import br.com.contabilidade.empresa.domain.StatusEmpresa;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

@ExtendWith(MockitoExtension.class)
class EmpresaBuscaGlobalAdapterTest {

    @Mock
    private EmpresaService empresaService;

    @Test
    void projetaSomenteCamposDaBuscaPreservandoOrdem() {
        UUID id = UUID.randomUUID();
        EmpresaResumoResponse empresa = new EmpresaResumoResponse(
                id, "Alfa", "Fantasia", null, List.of(), "11111111000111",
                StatusEmpresa.ATIVA, RegimeTributario.SIMPLES_NACIONAL, "Curitiba", "PR", true, 1, Instant.EPOCH);
        when(empresaService.listar("alfa", 0, 10)).thenReturn(new PageImpl<>(List.of(empresa)));

        var resultado = new EmpresaBuscaGlobalAdapter(empresaService).buscar("alfa", 10);

        assertThat(resultado).containsExactly(
                new br.com.contabilidade.common.search.EmpresaBuscaGlobalConsulta.EmpresaBuscaGlobalProjecao(
                        id, "Alfa", "11111111000111"));
        verify(empresaService).listar("alfa", 0, 10);
    }
}
