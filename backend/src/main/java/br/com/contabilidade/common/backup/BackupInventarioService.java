package br.com.contabilidade.common.backup;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BackupInventarioService {

    private static final Pattern BACKUP_ID = Pattern.compile("\\d{8}-\\d{6}");
    private static final Pattern SAFE_FILE = Pattern.compile("[A-Za-z0-9][A-Za-z0-9._-]{0,199}");
    private static final Pattern SHA_256 = Pattern.compile("[0-9a-fA-F]{64}");

    private final ObjectMapper objectMapper;
    private final AuditoriaService auditoriaService;
    private final Path diretorio;
    private final int maximoManifestos;
    private final long maximoBytesManifesto;
    private final long maximoBytesComponenteParaHash;

    public BackupInventarioService(
            ObjectMapper objectMapper,
            AuditoriaService auditoriaService,
            @Value("${app.backup.directory:./dados/backups}") String diretorio,
            @Value("${app.backup.inventory-max-manifests:50}") int maximoManifestos,
            @Value("${app.backup.manifest-max-size-bytes:1048576}") long maximoBytesManifesto,
            @Value("${app.backup.hash-max-component-size-bytes:53687091200}") long maximoBytesComponenteParaHash
    ) {
        this.objectMapper = objectMapper;
        this.auditoriaService = auditoriaService;
        this.diretorio = Path.of(diretorio).toAbsolutePath().normalize();
        this.maximoManifestos = limitar(maximoManifestos, 1, 200);
        this.maximoBytesManifesto = limitar(maximoBytesManifesto, 1_024, 10 * 1024 * 1024L);
        this.maximoBytesComponenteParaHash = limitar(
                maximoBytesComponenteParaHash,
                1024 * 1024L,
                1024L * 1024 * 1024 * 1024
        );
    }

    public InventarioBackups listar() {
        Instant observadoEm = Instant.now();
        if (!diretorioDisponivel()) {
            return new InventarioBackups(
                    observadoEm,
                    false,
                    "DIRETORIO_BACKUP_INDISPONIVEL",
                    0,
                    false,
                    List.of()
            );
        }

        try (Stream<Path> stream = Files.list(diretorio)) {
            List<Path> manifestos = stream
                    .filter(this::manifestoRegular)
                    .sorted(Comparator.comparing((Path item) -> item.getFileName().toString()).reversed())
                    .toList();
            boolean limitado = manifestos.size() > maximoManifestos;
            List<BackupResumo> backups = manifestos.stream()
                    .limit(maximoManifestos)
                    .map(path -> avaliarSeguro(path, false))
                    .toList();
            return new InventarioBackups(
                    observadoEm,
                    true,
                    null,
                    manifestos.size(),
                    limitado,
                    backups
            );
        } catch (IOException | SecurityException exception) {
            return new InventarioBackups(
                    observadoEm,
                    false,
                    "LISTAGEM_BACKUP_INTERROMPIDA",
                    0,
                    false,
                    List.of()
            );
        }
    }

    public BackupResumo verificar(String backupId) {
        String id = validarBackupId(backupId);
        Path manifesto = diretorio.resolve("manifest-" + id + ".json").normalize();
        if (!manifesto.getParent().equals(diretorio) || !manifestoRegular(manifesto)) {
            throw new RecursoNaoEncontradoException(
                    "BACKUP_NAO_ENCONTRADO",
                    "erros.backupNaoEncontrado"
            );
        }

        BackupResumo resultado = avaliarSeguro(manifesto, true);
        Map<String, Object> detalhes = new LinkedHashMap<>();
        detalhes.put("backupId", id);
        detalhes.put("status", resultado.status());
        detalhes.put("componentes", resultado.componentes().size());
        detalhes.put("integridadeVerificada", resultado.integridadeVerificada());
        auditoriaService.registrar(
                "BACKUP_VERIFICADO_UI",
                "BACKUP",
                null,
                detalhes
        );
        return resultado;
    }

    private BackupResumo avaliarSeguro(Path path, boolean verificarHash) {
        String backupIdArquivo = extrairBackupId(path);
        try {
            Manifesto manifesto = lerManifesto(path);
            validarManifesto(manifesto, backupIdArquivo);
            return avaliar(manifesto, verificarHash);
        } catch (Exception exception) {
            return new BackupResumo(
                    backupIdArquivo,
                    null,
                    null,
                    null,
                    "INDISPONIVEL",
                    "MANIFESTO_INVALIDO",
                    0,
                    0,
                    false,
                    List.of()
            );
        }
    }

    private BackupResumo avaliar(Manifesto manifesto, boolean verificarHash) {
        List<ComponenteResumo> componentes = new ArrayList<>();
        long totalEsperado = 0;
        long totalAtual = 0;
        String motivo = null;
        boolean todosHashesVerificados = verificarHash;

        for (ComponenteManifesto componente : manifesto.components()) {
            Path arquivo = resolverComponente(componente.file());
            boolean existente = Files.isRegularFile(arquivo, LinkOption.NOFOLLOW_LINKS)
                    && !Files.isSymbolicLink(arquivo);
            Long tamanhoAtual = null;
            boolean tamanhoConfere = false;
            Boolean hashConfere = null;
            String motivoComponente = null;

            totalEsperado = somarSeguro(totalEsperado, componente.sizeBytes());
            if (!existente) {
                motivoComponente = "COMPONENTE_AUSENTE";
                todosHashesVerificados = false;
            } else {
                try {
                    tamanhoAtual = Files.size(arquivo);
                    totalAtual = somarSeguro(totalAtual, tamanhoAtual);
                    tamanhoConfere = tamanhoAtual == componente.sizeBytes();
                    if (!tamanhoConfere) {
                        motivoComponente = "TAMANHO_DIVERGENTE";
                        todosHashesVerificados = false;
                    } else if (verificarHash) {
                        if (tamanhoAtual > maximoBytesComponenteParaHash) {
                            motivoComponente = "LIMITE_HASH_ATINGIDO";
                            todosHashesVerificados = false;
                        } else {
                            hashConfere = hash(arquivo).equalsIgnoreCase(componente.sha256());
                            if (!hashConfere) motivoComponente = "HASH_DIVERGENTE";
                        }
                    }
                } catch (IOException | SecurityException exception) {
                    motivoComponente = "COMPONENTE_NAO_LEGIVEL";
                    todosHashesVerificados = false;
                }
            }

            if (motivo == null && motivoComponente != null) motivo = motivoComponente;
            componentes.add(new ComponenteResumo(
                    componente.name(),
                    componente.format(),
                    componente.sizeBytes(),
                    tamanhoAtual,
                    existente,
                    tamanhoConfere,
                    hashConfere,
                    motivoComponente
            ));
        }

        boolean divergente = componentes.stream().anyMatch(item -> item.motivoSeguro() != null);
        String status = divergente ? "DEGRADADO" : "SAUDAVEL";
        return new BackupResumo(
                manifesto.backupId(),
                parseInstant(manifesto.createdAt()),
                manifesto.applicationVersion(),
                manifesto.schemaVersion(),
                status,
                motivo,
                totalEsperado,
                totalAtual,
                todosHashesVerificados && !divergente,
                componentes
        );
    }

    private Manifesto lerManifesto(Path path) throws IOException {
        long tamanho = Files.size(path);
        if (tamanho <= 0 || tamanho > maximoBytesManifesto) {
            throw new IOException("Tamanho de manifesto inválido");
        }
        try (InputStream input = Files.newInputStream(path)) {
            return objectMapper.readValue(input, Manifesto.class);
        }
    }

    private void validarManifesto(Manifesto manifesto, String backupIdArquivo) {
        if (manifesto == null
                || !"1.0".equals(manifesto.schemaVersion())
                || !backupIdArquivo.equals(manifesto.backupId())
                || !BACKUP_ID.matcher(manifesto.backupId()).matches()
                || parseInstant(manifesto.createdAt()) == null
                || manifesto.applicationVersion() == null
                || manifesto.applicationVersion().isBlank()
                || manifesto.applicationVersion().length() > 100
                || manifesto.components() == null
                || manifesto.components().isEmpty()
                || manifesto.components().size() > 10) {
            throw new IllegalArgumentException("Manifesto inválido");
        }

        Set<String> nomes = new HashSet<>();
        Set<String> arquivos = new HashSet<>();
        for (ComponenteManifesto componente : manifesto.components()) {
            if (componente == null
                    || componente.name() == null
                    || componente.name().isBlank()
                    || componente.name().length() > 80
                    || componente.format() == null
                    || componente.format().isBlank()
                    || componente.format().length() > 80
                    || componente.file() == null
                    || !SAFE_FILE.matcher(componente.file()).matches()
                    || componente.sizeBytes() < 0
                    || componente.sha256() == null
                    || !SHA_256.matcher(componente.sha256()).matches()
                    || !nomes.add(componente.name())
                    || !arquivos.add(componente.file())) {
                throw new IllegalArgumentException("Componente inválido");
            }
            resolverComponente(componente.file());
        }
    }

    private Path resolverComponente(String file) {
        Path path = diretorio.resolve(file).normalize();
        if (!path.getParent().equals(diretorio)) {
            throw new IllegalArgumentException("Componente fora do diretório de backup");
        }
        return path;
    }

    private boolean diretorioDisponivel() {
        return Files.exists(diretorio, LinkOption.NOFOLLOW_LINKS)
                && !Files.isSymbolicLink(diretorio)
                && Files.isDirectory(diretorio, LinkOption.NOFOLLOW_LINKS)
                && Files.isReadable(diretorio);
    }

    private boolean manifestoRegular(Path path) {
        String nome = path.getFileName().toString();
        return nome.matches("manifest-\\d{8}-\\d{6}\\.json")
                && Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)
                && !Files.isSymbolicLink(path);
    }

    private String extrairBackupId(Path path) {
        String nome = path.getFileName().toString();
        return nome.replaceFirst("^manifest-", "").replaceFirst("\\.json$", "");
    }

    private String validarBackupId(String backupId) {
        String id = backupId == null ? "" : backupId.trim();
        if (!BACKUP_ID.matcher(id).matches()) {
            throw new RecursoNaoEncontradoException(
                    "BACKUP_NAO_ENCONTRADO",
                    "erros.backupNaoEncontrado"
            );
        }
        return id;
    }

    private Instant parseInstant(String valor) {
        try {
            return valor == null ? null : Instant.parse(valor);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String hash(Path path) throws IOException {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível", exception);
        }
        try (InputStream input = Files.newInputStream(path);
             DigestInputStream digestInput = new DigestInputStream(input, digest)) {
            byte[] buffer = new byte[64 * 1024];
            while (digestInput.read(buffer) >= 0) {
                // O DigestInputStream atualiza o hash durante a leitura.
            }
        }
        return HexFormat.of().formatHex(digest.digest());
    }

    private long somarSeguro(long atual, long valor) {
        try {
            return Math.addExact(atual, valor);
        } catch (ArithmeticException exception) {
            return Long.MAX_VALUE;
        }
    }

    private int limitar(int valor, int minimo, int maximo) {
        return Math.min(Math.max(valor, minimo), maximo);
    }

    private long limitar(long valor, long minimo, long maximo) {
        return Math.min(Math.max(valor, minimo), maximo);
    }

    private record Manifesto(
            String schemaVersion,
            String backupId,
            String createdAt,
            String applicationVersion,
            List<ComponenteManifesto> components
    ) {
    }

    private record ComponenteManifesto(
            String name,
            String file,
            String format,
            long sizeBytes,
            String sha256
    ) {
    }

    public record InventarioBackups(
            Instant observadoEm,
            boolean diretorioDisponivel,
            String motivoSeguro,
            long totalManifestos,
            boolean listaLimitada,
            List<BackupResumo> backups
    ) {
        public InventarioBackups {
            backups = List.copyOf(backups);
        }
    }

    public record BackupResumo(
            String backupId,
            Instant criadoEm,
            String versaoAplicacao,
            String versaoSchema,
            String status,
            String motivoSeguro,
            long tamanhoTotalManifesto,
            long tamanhoTotalAtual,
            boolean integridadeVerificada,
            List<ComponenteResumo> componentes
    ) {
        public BackupResumo {
            componentes = List.copyOf(componentes);
        }
    }

    public record ComponenteResumo(
            String nome,
            String formato,
            long tamanhoManifesto,
            Long tamanhoAtual,
            boolean existente,
            boolean tamanhoConfere,
            Boolean hashConfere,
            String motivoSeguro
    ) {
    }
}
