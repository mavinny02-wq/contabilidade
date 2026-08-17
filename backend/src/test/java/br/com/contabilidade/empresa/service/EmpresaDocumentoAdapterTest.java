package br.com.contabilidade.empresa.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.contabilidade.empresa.repository.EmpresaRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EmpresaDocumentoAdapterTest {

    @Mock
    private EmpresaRepository empresaRepository;

    @Test
    void delegaConsultaDeExistenciaAoRepositorio() {
        UUID empresaId = UUID.randomUUID();
        when(empresaRepository.existsById(empresaId)).thenReturn(true);

        boolean existe = new EmpresaDocumentoAdapter(empresaRepository).existePorId(empresaId);

        assertThat(existe).isTrue();
        verify(empresaRepository).existsById(empresaId);
    }
}
