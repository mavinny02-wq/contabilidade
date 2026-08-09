package br.com.contabilidade.common.security;

import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuario-atual")
public class UsuarioAtualController {

    private final PermissaoService permissaoService;
    private final AppSecurityProperties properties;

    public UsuarioAtualController(PermissaoService permissaoService, AppSecurityProperties properties) {
        this.permissaoService = permissaoService;
        this.properties = properties;
    }

    @GetMapping
    public UsuarioAtualResponse obter(Authentication authentication) {
        if (!properties.enabled()) {
            return new UsuarioAtualResponse(
                    "usuario-local",
                    "Usuário local",
                    Set.of(Papeis.ADMIN),
                    permissaoService.permissoesAtuais(),
                    false
            );
        }
        Set<String> papeis = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(authority -> authority.startsWith("ROLE_"))
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
        return new UsuarioAtualResponse(
                authentication.getName(),
                authentication.getName(),
                papeis,
                permissaoService.permissoesAtuais(),
                true
        );
    }

    public record UsuarioAtualResponse(
            String usuario,
            String nome,
            Set<String> papeis,
            Set<String> permissoes,
            boolean autenticacaoAtiva
    ) {
    }
}
