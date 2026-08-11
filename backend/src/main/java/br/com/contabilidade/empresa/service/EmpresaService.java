package br.com.contabilidade.empresa.service;

import br.com.contabilidade.certidao.service.CertidaoEstabelecimentoLifecycleService;
import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import br.com.contabilidade.empresa.api.EmpresaDetalheResponse;
import br.com.contabilidade.empresa.api.EmpresaRequest;
import br.com.contabilidade.empresa.api.EmpresaResumoResponse;
import br.com.contabilidade.empresa.api.EstabelecimentoResponse;
import br.com.contabilidade.empresa.api.FilialAtualizacaoRequest;
import br.com.contabilidade.empresa.api.FilialRequest;
import br.com.contabilidade.empresa.domain.Cnpj;
import br.com.contabilidade.empresa.domain.Empresa;
import br.com.contabilidade.empresa.domain.Estabelecimento;
import br.com.contabilidade.empresa.domain.TipoInscricaoTributaria;
import br.com.contabilidade.empresa.repository.EmpresaRepository;
import br.com.contabilidade.empresa.repository.EstabelecimentoRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmpresaService {

    private final EmpresaRepository empresaRepository;
    private final EstabelecimentoRepository estabelecimentoRepository;
    private final EmpresaMapper mapper;
    private final AuditoriaService auditoriaService;
    private final CertidaoEstabelecimentoLifecycleService certidaoLifecycleService;

    public EmpresaService(EmpresaRepository empresaRepository,
                          EstabelecimentoRepository estabelecimentoRepository,
                          EmpresaMapper mapper,
                          AuditoriaService auditoriaService,
                          CertidaoEstabelecimentoLifecycleService certidaoLifecycleService) {
        this.empresaRepository = empresaRepository;
        this.estabelecimentoRepository = estabelecimentoRepository;
        this.mapper = mapper;
        this.auditoriaService = auditoriaService;
        this.certidaoLifecycleService = certidaoLifecycleService;
    }

    @Transactional(readOnly = true)
    public Page<EmpresaResumoResponse> listar(String termo, int pagina, int tamanho) {
        String termoLimpo = termo == null || termo.isBlank() ? null : termo.trim();
        String termoNumerico = termoLimpo == null ? "" : termoLimpo.replaceAll("\\D", "");
        return empresaRepository.buscar(
                termoLimpo,
                termoNumerico,
                PageRequest.of(Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), 100),
                        Sort.by("razaoSocial").ascending())
        ).map(mapper::resumo);
    }

    @Transactional(readOnly = true)
    public EmpresaDetalheResponse obter(UUID id) {
        return mapper.detalhe(buscar(id));
    }

    @Transactional
    public EmpresaDetalheResponse criar(EmpresaRequest request) {
        String cnpj = Cnpj.normalizarEValidar(request.cnpj());
        validarCnpjDisponivel(cnpj, null);

        Empresa empresa = new Empresa(request.razaoSocial(), request.nomeFantasia(),
                request.responsavelNome(), request.responsavelEmail());
        empresa.atualizarClassificacao(request.grupo(), request.tags());
        Estabelecimento matriz = criarEstabelecimento(cnpj, true, request.status(), request.cnaePrincipal(),
                request.regimeTributario(), request.inscricaoEstadual(), request.inscricaoMunicipal(),
                request.logradouro(), request.numero(), request.complemento(), request.bairro(),
                request.municipio(), request.uf(), request.cep());
        empresa.adicionarEstabelecimento(matriz);
        Empresa salva = empresaRepository.saveAndFlush(empresa);
        certidaoLifecycleService.sincronizar(matriz);
        auditoriaService.registrar("EMPRESA_CRIADA", "EMPRESA", salva.getId(),
                classificacaoAuditavel(cnpj, salva));
        return mapper.detalhe(salva);
    }

    @Transactional
    public EmpresaDetalheResponse atualizar(UUID id, EmpresaRequest request) {
        Empresa empresa = buscar(id);
        Estabelecimento matriz = empresa.matriz();
        if (matriz == null) {
            throw new ExcecaoNegocio("EMPRESA_SEM_MATRIZ", "erros.empresaSemEstabelecimento", HttpStatus.CONFLICT);
        }
        String cnpj = Cnpj.normalizarEValidar(request.cnpj());
        if (!matriz.getCnpj().equals(cnpj)) {
            throw new ExcecaoNegocio("ALTERACAO_CNPJ_NAO_PERMITIDA", "erros.alteracaoCnpjNaoPermitida",
                    HttpStatus.CONFLICT);
        }
        empresa.atualizarDados(request.razaoSocial(), request.nomeFantasia(),
                request.responsavelNome(), request.responsavelEmail());
        empresa.atualizarClassificacao(request.grupo(), request.tags());
        atualizarEstabelecimento(matriz, request.status(), request.cnaePrincipal(), request.regimeTributario(),
                request.inscricaoEstadual(), request.inscricaoMunicipal(), request.logradouro(), request.numero(),
                request.complemento(), request.bairro(), request.municipio(), request.uf(), request.cep());
        certidaoLifecycleService.sincronizar(matriz);
        auditoriaService.registrar("EMPRESA_ATUALIZADA", "EMPRESA", id,
                classificacaoAuditavel(cnpj, empresa));
        return mapper.detalhe(empresaRepository.save(empresa));
    }

    @Transactional
    public EstabelecimentoResponse adicionarFilial(UUID empresaId, FilialRequest request) {
        Empresa empresa = buscar(empresaId);
        String cnpj = Cnpj.normalizarEValidar(request.cnpj());
        validarCnpjDisponivel(cnpj, null);
        Estabelecimento filial = criarEstabelecimento(cnpj, false, request.status(), request.cnaePrincipal(),
                request.regimeTributario(), request.inscricaoEstadual(), request.inscricaoMunicipal(),
                request.logradouro(), request.numero(), request.complemento(), request.bairro(),
                request.municipio(), request.uf(), request.cep());
        empresa.adicionarEstabelecimento(filial);
        empresaRepository.saveAndFlush(empresa);
        certidaoLifecycleService.sincronizar(filial);
        auditoriaService.registrar("FILIAL_ADICIONADA", "ESTABELECIMENTO", filial.getId(),
                Map.of("empresaId", empresaId, "cnpj", cnpj));
        return mapper.estabelecimento(filial);
    }

    @Transactional
    public EstabelecimentoResponse atualizarFilial(
            UUID empresaId,
            UUID filialId,
            FilialAtualizacaoRequest request
    ) {
        Empresa empresa = buscar(empresaId);
        Estabelecimento filial = buscarFilial(empresa, filialId);
        String cnpj = Cnpj.normalizarEValidar(request.cnpj());
        if (!filial.getCnpj().equals(cnpj)) {
            throw new ExcecaoNegocio(
                    "ALTERACAO_CNPJ_FILIAL_NAO_PERMITIDA",
                    "erros.alteracaoCnpjFilialNaoPermitida",
                    HttpStatus.CONFLICT
            );
        }

        boolean ativaAnterior = filial.isAtivo();
        atualizarEstabelecimento(filial, request.status(), request.cnaePrincipal(),
                request.regimeTributario(), request.inscricaoEstadual(), request.inscricaoMunicipal(),
                request.logradouro(), request.numero(), request.complemento(), request.bairro(),
                request.municipio(), request.uf(), request.cep());
        if (request.ativa()) {
            filial.ativar();
        } else {
            filial.inativar();
        }

        certidaoLifecycleService.sincronizar(filial);
        auditoriaService.registrar(
                ativaAnterior == filial.isAtivo()
                        ? "FILIAL_ATUALIZADA"
                        : filial.isAtivo() ? "FILIAL_ATIVADA" : "FILIAL_INATIVADA",
                "ESTABELECIMENTO",
                filial.getId(),
                Map.of("empresaId", empresaId, "cnpj", cnpj, "ativa", filial.isAtivo())
        );
        return mapper.estabelecimento(filial);
    }

    @Transactional
    public void alterarAtiva(UUID id, boolean ativa) {
        Empresa empresa = buscar(id);
        if (ativa) empresa.ativar(); else empresa.inativar();
        empresa.getEstabelecimentos().forEach(certidaoLifecycleService::sincronizar);
        auditoriaService.registrar(ativa ? "EMPRESA_ATIVADA" : "EMPRESA_INATIVADA", "EMPRESA", id, Map.of());
    }

    @Transactional(readOnly = true)
    public long contarAtivas() {
        return empresaRepository.countByAtivaTrue();
    }

    private Empresa buscar(UUID id) {
        return empresaRepository.buscarDetalhada(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "EMPRESA_NAO_ENCONTRADA", "erros.empresaNaoEncontrada"));
    }

    private Estabelecimento buscarFilial(Empresa empresa, UUID filialId) {
        return empresa.getEstabelecimentos().stream()
                .filter(item -> item.getId().equals(filialId) && !item.isMatriz())
                .findFirst()
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "FILIAL_NAO_ENCONTRADA", "erros.filialNaoEncontrada"));
    }

    private void validarCnpjDisponivel(String cnpj, UUID estabelecimentoIdIgnorado) {
        estabelecimentoRepository.findByCnpj(cnpj)
                .filter(item -> estabelecimentoIdIgnorado == null || !item.getId().equals(estabelecimentoIdIgnorado))
                .ifPresent(item -> { throw new ExcecaoNegocio(
                        "CNPJ_JA_CADASTRADO", "erros.cnpjJaCadastrado", HttpStatus.CONFLICT); });
    }

    private Estabelecimento criarEstabelecimento(String cnpj, boolean matriz,
            br.com.contabilidade.empresa.domain.StatusEmpresa status, String cnae,
            br.com.contabilidade.empresa.domain.RegimeTributario regime, String ie, String im,
            String logradouro, String numero, String complemento, String bairro,
            String municipio, String uf, String cep) {
        Estabelecimento estabelecimento = new Estabelecimento(cnpj, matriz, status, cnae, regime);
        atualizarEstabelecimento(estabelecimento, status, cnae, regime, ie, im,
                logradouro, numero, complemento, bairro, municipio, uf, cep);
        return estabelecimento;
    }

    private void atualizarEstabelecimento(Estabelecimento estabelecimento,
            br.com.contabilidade.empresa.domain.StatusEmpresa status, String cnae,
            br.com.contabilidade.empresa.domain.RegimeTributario regime, String ie, String im,
            String logradouro, String numero, String complemento, String bairro,
            String municipio, String uf, String cep) {
        estabelecimento.atualizar(status, cnae, regime, logradouro, numero, complemento,
                bairro, municipio, uf, cep);
        estabelecimento.definirInscricao(TipoInscricaoTributaria.ESTADUAL, ie, uf, null);
        estabelecimento.definirInscricao(TipoInscricaoTributaria.MUNICIPAL, im, null, municipio);
    }

    private Map<String, Object> classificacaoAuditavel(String cnpj, Empresa empresa) {
        Map<String, Object> detalhes = new LinkedHashMap<>();
        detalhes.put("cnpj", cnpj);
        detalhes.put("grupoInformado", empresa.getGrupo() != null);
        detalhes.put("quantidadeTags", empresa.getTags().size());
        return detalhes;
    }
}
