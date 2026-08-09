package br.com.contabilidade.common.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
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
        List<GrantedAuthority> authorities = new ArrayList<>();
        adicionarRealmRoles(jwt, authorities);
        adicionarClientRoles(jwt, authorities);
        return authorities;
    }

    @SuppressWarnings("unchecked")
    private void adicionarRealmRoles(Jwt jwt, List<GrantedAuthority> authorities) {
        Object realmAccessValue = jwt.getClaims().get("realm_access");
        if (!(realmAccessValue instanceof Map<?, ?> realmAccess)) {
            return;
        }
        Object rolesValue = realmAccess.get("roles");
        if (rolesValue instanceof Collection<?> roles) {
            roles.stream().map(Object::toString).map(this::normalizarPapel)
                    .map(SimpleGrantedAuthority::new).forEach(authorities::add);
        }
    }

    @SuppressWarnings("unchecked")
    private void adicionarClientRoles(Jwt jwt, List<GrantedAuthority> authorities) {
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
            roles.stream().map(Object::toString).map(this::normalizarPapel)
                    .map(SimpleGrantedAuthority::new).forEach(authorities::add);
        }
    }

    private String normalizarPapel(String role) {
        return switch (role.toLowerCase()) {
            case "contabilidade_admin", "admin" -> Papeis.ADMIN;
            case "contabilidade_operador", "operador" -> Papeis.OPERADOR;
            case "contabilidade_leitor", "leitor" -> Papeis.LEITOR;
            case "contabilidade_tecnico", "tecnico" -> Papeis.TECNICO;
            default -> role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
        };
    }
}
