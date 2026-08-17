package br.com.contabilidade.common.security;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

public class JwtAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private final String resourceClientId;

    public JwtAuthoritiesConverter(String resourceClientId) {
        this.resourceClientId = resourceClientId;
    }

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        adicionarRealmRoles(jwt, authorities);
        adicionarClientRoles(jwt, authorities);
        return authorities;
    }

    private void adicionarRealmRoles(Jwt jwt, Set<GrantedAuthority> authorities) {
        Object realmAccessValue = jwt.getClaims().get("realm_access");
        if (!(realmAccessValue instanceof Map<?, ?> realmAccess)) {
            return;
        }
        Object rolesValue = realmAccess.get("roles");
        if (rolesValue instanceof Collection<?> roles) {
            roles.stream().filter(String.class::isInstance).map(String.class::cast)
                    .map(this::normalizarPapel).flatMap(Optional::stream)
                    .map(SimpleGrantedAuthority::new).forEach(authorities::add);
        }
    }

    private void adicionarClientRoles(Jwt jwt, Set<GrantedAuthority> authorities) {
        Object resourceAccessValue = jwt.getClaims().get("resource_access");
        if (!(resourceAccessValue instanceof Map<?, ?> resourceAccess)) {
            return;
        }
        Object clientValue = resourceAccess.get(resourceClientId);
        if (!(clientValue instanceof Map<?, ?> client)) {
            return;
        }
        Object rolesValue = client.get("roles");
        if (rolesValue instanceof Collection<?> roles) {
            roles.stream().filter(String.class::isInstance).map(String.class::cast)
                    .map(this::normalizarPapel).flatMap(Optional::stream)
                    .map(SimpleGrantedAuthority::new).forEach(authorities::add);
        }
    }

    private Optional<String> normalizarPapel(String role) {
        return switch (role.toLowerCase(Locale.ROOT)) {
            case "contabilidade_admin", "admin" -> Optional.of(Papeis.ADMIN);
            case "contabilidade_operador", "operador" -> Optional.of(Papeis.OPERADOR);
            case "contabilidade_leitor", "leitor" -> Optional.of(Papeis.LEITOR);
            case "contabilidade_tecnico", "tecnico" -> Optional.of(Papeis.TECNICO);
            default -> Optional.empty();
        };
    }
}
