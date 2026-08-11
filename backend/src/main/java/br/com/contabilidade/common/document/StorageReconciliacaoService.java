package br.com.contabilidade.common.document;

import br.com.contabilidade.common.audit.AuditoriaService;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class StorageReconciliacaoService {

    private final DocumentoRepository repository;
    private final AuditoriaService auditoriaService;
    private final Path raiz;
    private final int tamanhoLote;
    private final int maximoReferencias;
    private final int maximoArquivos;
    private final int maximoAmostras;

    public StorageReconciliacaoService(
            DocumentoRepository repository,
            AuditoriaService auditoriaService,
            @Value("${app.storage.local-path:./dados/documentos}") String localPath,
            @Value("${app.storage.reconciliation-batch-size:1000}") int tamanhoLote,
            @Value("${app.storage.reconciliation-max-references:200000}") int maximoReferencias,
            @Value("${app.storage.reconciliation-max-files:200000}") int maximoArquivos,
            @Value("${app.storage.reconciliation-max-samples:20}") int maximoAmostras
    ) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
        this.raiz = Path.of(localPath).toAbsolutePath().normalize();
        this.tamanhoLote = limitar(tamanhoLote, 10, 5_000);
        this.maximoReferencias = limitar(maximoReferencias, 1, 1_000_000);
        this.maximoArquivos = limitar(maximoArquivos, 1, 1_000_000);
        this.maximoAmostras = limitar(maximoAmostras, 0, 100);
    }

    public ResultadoReconciliacao reconciliar() {
        Instant observadoEm = Instant.now();
        long documentosRegistrados = repository.count();
        long documentosAtivos = repository.countByAtivoTrue();
        ReferenciasBanco referenciasBanco = carregarReferencias(documentosRegistrados);

        if (!Files.exists(raiz, LinkOption.NOFOLLOW_LINKS)) {
            return finalizar(new ResultadoReconciliacao(
                    observadoEm,
                    "INDISPONIVEL",
                    "DIRETORIO_STORAGE_AUSENTE",
                    documentosRegistrados,
                    documentosAtivos,
                    referenciasBanco.analisadas(),
                    referenciasBanco.completas(),
                    0,
                    false,
                    0,
                    false,
                    0,
                    false,
                    0,
                    List.of(),
                    List.of()
            ));
        }
        if (Files.isSymbolicLink(raiz) || !Files.isDirectory(raiz, LinkOption.NOFOLLOW_LINKS)
                || !Files.isReadable(raiz)) {
            return finalizar(new ResultadoReconciliacao(
                    observadoEm,
                    "INDISPONIVEL",
                    "DIRETORIO_STORAGE_NAO_LEGIVEL",
                    documentosRegistrados,
                    documentosAtivos,
                    referenciasBanco.analisadas(),
                    referenciasBanco.completas(),
                    0,
                    false,
                    0,
                    false,
                    0,
                    false,
                    0,
                    List.of(),
                    List.of()
            ));
        }

        ArquivosStorage arquivosStorage = carregarArquivos();
        boolean ausentesCompletos = arquivosStorage.completos();
        boolean orfaosCompletos = referenciasBanco.completas();
        Set<String> referenciasSemArquivo = new HashSet<>();
        Set<String> arquivosSemRegistro = new HashSet<>();

        if (ausentesCompletos) {
            for (String referencia : referenciasBanco.referencias()) {
                if (!arquivosStorage.referencias().contains(referencia)) {
                    referenciasSemArquivo.add(referencia);
                }
            }
        }
        if (orfaosCompletos) {
            for (String arquivo : arquivosStorage.referencias()) {
                if (!referenciasBanco.referencias().contains(arquivo)) {
                    arquivosSemRegistro.add(arquivo);
                }
            }
        }

        boolean parcial = !referenciasBanco.completas() || !arquivosStorage.completos();
        boolean divergente = !referenciasSemArquivo.isEmpty() || !arquivosSemRegistro.isEmpty();
        String status = parcial || divergente ? "DEGRADADO" : "SAUDAVEL";
        String motivo = arquivosStorage.motivoSeguro();
        if (motivo == null && parcial) motivo = "LIMITE_RECONCILIACAO_ATINGIDO";
        if (motivo == null && divergente) motivo = "DIVERGENCIA_STORAGE_DETECTADA";

        return finalizar(new ResultadoReconciliacao(
                observadoEm,
                status,
                motivo,
                documentosRegistrados,
                documentosAtivos,
                referenciasBanco.analisadas(),
                referenciasBanco.completas(),
                arquivosStorage.analisados(),
                arquivosStorage.completos(),
                referenciasSemArquivo.size(),
                ausentesCompletos,
                arquivosSemRegistro.size(),
                orfaosCompletos,
                arquivosStorage.linksSimbolicosIgnorados(),
                amostras(referenciasSemArquivo),
                amostras(arquivosSemRegistro)
        ));
    }

    private ReferenciasBanco carregarReferencias(long totalDocumentos) {
        Set<String> referencias = new HashSet<>();
        String cursor = null;
        int analisadas = 0;

        while (analisadas < maximoReferencias) {
            int limite = Math.min(tamanhoLote, maximoReferencias - analisadas);
            List<String> lote = cursor == null
                    ? repository.buscarPrimeirasReferenciasStorage(PageRequest.of(0, limite))
                    : repository.buscarReferenciasStorageApos(cursor, PageRequest.of(0, limite));
            if (lote.isEmpty()) break;
            for (String referencia : lote) {
                referencias.add(normalizarReferencia(referencia));
                analisadas++;
            }
            cursor = lote.get(lote.size() - 1);
            if (lote.size() < limite) break;
        }

        return new ReferenciasBanco(
                Set.copyOf(referencias),
                analisadas,
                analisadas >= totalDocumentos
        );
    }

    private ArquivosStorage carregarArquivos() {
        Set<String> referencias = new HashSet<>();
        int analisados = 0;
        int linksIgnorados = 0;
        boolean completos = true;
        String motivo = null;

        try (Stream<Path> caminhos = Files.walk(raiz)) {
            Iterator<Path> iterator = caminhos.iterator();
            while (iterator.hasNext()) {
                Path caminho = iterator.next();
                if (caminho.equals(raiz) || Files.isDirectory(caminho, LinkOption.NOFOLLOW_LINKS)) {
                    continue;
                }
                if (Files.isSymbolicLink(caminho)) {
                    linksIgnorados++;
                    continue;
                }
                if (!Files.isRegularFile(caminho, LinkOption.NOFOLLOW_LINKS)) continue;
                if (analisados >= maximoArquivos) {
                    completos = false;
                    motivo = "LIMITE_ARQUIVOS_ATINGIDO";
                    break;
                }
                referencias.add(normalizarReferencia(raiz.relativize(caminho).toString()));
                analisados++;
            }
        } catch (IOException | UncheckedIOException | SecurityException exception) {
            completos = false;
            motivo = "LEITURA_STORAGE_INTERROMPIDA";
        }

        return new ArquivosStorage(Set.copyOf(referencias), analisados, completos, linksIgnorados, motivo);
    }

    private ResultadoReconciliacao finalizar(ResultadoReconciliacao resultado) {
        Map<String, Object> detalhes = new LinkedHashMap<>();
        detalhes.put("status", resultado.status());
        detalhes.put("documentosRegistrados", resultado.documentosRegistrados());
        detalhes.put("documentosAtivos", resultado.documentosAtivos());
        detalhes.put("referenciasAnalisadas", resultado.referenciasAnalisadas());
        detalhes.put("arquivosAnalisados", resultado.arquivosAnalisados());
        detalhes.put("referenciasSemArquivo", resultado.referenciasSemArquivoDetectadas());
        detalhes.put("arquivosSemRegistro", resultado.arquivosSemRegistroDetectados());
        detalhes.put("resultadoParcial", !resultado.referenciasCompletas() || !resultado.arquivosCompletos());
        auditoriaService.registrar("STORAGE_RECONCILIADO", "DOCUMENTO", null, detalhes);
        return resultado;
    }

    private List<String> amostras(Set<String> referencias) {
        if (maximoAmostras == 0 || referencias.isEmpty()) return List.of();
        List<String> ordenadas = new ArrayList<>(referencias);
        ordenadas.sort(String::compareTo);
        return ordenadas.stream()
                .limit(maximoAmostras)
                .map(this::identificadorSeguro)
                .toList();
    }

    private String identificadorSeguro(String referencia) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(referencia.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash, 0, 8);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível", exception);
        }
    }

    private String normalizarReferencia(String referencia) {
        return referencia == null ? "" : referencia.replace('\\', '/');
    }

    private int limitar(int valor, int minimo, int maximo) {
        return Math.min(Math.max(valor, minimo), maximo);
    }

    private record ReferenciasBanco(Set<String> referencias, int analisadas, boolean completas) { }

    private record ArquivosStorage(
            Set<String> referencias,
            int analisados,
            boolean completos,
            int linksSimbolicosIgnorados,
            String motivoSeguro
    ) { }

    public record ResultadoReconciliacao(
            Instant observadoEm,
            String status,
            String motivoSeguro,
            long documentosRegistrados,
            long documentosAtivos,
            long referenciasAnalisadas,
            boolean referenciasCompletas,
            long arquivosAnalisados,
            boolean arquivosCompletos,
            long referenciasSemArquivoDetectadas,
            boolean referenciasSemArquivoCompleta,
            long arquivosSemRegistroDetectados,
            boolean arquivosSemRegistroCompleta,
            long linksSimbolicosIgnorados,
            List<String> amostrasReferenciasSemArquivo,
            List<String> amostrasArquivosSemRegistro
    ) {
        public ResultadoReconciliacao {
            amostrasReferenciasSemArquivo = List.copyOf(amostrasReferenciasSemArquivo);
            amostrasArquivosSemRegistro = List.copyOf(amostrasArquivosSemRegistro);
        }
    }
}
