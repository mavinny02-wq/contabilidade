package br.com.contabilidade.common.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.contabilidade.common.audit.AuditoriaService;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StorageReconciliacaoServiceTest {

    @TempDir
    Path storage;

    @Mock
    private DocumentoRepository repository;

    @Mock
    private AuditoriaService auditoriaService;

    @Test
    void distingueStorageSaudavelDivergenteEParcial() throws Exception {
        when(repository.buscarPrimeirasReferenciasStorage(any())).thenReturn(List.of());

        StorageReconciliacaoService.ResultadoReconciliacao saudavel = service(10).reconciliar();
        assertThat(saudavel.status()).isEqualTo("SAUDAVEL");

        Files.writeString(storage.resolve("orfao.bin"), "conteudo de teste");
        StorageReconciliacaoService.ResultadoReconciliacao divergente = service(10).reconciliar();
        assertThat(divergente.status()).isEqualTo("DEGRADADO");
        assertThat(divergente.motivoSeguro()).isEqualTo("DIVERGENCIA_STORAGE_DETECTADA");
        assertThat(divergente.arquivosSemRegistroDetectados()).isEqualTo(1);

        Files.writeString(storage.resolve("segundo.bin"), "conteudo de teste");
        StorageReconciliacaoService.ResultadoReconciliacao parcial = service(1).reconciliar();
        assertThat(parcial.status()).isEqualTo("DEGRADADO");
        assertThat(parcial.arquivosCompletos()).isFalse();
        assertThat(parcial.motivoSeguro()).isEqualTo("LIMITE_ARQUIVOS_ATINGIDO");
    }

    private StorageReconciliacaoService service(int maximoArquivos) {
        return new StorageReconciliacaoService(
                repository,
                auditoriaService,
                storage.toString(),
                10,
                10,
                maximoArquivos,
                5
        );
    }
}
