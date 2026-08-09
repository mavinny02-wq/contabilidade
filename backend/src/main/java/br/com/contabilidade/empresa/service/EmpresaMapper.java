package br.com.contabilidade.empresa.service;

import br.com.contabilidade.empresa.api.EmpresaDetalheResponse;
import br.com.contabilidade.empresa.api.EmpresaResumoResponse;
import br.com.contabilidade.empresa.api.EstabelecimentoResponse;
import br.com.contabilidade.empresa.domain.Empresa;
import br.com.contabilidade.empresa.domain.Estabelecimento;
import br.com.contabilidade.empresa.domain.TipoInscricaoTributaria;
import org.springframework.stereotype.Component;

@Component
public class EmpresaMapper {

    public EmpresaResumoResponse resumo(Empresa empresa) {
        Estabelecimento matriz = empresa.matriz();
        return new EmpresaResumoResponse(
                empresa.getId(),
                empresa.getRazaoSocial(),
                empresa.getNomeFantasia(),
                matriz == null ? null : matriz.getCnpj(),
                matriz == null ? null : matriz.getStatus(),
                matriz == null ? null : matriz.getRegimeTributario(),
                matriz == null ? null : matriz.getMunicipio(),
                matriz == null ? null : matriz.getUf(),
                empresa.isAtiva(),
                empresa.getEstabelecimentos().size(),
                empresa.getAtualizadoEm()
        );
    }

    public EmpresaDetalheResponse detalhe(Empresa empresa) {
        return new EmpresaDetalheResponse(
                empresa.getId(),
                empresa.getRazaoSocial(),
                empresa.getNomeFantasia(),
                empresa.isAtiva(),
                empresa.getResponsavelNome(),
                empresa.getResponsavelEmail(),
                empresa.getEstabelecimentos().stream().map(this::estabelecimento).toList(),
                empresa.getCriadoEm(),
                empresa.getAtualizadoEm()
        );
    }

    public EstabelecimentoResponse estabelecimento(Estabelecimento estabelecimento) {
        return new EstabelecimentoResponse(
                estabelecimento.getId(),
                estabelecimento.getCnpj(),
                estabelecimento.isMatriz(),
                estabelecimento.isAtivo(),
                estabelecimento.getStatus(),
                estabelecimento.getCnaePrincipal(),
                estabelecimento.getRegimeTributario(),
                estabelecimento.inscricao(TipoInscricaoTributaria.ESTADUAL),
                estabelecimento.inscricao(TipoInscricaoTributaria.MUNICIPAL),
                estabelecimento.getLogradouro(),
                estabelecimento.getNumero(),
                estabelecimento.getComplemento(),
                estabelecimento.getBairro(),
                estabelecimento.getMunicipio(),
                estabelecimento.getUf(),
                estabelecimento.getCep()
        );
    }
}
