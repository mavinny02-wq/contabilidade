package br.com.contabilidade.certidao.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Porta de leitura dos dados de Empresa necessários aos fluxos de certidão.
 */
public interface EmpresaCertidaoConsulta {

    Optional<EmpresaCertidaoProjecao> buscarEmpresa(UUID empresaId);

    Optional<EstabelecimentoCertidaoProjecao> buscarEstabelecimento(UUID estabelecimentoId);

    List<EmpresaCertidaoProjecao> listarEmpresasAtivas();

    List<EstabelecimentoCertidaoProjecao> listarEstabelecimentos();

    List<UUID> buscarPrimeirosIdsAtivos(int limite);

    List<UUID> buscarIdsAtivosApos(UUID cursor, int limite);

    record EmpresaCertidaoProjecao(
            UUID id,
            List<EstabelecimentoCertidaoProjecao> estabelecimentos
    ) {
    }

    record EstabelecimentoCertidaoProjecao(
            UUID id,
            String cnpj,
            String uf,
            boolean matriz,
            boolean ativo
    ) {
    }
}
