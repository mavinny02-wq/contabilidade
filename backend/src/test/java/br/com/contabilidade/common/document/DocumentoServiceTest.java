package br.com.contabilidade.common.document;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class DocumentoServiceTest {

    @Mock private DocumentoRepository repository;
    @Mock private EmpresaDocumentoConsulta empresaConsulta;
    @Mock private ArmazenamentoDocumento armazenamento;
    @Mock private AuditoriaService auditoriaService;

    private DocumentoService service;

    @BeforeEach
    void configurar() {
        service = new DocumentoService(repository, empresaConsulta, armazenamento, auditoriaService, 1024);
    }

    @Test
    void listaDocumentosQuandoEmpresaExiste() {
        UUID empresaId = UUID.randomUUID();
        when(empresaConsulta.existePorId(empresaId)).thenReturn(true);
        when(repository.findByEmpresaIdAndAtivoTrueOrderByCriadoEmDesc(
                empresaId, PageRequest.of(0, 20))).thenReturn(Page.empty());

        service.listar(empresaId, 0, 20);

        verify(repository).findByEmpresaIdAndAtivoTrueOrderByCriadoEmDesc(
                empresaId, PageRequest.of(0, 20));
    }

    @Test
    void rejeitaListagemQuandoEmpresaNaoExiste() {
        UUID empresaId = UUID.randomUUID();
        when(empresaConsulta.existePorId(empresaId)).thenReturn(false);

        assertThatThrownBy(() -> service.listar(empresaId, 0, 20))
                .isInstanceOf(RecursoNaoEncontradoException.class)
                .extracting("codigo")
                .isEqualTo("EMPRESA_NAO_ENCONTRADA");
        verify(repository, never()).findByEmpresaIdAndAtivoTrueOrderByCriadoEmDesc(
                empresaId, PageRequest.of(0, 20));
    }
}
