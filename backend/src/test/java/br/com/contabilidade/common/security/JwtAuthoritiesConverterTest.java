package br.com.contabilidade.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class JwtAuthoritiesConverterTest {

    private static final String CLIENT_ID = "contabilidade-api";
    private final JwtAuthoritiesConverter converter = new JwtAuthoritiesConverter(CLIENT_ID);

    @Test
    void deveConverterSomentePapeisEAliasesConhecidos() {
        Jwt jwt = jwt(Map.of(
                "realm_access", Map.of("roles", List.of("contabilidade_admin", "OPERADOR")),
                "resource_access", Map.of(CLIENT_ID,
                        Map.of("roles", List.of("leitor", "CONTABILIDADE_TECNICO")))));

        assertThat(authorities(jwt)).containsExactly(Papeis.ADMIN, Papeis.OPERADOR, Papeis.LEITOR, Papeis.TECNICO);
    }

    @Test
    void deveIgnorarPapeisDesconhecidosInclusiveComPrefixoRole() {
        Jwt jwt = jwt(Map.of("realm_access", Map.of("roles", List.of("auditor", "ROLE_ADMIN", "ROLE_AUDITOR"))));

        assertThat(authorities(jwt)).isEmpty();
    }

    @Test
    void deveFalharFechadoParaClaimsVaziasNaoStringOuMalformadas() {
        List<Jwt> malformed = List.of(
                jwt(Map.of("realm_access", Map.of("roles", Arrays.asList("", null, 42, Map.of("role", "admin"))))),
                jwt(Map.of("realm_access", Map.of("roles", "admin"))),
                jwt(Map.of("realm_access", List.of("admin"))),
                jwt(Map.of("resource_access", Map.of(CLIENT_ID, Map.of("roles", List.of(false, 7))))),
                jwt(Map.of("resource_access", Map.of(CLIENT_ID, "admin"))));

        assertThat(malformed).allSatisfy(token -> assertThat(authorities(token)).isEmpty());
    }

    @Test
    void deveDeduplicarPapelRepetidoNoRealmENoClient() {
        Jwt jwt = jwt(Map.of(
                "realm_access", Map.of("roles", List.of("admin", "contabilidade_admin")),
                "resource_access", Map.of(CLIENT_ID, Map.of("roles", List.of("ADMIN")))));

        assertThat(authorities(jwt)).containsExactly(Papeis.ADMIN);
    }

    private Collection<String> authorities(Jwt jwt) {
        return converter.convert(jwt).stream().map(GrantedAuthority::getAuthority).toList();
    }

    private Jwt jwt(Map<String, Object> claims) {
        return new Jwt("synthetic-token", Instant.EPOCH, Instant.EPOCH.plusSeconds(60),
                Map.of("alg", "none"), claims);
    }
}
