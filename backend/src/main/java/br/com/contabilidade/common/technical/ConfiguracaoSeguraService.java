package br.com.contabilidade.common.technical;

import br.com.contabilidade.common.integration.DefinicaoProvedor;
import br.com.contabilidade.common.integration.DefinicaoProvedorRepository;
import br.com.contabilidade.common.integration.TipoProvedor;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoSeguraService {

    private final DefinicaoProvedorRepository provedorRepository;
    private final String ambiente;
    private final String versao;
    private final boolean segurancaHabilitada;
    private final String storageProvider;
    private final String workerToken;
    private final String segredoSessao;
    private final String ticketTtl;

    public ConfiguracaoSeguraService(
            DefinicaoProvedorRepository provedorRepository,
            @Value("${app.environment:LOCAL}") String ambiente,
            @Value("${app.version:0.5.1}") String versao,
            @Value("${app.security.enabled:false}") boolean segurancaHabilitada,
            @Value("${app.storage.provider:local}") String storageProvider,
            @Value("${app.worker.token:token-local-altere}") String workerToken,
            @Value("${app.automation.session.signing-secret:local-session-signing-secret-altere-1234567890}") String segredoSessao,
            @Value("${app.automation.session.ticket-ttl:PT15M}") String ticketTtl
    ) {
        this.provedorRepository = provedorRepository;
        this.ambiente = seguro(ambiente, "NAO_INFORMADO", 60);
        this.versao = seguro(versao, "NAO_INFORMADA", 40);
        this.segurancaHabilitada = segurancaHabilitada;
        this.storageProvider = seguro(storageProvider, "NAO_INFORMADO", 40);
        this.workerToken = workerToken;
        this.segredoSessao = segredoSessao;
        this.ticketTtl = seguro(ticketTtl, "NAO_INFORMADO", 40);
    }

    @Transactional(readOnly = true)
    public ConfiguracaoSeguraResponse consultar() {
        List<DefinicaoProvedor> definicoes = provedorRepository.findAllByOrderByPrioridadeAscNomeAsc();
        List<ConfiguracaoSeguraResponse.Aviso> avisos = new ArrayList<>();
        boolean workerTokenConfigurado = segredoAdequado(workerToken, 20);
        boolean segredoSessaoConfigurado = segredoAdequado(segredoSessao, 32);

        if (!segurancaHabilitada) {
            avisos.add(aviso("SEGURANCA_DESABILITADA", "APLICACAO"));
        }
        if (!workerTokenConfigurado) {
            avisos.add(aviso("WORKER_TOKEN_PADRAO_OU_AUSENTE", "AUTOMATION_WORKER"));
        }
        if (!segredoSessaoConfigurado) {
            avisos.add(aviso("SEGREDO_SESSAO_PADRAO_OU_AUSENTE", "SESSAO_INTERATIVA"));
        }
        if (storageProvider.equalsIgnoreCase("local") && !ambiente.equalsIgnoreCase("LOCAL")) {
            avisos.add(aviso("STORAGE_LOCAL_EM_AMBIENTE_NAO_LOCAL", "DOCUMENTOS"));
        }

        List<ConfiguracaoSeguraResponse.Provedor> provedores = definicoes.stream()
                .map(definicao -> mapear(definicao, avisos))
                .toList();
        int habilitados = (int) definicoes.stream().filter(DefinicaoProvedor::isHabilitado).count();
        int pagosHabilitados = (int) definicoes.stream()
                .filter(item -> item.isHabilitado() && item.isPago())
                .count();

        return new ConfiguracaoSeguraResponse(
                Instant.now(),
                avisos.isEmpty() ? "SAUDAVEL" : "DEGRADADO",
                ambiente,
                versao,
                segurancaHabilitada,
                storageProvider,
                workerTokenConfigurado,
                segredoSessaoConfigurado,
                ticketTtl,
                definicoes.size(),
                habilitados,
                pagosHabilitados,
                avisos,
                provedores
        );
    }

    private ConfiguracaoSeguraResponse.Provedor mapear(
            DefinicaoProvedor definicao,
            List<ConfiguracaoSeguraResponse.Aviso> avisos
    ) {
        boolean baseConfigurada = temTexto(definicao.getBaseUrl());
        boolean referenciaSegredo = temTexto(definicao.getReferenciaSegredo());
        boolean custoConfigurado = definicao.getCustoEstimadoPadrao() != null
                && definicao.getCustoEstimadoPadrao().signum() >= 0;
        boolean moedaConfigurada = definicao.getMoeda() != null
                && definicao.getMoeda().matches("^[A-Z]{3}$");

        if (definicao.isHabilitado()) {
            if (exigeBaseUrl(definicao.getTipo()) && !baseConfigurada) {
                avisos.add(aviso("PROVEDOR_HABILITADO_SEM_BASE_URL", definicao.getCodigo()));
            }
            if (exigeSegredo(definicao.getTipo()) && !referenciaSegredo) {
                avisos.add(aviso("PROVEDOR_API_SEM_REFERENCIA_SEGREDO", definicao.getCodigo()));
            }
            if (definicao.isPago() && !custoConfigurado) {
                avisos.add(aviso("PROVEDOR_PAGO_SEM_CUSTO", definicao.getCodigo()));
            }
            if (definicao.isPago() && !moedaConfigurada) {
                avisos.add(aviso("PROVEDOR_PAGO_SEM_MOEDA", definicao.getCodigo()));
            }
        }

        return new ConfiguracaoSeguraResponse.Provedor(
                seguro(definicao.getCodigo(), "SEM_CODIGO", 100),
                seguro(definicao.getNome(), "Sem nome", 160),
                definicao.getTipo(),
                definicao.isHabilitado(),
                definicao.isPago(),
                baseConfigurada,
                referenciaSegredo,
                custoConfigurado,
                moedaConfigurada,
                definicao.getTimeoutSegundos(),
                definicao.getMaxRetries()
        );
    }

    private boolean exigeBaseUrl(TipoProvedor tipo) {
        return tipo != TipoProvedor.MANUAL;
    }

    private boolean exigeSegredo(TipoProvedor tipo) {
        return tipo == TipoProvedor.API_OFICIAL || tipo == TipoProvedor.API_COMERCIAL;
    }

    private boolean segredoAdequado(String valor, int tamanhoMinimo) {
        if (!temTexto(valor) || valor.trim().length() < tamanhoMinimo) return false;
        String normalizado = valor.trim().toLowerCase(Locale.ROOT);
        return !normalizado.contains("altere")
                && !normalizado.contains("change-me")
                && !normalizado.contains("changeme")
                && !normalizado.startsWith("token-local")
                && !normalizado.startsWith("local-session-signing-secret");
    }

    private ConfiguracaoSeguraResponse.Aviso aviso(String codigo, String componente) {
        return new ConfiguracaoSeguraResponse.Aviso(
                seguro(codigo, "AVISO_CONFIGURACAO", 100),
                seguro(componente, "APLICACAO", 100)
        );
    }

    private boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private String seguro(String valor, String padrao, int limite) {
        String limpo = temTexto(valor) ? valor.trim() : padrao;
        return limpo.length() <= limite ? limpo : limpo.substring(0, limite);
    }
}
