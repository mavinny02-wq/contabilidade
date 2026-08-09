package br.com.contabilidade.common.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record AppSecurityProperties(
        boolean enabled,
        String resourceClientId
) {
}
