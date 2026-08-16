package br.com.contabilidade.common.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Records HTTP telemetry using only bounded, technical dimensions. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class HttpObservabilityFilter extends OncePerRequestFilter {

    private final MeterRegistry registry;

    public HttpObservabilityFilter(MeterRegistry registry) {
        this.registry = registry;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {
        long started = System.nanoTime();
        String errorClass = "none";
        try {
            chain.doFilter(request, response);
        } catch (ServletException | IOException | RuntimeException exception) {
            errorClass = classifyError(exception);
            throw exception;
        } finally {
            String operation = operation(request.getMethod());
            String result = result(response.getStatus(), errorClass);
            Counter.builder("contabilidade.http.requests")
                    .tag("operation", operation)
                    .tag("result", result)
                    .register(registry)
                    .increment();
            Timer.builder("contabilidade.http.latency")
                    .tag("operation", operation)
                    .tag("result", result)
                    .register(registry)
                    .record(System.nanoTime() - started, TimeUnit.NANOSECONDS);
            if (!"none".equals(errorClass) || response.getStatus() >= 500) {
                Counter.builder("contabilidade.http.errors")
                        .tag("operation", operation)
                        .tag("error_class", "none".equals(errorClass) ? "server_response" : errorClass)
                        .register(registry)
                        .increment();
            }
        }
    }

    static String operation(String method) {
        return switch (method) {
            case "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS" -> method;
            default -> "OTHER";
        };
    }

    private static String result(int status, String errorClass) {
        if (!"none".equals(errorClass) || status >= 500) return "server_error";
        if (status >= 400) return "client_error";
        return "success";
    }

    private static String classifyError(Exception exception) {
        if (exception instanceof IOException) return "io";
        if (exception instanceof ServletException) return "servlet";
        return "unexpected";
    }
}
