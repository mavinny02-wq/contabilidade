package br.com.contabilidade.common.execution;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ExecucaoFilaServiceTest {

    @Test
    void deveConverterInstanteDoLeaseParaTipoTemporalAceitoPeloPostgres() {
        Instant instante = Instant.parse("2026-08-11T12:34:56.789Z");

        Timestamp parametro = ExecucaoFilaService.parametroTemporal(instante);

        assertThat(parametro.toInstant()).isEqualTo(instante);
    }
}
