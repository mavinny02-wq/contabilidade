package br.com.contabilidade.empresa.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.EntityGraph;

class EmpresaRepositoryTest {

    @Test
    void consultaDetalhadaNaoDeveBuscarDuasListasAninhadasNoMesmoSql() throws Exception {
        EntityGraph graph = EmpresaRepository.class
                .getMethod("buscarDetalhada", UUID.class)
                .getAnnotation(EntityGraph.class);

        assertThat(Arrays.asList(graph.attributePaths()))
                .contains("estabelecimentos", "tags")
                .doesNotContain("estabelecimentos.inscricoes");
    }
}
