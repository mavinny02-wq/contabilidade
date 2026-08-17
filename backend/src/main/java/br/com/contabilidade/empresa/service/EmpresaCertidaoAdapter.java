package br.com.contabilidade.empresa.service;

import br.com.contabilidade.certidao.service.EmpresaCertidaoConsulta;
import br.com.contabilidade.empresa.domain.Empresa;
import br.com.contabilidade.empresa.domain.Estabelecimento;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import br.com.contabilidade.empresa.repository.EstabelecimentoRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

@Component
public class EmpresaCertidaoAdapter implements EmpresaCertidaoConsulta {

    private final EmpresaRepository empresaRepository;
    private final EstabelecimentoRepository estabelecimentoRepository;

    public EmpresaCertidaoAdapter(
            EmpresaRepository empresaRepository,
            EstabelecimentoRepository estabelecimentoRepository
    ) {
        this.empresaRepository = empresaRepository;
        this.estabelecimentoRepository = estabelecimentoRepository;
    }

    @Override
    public Optional<EmpresaCertidaoProjecao> buscarEmpresa(UUID empresaId) {
        return empresaRepository.buscarDetalhada(empresaId).map(this::projetar);
    }

    @Override
    public Optional<EstabelecimentoCertidaoProjecao> buscarEstabelecimento(UUID estabelecimentoId) {
        return estabelecimentoRepository.findById(estabelecimentoId).map(this::projetar);
    }

    @Override
    public List<EmpresaCertidaoProjecao> listarEmpresasAtivas() {
        return empresaRepository.findByAtivaTrueOrderByRazaoSocialAsc().stream()
                .map(this::projetar)
                .toList();
    }

    @Override
    public List<EstabelecimentoCertidaoProjecao> listarEstabelecimentos() {
        return estabelecimentoRepository.findAll().stream().map(this::projetar).toList();
    }

    @Override
    public List<UUID> buscarPrimeirosIdsAtivos(int limite) {
        return empresaRepository.buscarPrimeirosIdsAtivos(PageRequest.of(0, limite));
    }

    @Override
    public List<UUID> buscarIdsAtivosApos(UUID cursor, int limite) {
        return empresaRepository.buscarIdsAtivosApos(cursor, PageRequest.of(0, limite));
    }

    private EmpresaCertidaoProjecao projetar(Empresa empresa) {
        return new EmpresaCertidaoProjecao(
                empresa.getId(),
                empresa.getEstabelecimentos().stream().map(this::projetar).toList()
        );
    }

    private EstabelecimentoCertidaoProjecao projetar(Estabelecimento estabelecimento) {
        return new EstabelecimentoCertidaoProjecao(
                estabelecimento.getId(),
                estabelecimento.getCnpj(),
                estabelecimento.getUf(),
                estabelecimento.isMatriz(),
                estabelecimento.isAtivo()
        );
    }
}
