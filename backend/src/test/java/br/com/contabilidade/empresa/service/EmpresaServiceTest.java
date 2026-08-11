package br.com.contabilidade.empresa.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EmpresaServiceTest {

    @Test
    void deveTiparBuscaVaziaComoTextoParaPostgres() {
        assertThat(EmpresaService.normalizarTermoBusca(null)).isEmpty();
        assertThat(EmpresaService.normalizarTermoBusca("   ")).isEmpty();
    }
}
