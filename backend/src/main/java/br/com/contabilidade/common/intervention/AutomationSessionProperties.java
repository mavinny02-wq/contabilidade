package br.com.contabilidade.common.intervention;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.automation.session")
public record AutomationSessionProperties(
        String publicPath,
        String signingSecret,
        Duration ticketTtl
) {

    public String caminhoPublicoEfetivo() {
        if (publicPath == null || publicPath.isBlank()) {
            return "/automation";
        }
        String limpo = publicPath.trim();
        if (!limpo.startsWith("/")) {
            limpo = "/" + limpo;
        }
        if (limpo.endsWith("/")) {
            limpo = limpo.substring(0, limpo.length() - 1);
        }
        return limpo;
    }

    public String segredoEfetivo() {
        if (signingSecret == null || signingSecret.length() < 32) {
            throw new IllegalStateException(
                    "APP_AUTOMATION_SESSION_SIGNING_SECRET deve possuir ao menos 32 caracteres"
            );
        }
        return signingSecret;
    }

    public Duration ttlEfetivo() {
        if (ticketTtl == null || ticketTtl.isNegative() || ticketTtl.isZero()) {
            return Duration.ofMinutes(15);
        }
        return ticketTtl.compareTo(Duration.ofMinutes(30)) > 0
                ? Duration.ofMinutes(30)
                : ticketTtl;
    }
}
