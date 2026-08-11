package br.com.contabilidade.common.intervention;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriUtils;

@Service
public class SessaoInterativaTicketService {

    private static final Base64.Encoder BASE64_URL = Base64.getUrlEncoder().withoutPadding();

    private final AutomationSessionProperties properties;
    private final ObjectMapper objectMapper;

    public SessaoInterativaTicketService(
            AutomationSessionProperties properties,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public TicketSessaoInterativa gerar(
            SolicitacaoIntervencao intervencao,
            String usuario
    ) {
        validarDisponibilidade(intervencao, usuario);

        Instant expiraEm = Instant.now().plus(properties.ttlEfetivo());
        if (intervencao.getExpiraEm() != null && intervencao.getExpiraEm().isBefore(expiraEm)) {
            expiraEm = intervencao.getExpiraEm();
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sid", intervencao.getSessaoReferencia());
        payload.put("iid", intervencao.getId().toString());
        payload.put("eid", intervencao.getExecucaoId().toString());
        payload.put("sub", usuario);
        payload.put("exp", expiraEm.getEpochSecond());
        payload.put("jti", UUID.randomUUID().toString());

        String payloadCodificado = codificarJson(payload);
        String assinatura = assinar(payloadCodificado);
        String ticket = payloadCodificado + "." + assinatura;
        String ticketEscapado = UriUtils.encodeQueryParam(ticket, StandardCharsets.UTF_8);

        String base = properties.caminhoPublicoEfetivo()
                + "/sessions/"
                + intervencao.getSessaoReferencia();

        // O ticket aparece somente no primeiro GET /info. O worker o troca por um
        // grant HttpOnly vinculado à sessão; eventos e comandos nunca reutilizam o jti.
        return new TicketSessaoInterativa(
                intervencao.getSessaoReferencia(),
                base + "/events",
                base + "/input",
                base + "/info?ticket=" + ticketEscapado,
                expiraEm
        );
    }

    private void validarDisponibilidade(SolicitacaoIntervencao intervencao, String usuario) {
        if (intervencao.getSessaoReferencia() == null) {
            throw new ExcecaoNegocio(
                    "INTERVENCAO_SEM_SESSAO_INTERATIVA",
                    "erros.intervencaoSemSessaoInterativa",
                    HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        if (intervencao.getStatus() != StatusIntervencao.EM_ATENDIMENTO
                || !usuario.equals(intervencao.getAtribuidaPara())) {
            throw new ExcecaoNegocio(
                    "INTERVENCAO_NAO_ATRIBUIDA_AO_USUARIO",
                    "erros.intervencaoNaoAtribuidaAoUsuario",
                    HttpStatus.CONFLICT
            );
        }
        if (intervencao.getExpiraEm() != null && intervencao.getExpiraEm().isBefore(Instant.now())) {
            throw new ExcecaoNegocio(
                    "INTERVENCAO_EXPIRADA",
                    "erros.intervencaoExpirada",
                    HttpStatus.GONE
            );
        }
    }

    private String codificarJson(Map<String, Object> payload) {
        try {
            return BASE64_URL.encodeToString(objectMapper.writeValueAsBytes(payload));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível gerar ticket da sessão", exception);
        }
    }

    private String assinar(String payloadCodificado) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    properties.segredoEfetivo().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            ));
            return BASE64_URL.encodeToString(
                    mac.doFinal(payloadCodificado.getBytes(StandardCharsets.US_ASCII))
            );
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Não foi possível assinar ticket da sessão", exception);
        }
    }

    public record TicketSessaoInterativa(
            String sessionId,
            String eventsUrl,
            String inputUrl,
            String infoUrl,
            Instant expiraEm
    ) {
    }
}
