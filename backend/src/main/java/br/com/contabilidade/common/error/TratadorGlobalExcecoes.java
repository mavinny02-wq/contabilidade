package br.com.contabilidade.common.error;

import br.com.contabilidade.common.web.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class TratadorGlobalExcecoes {

    private static final Logger log = LoggerFactory.getLogger(TratadorGlobalExcecoes.class);
    private final MessageSource messageSource;

    public TratadorGlobalExcecoes(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(ExcecaoNegocio.class)
    public ResponseEntity<ApiError> tratarNegocio(ExcecaoNegocio exception, HttpServletRequest request) {
        return criarResposta(
                exception.getStatus(),
                exception.getCodigo(),
                exception.getMensagemKey(),
                List.of(),
                request
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> tratarValidacao(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<ErroCampo> campos = exception.getBindingResult().getFieldErrors().stream()
                .map(this::mapearCampo)
                .toList();
        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "VALIDACAO_INVALIDA",
                "erros.validacao",
                campos,
                request
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> tratarRestricao(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        List<ErroCampo> campos = exception.getConstraintViolations().stream()
                .map(violacao -> new ErroCampo(
                        violacao.getPropertyPath().toString(),
                        violacao.getMessage()
                ))
                .toList();
        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "VALIDACAO_INVALIDA",
                "erros.validacao",
                campos,
                request
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> tratarIntegridade(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        log.warn("Violação de integridade. correlationId={}", correlationId(request));
        return criarResposta(
                HttpStatus.CONFLICT,
                "CONFLITO_DADOS",
                "erros.conflitoDados",
                List.of(),
                request
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> tratarInesperado(Exception exception, HttpServletRequest request) {
        log.error("Erro inesperado. correlationId={}", correlationId(request), exception);
        return criarResposta(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "ERRO_INTERNO",
                "erros.interno",
                List.of(),
                request
        );
    }

    private ErroCampo mapearCampo(FieldError fieldError) {
        return new ErroCampo(
                fieldError.getField(),
                Objects.requireNonNullElse(fieldError.getDefaultMessage(), "Valor inválido")
        );
    }

    private ResponseEntity<ApiError> criarResposta(
            HttpStatus status,
            String codigo,
            String mensagemKey,
            List<ErroCampo> campos,
            HttpServletRequest request
    ) {
        String mensagem = messageSource.getMessage(mensagemKey, null, mensagemKey, Locale.forLanguageTag("pt-BR"));
        ApiError body = new ApiError(
                Instant.now(),
                status.value(),
                codigo,
                mensagemKey,
                mensagem,
                request.getRequestURI(),
                correlationId(request),
                campos
        );
        return ResponseEntity.status(status).body(body);
    }

    private String correlationId(HttpServletRequest request) {
        Object value = request.getAttribute(CorrelationIdFilter.ATTRIBUTE);
        return value == null ? "desconhecido" : value.toString();
    }
}
