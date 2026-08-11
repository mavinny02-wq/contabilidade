package br.com.contabilidade.common.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ProvedorHistoricoServiceTest {
    @Test
    void deveConverterPeriodoParaTipoTemporalAceitoPeloPostgres() {
        Instant instante = Instant.parse("2026-08-11T00:00:00Z");
        Timestamp parametro = ProvedorHistoricoService.parametroTemporal(instante);
        assertThat(parametro.toInstant()).isEqualTo(instante);
    }
}
