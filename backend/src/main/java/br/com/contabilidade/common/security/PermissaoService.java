package br.com.contabilidade.common.security;

import java.util.Map;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("permissaoService")
public class PermissaoService {

    private static final Set<String> TODAS = Set.of(
            Permissoes.EMPRESA_LER, Permissoes.EMPRESA_EDITAR,
            Permissoes.DOCUMENTO_LER, Permissoes.DOCUMENTO_ENVIAR, Permissoes.DOCUMENTO_BAIXAR,
            Permissoes.EXECUCAO_LER, Permissoes.EXECUCAO_CANCELAR,
            Permissoes.INTERVENCAO_LER, Permissoes.INTERVENCAO_RESOLVER,
            Permissoes.NOTIFICACAO_LER,
            Permissoes.INTEGRACAO_LER, Permissoes.INTEGRACAO_EDITAR,
            Permissoes.CERTIDAO_LER, Permissoes.CERTIDAO_SOLICITAR,
            Permissoes.CERTIDAO_REGISTRAR_MANUAL,
            Permissoes.AUDITORIA_LER, Permissoes.CONSOLE_TECNICA_LER
    );

    private static final Map<String, Set<String>> CATALOGO = Map.of(
            Papeis.OPERADOR, Set.of(
                    Permissoes.EMPRESA_LER, Permissoes.EMPRESA_EDITAR,
                    Permissoes.DOCUMENTO_LER, Permissoes.DOCUMENTO_ENVIAR, Permissoes.DOCUMENTO_BAIXAR,
                    Permissoes.EXECUCAO_LER, Permissoes.EXECUCAO_CANCELAR,
                    Permissoes.INTERVENCAO_LER, Permissoes.INTERVENCAO_RESOLVER,
                    Permissoes.NOTIFICACAO_LER, Permissoes.INTEGRACAO_LER,
                    Permissoes.CERTIDAO_LER, Permissoes.CERTIDAO_SOLICITAR,
                    Permissoes.CERTIDAO_REGISTRAR_MANUAL
            ),
            Papeis.LEITOR, Set.of(
                    Permissoes.EMPRESA_LER, Permissoes.DOCUMENTO_LER, Permissoes.DOCUMENTO_BAIXAR,
                    Permissoes.EXECUCAO_LER, Permissoes.INTERVENCAO_LER,
                    Permissoes.NOTIFICACAO_LER, Permissoes.INTEGRACAO_LER,
                    Permissoes.CERTIDAO_LER
            ),
            Papeis.TECNICO, Set.of(
                    Permissoes.EMPRESA_LER, Permissoes.EXECUCAO_LER, Permissoes.EXECUCAO_CANCELAR,
                    Permissoes.INTERVENCAO_LER, Permissoes.INTERVENCAO_RESOLVER,
                    Permissoes.INTEGRACAO_LER, Permissoes.INTEGRACAO_EDITAR,
                    Permissoes.CERTIDAO_LER,
                    Permissoes.AUDITORIA_LER, Permissoes.CONSOLE_TECNICA_LER
            )
    );

    private final AppSecurityProperties properties;

    public PermissaoService(AppSecurityProperties properties) { this.properties = properties; }

    public boolean tem(String permissao) {
        if (!properties.enabled()) return true;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return false;
        if (authentication.getAuthorities().stream().anyMatch(a -> Papeis.ADMIN.equals(a.getAuthority()))) return true;
        if (authentication.getAuthorities().stream().anyMatch(a -> permissao.equals(a.getAuthority()))) return true;
        return authentication.getAuthorities().stream()
                .map(a -> CATALOGO.getOrDefault(a.getAuthority(), Set.of()))
                .anyMatch(permissoes -> permissoes.contains(permissao));
    }

    public Set<String> permissoesAtuais() {
        if (!properties.enabled()) return TODAS;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return Set.of();
        if (authentication.getAuthorities().stream().anyMatch(a -> Papeis.ADMIN.equals(a.getAuthority()))) return TODAS;
        return authentication.getAuthorities().stream()
                .flatMap(a -> CATALOGO.getOrDefault(a.getAuthority(), Set.of()).stream())
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }
}
