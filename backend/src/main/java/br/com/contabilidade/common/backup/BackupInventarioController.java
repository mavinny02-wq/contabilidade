package br.com.contabilidade.common.backup;

import jakarta.validation.constraints.Pattern;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/console-tecnica/backups")
public class BackupInventarioController {

    private final BackupInventarioService service;

    public BackupInventarioController(BackupInventarioService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('CONSOLE_TECNICA_LER')")
    public BackupInventarioService.InventarioBackups listar() {
        return service.listar();
    }

    @GetMapping("/{backupId}/verificar")
    @PreAuthorize("@permissaoService.tem('CONSOLE_TECNICA_LER')")
    public BackupInventarioService.BackupResumo verificar(
            @PathVariable
            @Pattern(regexp = "\\d{8}-\\d{6}")
            String backupId
    ) {
        return service.verificar(backupId);
    }
}
