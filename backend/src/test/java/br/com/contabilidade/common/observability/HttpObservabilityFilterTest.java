package br.com.contabilidade.common.observability;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.contabilidade.common.web.CorrelationIdFilter;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class HttpObservabilityFilterTest {

    @Test
    void correlationAcceptsSafeValueAndCleansContext() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/test");
        request.addHeader(CorrelationIdFilter.HEADER, "worker_01.trace-2");
        var response = new MockHttpServletResponse();

        new CorrelationIdFilter().doFilter(request, response, (req, res) ->
                assertThat(MDC.get(CorrelationIdFilter.ATTRIBUTE)).isEqualTo("worker_01.trace-2"));

        assertThat(response.getHeader(CorrelationIdFilter.HEADER)).isEqualTo("worker_01.trace-2");
        assertThat(MDC.get(CorrelationIdFilter.ATTRIBUTE)).isNull();
    }

    @Test
    void correlationRejectsUnsafeOrSensitiveValuesAndGeneratesUuid() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/test");
        request.addHeader(CorrelationIdFilter.HEADER, "Bearer secret\r\nInjected: value");
        var response = new MockHttpServletResponse();

        new CorrelationIdFilter().doFilter(request, response, (req, res) -> { });

        assertThat(response.getHeader(CorrelationIdFilter.HEADER))
                .matches("[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}");
    }

    @Test
    void metricsExposeOnlyBoundedTechnicalTags() throws Exception {
        var registry = new SimpleMeterRegistry();
        var filter = new HttpObservabilityFilter(registry);
        var request = new MockHttpServletRequest("CUSTOM", "/empresas/12345678000199");
        var response = new MockHttpServletResponse();
        response.setStatus(503);

        filter.doFilter(request, response, (req, res) -> { });

        assertThat(registry.get("contabilidade.http.requests").tags("operation", "OTHER", "result", "server_error")
                .counter().count()).isEqualTo(1);
        assertThat(registry.getMeters()).allSatisfy(meter -> {
            assertThat(meter.getId().getTags()).extracting(tag -> tag.getKey())
                    .isSubsetOf(Set.of("operation", "result", "error_class"));
            assertThat(meter.getId().getTags()).extracting(tag -> tag.getValue())
                    .doesNotContain("/empresas/12345678000199", "12345678000199");
        });
    }
}
