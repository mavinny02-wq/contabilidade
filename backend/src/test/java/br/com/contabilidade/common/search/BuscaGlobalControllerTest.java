package br.com.contabilidade.common.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.contabilidade.common.search.EmpresaBuscaGlobalConsulta.EmpresaBuscaGlobalProjecao;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BuscaGlobalControllerTest {

    @Mock
    private EmpresaBuscaGlobalConsulta empresaConsulta;

    @Test
    void preservaOrdemPayloadLimiteETermoDaBuscaDeEmpresas() {
        UUID primeiraId = UUID.randomUUID();
        UUID segundaId = UUID.randomUUID();
        when(empresaConsulta.buscar("contabilidade", 10)).thenReturn(List.of(
                new EmpresaBuscaGlobalProjecao(primeiraId, "Alfa", "11111111000111"),
                new EmpresaBuscaGlobalProjecao(segundaId, "Beta", "22222222000122")
        ));

        BuscaGlobalController.BuscaGlobalResponse resposta =
                new BuscaGlobalController(empresaConsulta).buscar("contabilidade");

        assertThat(resposta.resultados()).containsExactly(
                new BuscaGlobalController.ResultadoBusca(
                        "EMPRESA", primeiraId.toString(), "Alfa", "11111111000111", "/empresas/" + primeiraId),
                new BuscaGlobalController.ResultadoBusca(
                        "EMPRESA", segundaId.toString(), "Beta", "22222222000122", "/empresas/" + segundaId)
        );
        verify(empresaConsulta).buscar("contabilidade", 10);
    }

    @Test
    void naoConsultaEmpresasQuandoTermoTemMenosDeDoisCaracteres() {
        BuscaGlobalController.BuscaGlobalResponse resposta =
                new BuscaGlobalController(empresaConsulta).buscar(" a ");

        assertThat(resposta.resultados()).isEmpty();
        verify(empresaConsulta, never()).buscar(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyInt());
    }
}
