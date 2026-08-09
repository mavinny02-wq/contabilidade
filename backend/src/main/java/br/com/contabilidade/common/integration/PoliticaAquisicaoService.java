package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PoliticaAquisicaoService {

    private final PoliticaAquisicaoRepository repository;
    private final DefinicaoProvedorRepository provedorRepository;
    private final ObjectMapper objectMapper;

    public PoliticaAquisicaoService(PoliticaAquisicaoRepository repository,
                                    DefinicaoProvedorRepository provedorRepository,
                                    ObjectMapper objectMapper) {
        this.repository = repository;
        this.provedorRepository = provedorRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PoliticaResolvida resolver(String operacao) {
        PoliticaAquisicao politica = repository.findByOperacao(operacao)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "POLITICA_NAO_ENCONTRADA", "erros.politicaNaoEncontrada"));
        if (!politica.isHabilitada()) {
            throw new ExcecaoNegocio("POLITICA_DESABILITADA", "erros.politicaDesabilitada",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        List<String> codigos = normalizarCodigos(lerCodigos(politica.getProvedoresJson()));
        List<DefinicaoProvedor> candidatos = new ArrayList<>();
        for (int indiceConfigurado = 0; indiceConfigurado < codigos.size(); indiceConfigurado++) {
            String codigo = codigos.get(indiceConfigurado);
            DefinicaoProvedor provedor = provedorRepository.findByCodigo(codigo).orElse(null);
            if (provedor == null || !provedor.isHabilitado()) continue;
            if (!politica.isPermitirIntervencao()
                    && (provedor.getTipo() == TipoProvedor.MANUAL
                    || provedor.getTipo() == TipoProvedor.PORTAL_ASSISTIDO)) {
                continue;
            }
            if (!custoPermitido(provedor, politica)) continue;

            boolean pagoComoPrimarioExplicito = provedor.isPago() && indiceConfigurado == 0;
            if (provedor.isPago() && !pagoComoPrimarioExplicito && !politica.isFallbackPago()) {
                continue;
            }
            candidatos.add(provedor);
        }
        if (candidatos.isEmpty()) {
            throw new ExcecaoNegocio("SEM_PROVEDOR_DISPONIVEL", "erros.semProvedorDisponivel",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return new PoliticaResolvida(politica, candidatos);
    }

    @Transactional
    public PoliticaAquisicao atualizar(String operacao, List<String> provedores,
                                       boolean permitirIntervencao, int timeoutHumanoMinutos,
                                       boolean fallbackPago, BigDecimal custoMaximo,
                                       String moeda, boolean habilitada) {
        List<String> codigosNormalizados = normalizarCodigos(provedores);
        validarProvedores(codigosNormalizados);
        if (custoMaximo != null && (moeda == null || moeda.isBlank())) {
            throw new ExcecaoNegocio(
                    "MOEDA_CUSTO_OBRIGATORIA",
                    "erros.moedaCustoObrigatoria",
                    HttpStatus.BAD_REQUEST
            );
        }
        PoliticaAquisicao politica = repository.findByOperacao(operacao)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "POLITICA_NAO_ENCONTRADA", "erros.politicaNaoEncontrada"));
        politica.atualizar(escreverCodigos(codigosNormalizados), permitirIntervencao,
                timeoutHumanoMinutos, fallbackPago, custoMaximo, moeda, habilitada);
        return politica;
    }

    public List<String> lerCodigos(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() { });
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Política possui JSON inválido", exception);
        }
    }

    private String escreverCodigos(List<String> provedores) {
        try {
            return objectMapper.writeValueAsString(provedores);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível persistir a política", exception);
        }
    }

    private void validarProvedores(List<String> provedores) {
        if (provedores == null || provedores.isEmpty()) {
            throw new ExcecaoNegocio("POLITICA_SEM_PROVEDOR", "erros.politicaSemProvedor",
                    HttpStatus.BAD_REQUEST);
        }
        if (provedores.size() > 20) {
            throw new ExcecaoNegocio(
                    "POLITICA_PROVEDORES_EXCEDIDOS",
                    "erros.politicaProvedoresExcedidos",
                    HttpStatus.BAD_REQUEST
            );
        }
        for (String codigo : provedores) {
            if (provedorRepository.findByCodigo(codigo).isEmpty()) {
                throw new ExcecaoNegocio("PROVEDOR_NAO_ENCONTRADO", "erros.provedorNaoEncontrado",
                        HttpStatus.BAD_REQUEST);
            }
        }
    }

    private List<String> normalizarCodigos(List<String> provedores) {
        if (provedores == null) return List.of();
        LinkedHashSet<String> unicos = new LinkedHashSet<>();
        for (String codigo : provedores) {
            if (codigo == null || codigo.isBlank()) {
                throw new ExcecaoNegocio(
                        "PROVEDOR_INVALIDO",
                        "erros.provedorInvalido",
                        HttpStatus.BAD_REQUEST
                );
            }
            String normalizado = codigo.trim().toUpperCase(Locale.ROOT);
            if (normalizado.length() > 100) {
                throw new ExcecaoNegocio(
                        "PROVEDOR_INVALIDO",
                        "erros.provedorInvalido",
                        HttpStatus.BAD_REQUEST
                );
            }
            unicos.add(normalizado);
        }
        return List.copyOf(unicos);
    }

    private boolean custoPermitido(DefinicaoProvedor provedor, PoliticaAquisicao politica) {
        if (!provedor.isPago()) return true;
        if (politica.getCustoMaximo() == null) return true;
        if (provedor.getCustoEstimadoPadrao() == null) return false;
        if (politica.getMoeda() != null
                && provedor.getMoeda() != null
                && !politica.getMoeda().equalsIgnoreCase(provedor.getMoeda())) {
            return false;
        }
        return provedor.getCustoEstimadoPadrao().compareTo(politica.getCustoMaximo()) <= 0;
    }

    public record PoliticaResolvida(PoliticaAquisicao politica,
                                    List<DefinicaoProvedor> provedores) {
        public DefinicaoProvedor primario() { return provedores.getFirst(); }
    }
}
