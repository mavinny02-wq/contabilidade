package br.com.contabilidade.common.error;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.contabilidade.common.web.CorrelationIdFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;

class TratadorGlobalExcecoesTest {

    private TratadorGlobalExcecoes tratador;
    private MockHttpServletRequest request;

    @BeforeEach
    void configurar() {
        StaticMessageSource messageSource = new StaticMessageSource();
        messageSource.addMessage(
                "erros.acessoNegado",
                java.util.Locale.forLanguageTag("pt-BR"),
                "Você não possui permissão para realizar esta operação."
        );
        messageSource.addMessage(
                "erros.interno",
                java.util.Locale.forLanguageTag("pt-BR"),
                "Ocorreu um erro interno. Informe o correlationId ao suporte."
        );
        tratador = new TratadorGlobalExcecoes(messageSource);
        request = new MockHttpServletRequest("GET", "/api/recurso-protegido");
        request.setAttribute(CorrelationIdFilter.ATTRIBUTE, "correlation-403");
    }

    @Test
    void mapeiaAcessoNegadoParaRespostaSeguraECorrelacionavel() {
        ResponseEntity<ApiError> response = tratador.tratarAcessoNegado(
                new AccessDeniedException("authority=SEGREDO token=nao-expor"),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(403);
        assertThat(response.getBody().codigo()).isEqualTo("ACESSO_NEGADO");
        assertThat(response.getBody().mensagemKey()).isEqualTo("erros.acessoNegado");
        assertThat(response.getBody().mensagem())
                .isEqualTo("Você não possui permissão para realizar esta operação.")
                .doesNotContain("SEGREDO", "token", "nao-expor");
        assertThat(response.getBody().caminho()).isEqualTo("/api/recurso-protegido");
        assertThat(response.getBody().correlationId()).isEqualTo("correlation-403");
        assertThat(response.getBody().campos()).isEmpty();
    }

    @Test
    void preservaErroInesperadoComoErroInterno() {
        ResponseEntity<ApiError> response = tratador.tratarInesperado(
                new IllegalStateException("detalhe interno"),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().codigo()).isEqualTo("ERRO_INTERNO");
        assertThat(response.getBody().correlationId()).isEqualTo("correlation-403");
        assertThat(response.getBody().mensagem()).doesNotContain("detalhe interno");
    }
}
