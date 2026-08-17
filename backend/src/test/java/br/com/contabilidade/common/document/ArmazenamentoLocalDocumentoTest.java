package br.com.contabilidade.common.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ArmazenamentoLocalDocumentoTest {

    @TempDir
    Path diretorioTemporario;

    @Test
    void rejeitaTravessiaCaminhoAbsolutoEncodingEReferenciaNaoNormalizada() {
        ArmazenamentoLocalDocumento storage = storage(1024);

        for (String referencia : List.of("../fora", "/tmp/fora", "pasta/../fora", "%2e%2e/fora")) {
            assertThatThrownBy(() -> storage.salvar(referencia, bytes("x")))
                    .isInstanceOf(ExcecaoNegocio.class)
                    .hasMessageNotContaining(diretorioTemporario.toString());
        }

        assertThat(Files.exists(diretorioTemporario.resolve("fora"))).isFalse();
    }

    @Test
    void naoSegueLinkSimbolicoEmEscritaLeituraOuExclusao() throws IOException {
        Path externo = Files.createDirectory(diretorioTemporario.resolveSibling("externo-" + System.nanoTime()));
        try {
            Files.createSymbolicLink(diretorioTemporario.resolve("link"), externo);
            ArmazenamentoLocalDocumento storage = storage(1024);

            assertThatThrownBy(() -> storage.salvar("link/arquivo.bin", bytes("segredo")))
                    .isInstanceOf(ExcecaoNegocio.class);
            assertThatThrownBy(() -> storage.carregar("link/arquivo.bin"))
                    .isInstanceOf(ExcecaoNegocio.class);
            assertThatThrownBy(() -> storage.remover("link/arquivo.bin"))
                    .isInstanceOf(ExcecaoNegocio.class);
            assertThat(Files.exists(externo.resolve("arquivo.bin"))).isFalse();
        } finally {
            Files.deleteIfExists(externo);
        }
    }

    @Test
    void promoveConteudoCompletoERetornaReferenciaRelativaNormalizada() throws IOException {
        ArmazenamentoLocalDocumento storage = storage(1024);

        String referencia = storage.salvar("empresa/arquivo.bin", bytes("conteudo"));

        assertThat(referencia).isEqualTo("empresa/arquivo.bin");
        assertThat(storage.carregar(referencia).getInputStream().readAllBytes())
                .isEqualTo("conteudo".getBytes(StandardCharsets.UTF_8));
        assertThat(storage.carregar(referencia).getDescription())
                .doesNotContain(diretorioTemporario.toString());
    }

    @Test
    void removeTemporarioQuandoEntradaFalhaSemSubstituirArquivoAnterior() throws IOException {
        ArmazenamentoLocalDocumento storage = storage(1024);
        storage.salvar("empresa/arquivo.bin", bytes("anterior"));
        InputStream entradaComFalha = new InputStream() {
            private int leituras;

            @Override
            public int read() throws IOException {
                if (leituras++ >= 3) throw new IOException("falha sintética");
                return 'x';
            }
        };

        assertThatThrownBy(() -> storage.salvar("empresa/arquivo.bin", entradaComFalha))
                .isInstanceOf(ExcecaoNegocio.class);
        assertThat(storage.carregar("empresa/arquivo.bin").getInputStream().readAllBytes())
                .isEqualTo("anterior".getBytes(StandardCharsets.UTF_8));
        try (var arquivos = Files.list(diretorioTemporario.resolve("empresa"))) {
            assertThat(arquivos.map(path -> path.getFileName().toString()).toList())
                    .containsExactly("arquivo.bin");
        }
    }

    @Test
    void limitaLeituraETrataAusenciaERemocaoComoContratado() throws IOException {
        ArmazenamentoLocalDocumento storage = storage(4);
        Files.write(diretorioTemporario.resolve("grande.bin"), new byte[5]);

        assertThatThrownBy(() -> storage.carregar("grande.bin")).isInstanceOf(ExcecaoNegocio.class);
        assertThatThrownBy(() -> storage.carregar("ausente.bin")).isInstanceOf(ExcecaoNegocio.class);
        storage.remover("ausente.bin");
        storage.salvar("presente.bin", bytes("1234"));
        storage.remover("presente.bin");
        storage.remover("presente.bin");
        assertThat(Files.exists(diretorioTemporario.resolve("presente.bin"))).isFalse();
    }

    @Test
    void escritasConcorrentesNuncaExpõemConteudoParcial() throws Exception {
        ArmazenamentoLocalDocumento storage = storage(200_000);
        byte[] a = "a".repeat(100_000).getBytes(StandardCharsets.UTF_8);
        byte[] b = "b".repeat(100_000).getBytes(StandardCharsets.UTF_8);
        CountDownLatch inicio = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<?> primeira = executor.submit(() -> salvarAposSinal(storage, a, inicio));
            Future<?> segunda = executor.submit(() -> salvarAposSinal(storage, b, inicio));
            inicio.countDown();
            primeira.get();
            segunda.get();
        }

        byte[] encontrado = storage.carregar("concorrente.bin").getInputStream().readAllBytes();
        assertThat(encontrado).satisfiesAnyOf(
                conteudo -> assertThat(conteudo).isEqualTo(a),
                conteudo -> assertThat(conteudo).isEqualTo(b));
    }

    private void salvarAposSinal(ArmazenamentoLocalDocumento storage, byte[] conteudo,
                                 CountDownLatch inicio) {
        try {
            inicio.await();
            storage.salvar("concorrente.bin", new ByteArrayInputStream(conteudo));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private ArmazenamentoLocalDocumento storage(long limite) {
        return new ArmazenamentoLocalDocumento(diretorioTemporario.toString(), limite);
    }

    private ByteArrayInputStream bytes(String conteudo) {
        return new ByteArrayInputStream(conteudo.getBytes(StandardCharsets.UTF_8));
    }
}
