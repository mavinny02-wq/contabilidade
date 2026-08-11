package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FaturaProvedorService {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private static final BigDecimal TOLERANCIA = new BigDecimal("0.0100");

    private final FaturaProvedorRepository repository;
    private final DefinicaoProvedorRepository provedorRepository;
    private final NamedParameterJdbcTemplate jdbc;
    private final AuditoriaService auditoriaService;

    public FaturaProvedorService(
            FaturaProvedorRepository repository,
            DefinicaoProvedorRepository provedorRepository,
            NamedParameterJdbcTemplate jdbc,
            AuditoriaService auditoriaService
    ) {
        this.repository = repository;
        this.provedorRepository = provedorRepository;
        this.jdbc = jdbc;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public Page<FaturaProvedorResponse> listar(String provedorCodigo, int pagina, int tamanho) {
        PageRequest pageable = PageRequest.of(
                Math.max(pagina, 0),
                Math.min(Math.max(tamanho, 1), 100)
        );
        String codigo = limpar(provedorCodigo);
        Page<FaturaProvedor> faturas = codigo == null
                ? repository.findAllByOrderByCompetenciaInicioDescProvedorCodigoAsc(pageable)
                : repository.findByProvedorCodigoOrderByCompetenciaInicioDesc(codigo, pageable);
        return faturas.map(this::response);
    }

    @Transactional
    public FaturaProvedorResponse salvar(FaturaProvedorRequest request) {
        String codigo = limpar(request.provedorCodigo());
        if (codigo == null || provedorRepository.findByCodigo(codigo).isEmpty()) {
            throw new RecursoNaoEncontradoException("PROVEDOR_NAO_ENCONTRADO", "erros.provedorNaoEncontrado");
        }
        validarPeriodo(request.competenciaInicio(), request.competenciaFim());
        String moeda = request.moeda().trim().toUpperCase(Locale.ROOT);

        FaturaProvedor fatura = repository
                .findByProvedorCodigoAndCompetenciaInicioAndCompetenciaFimAndMoeda(
                        codigo,
                        request.competenciaInicio(),
                        request.competenciaFim(),
                        moeda
                )
                .orElseGet(() -> new FaturaProvedor(
                        codigo,
                        request.competenciaInicio(),
                        request.competenciaFim(),
                        moeda
                ));
        fatura.atualizar(request.valorFaturado(), request.referencia(), request.observacao());
        FaturaProvedorResponse response = response(repository.save(fatura));

        auditoriaService.registrar(
                "FATURA_PROVEDOR_RECONCILIADA",
                "PROVEDOR",
                fatura.getId(),
                Map.of(
                        "provedorCodigo", codigo,
                        "competenciaInicio", request.competenciaInicio().toString(),
                        "competenciaFim", request.competenciaFim().toString(),
                        "moeda", moeda,
                        "divergente", response.situacao() != FaturaProvedorResponse.SituacaoReconciliacao.SEM_DIVERGENCIA
                )
        );
        return response;
    }

    private FaturaProvedorResponse response(FaturaProvedor fatura) {
        BigDecimal estimado = custoEstimado(fatura).setScale(4, RoundingMode.HALF_UP);
        BigDecimal faturado = fatura.getValorFaturado().setScale(4, RoundingMode.HALF_UP);
        BigDecimal diferenca = faturado.subtract(estimado).setScale(4, RoundingMode.HALF_UP);
        FaturaProvedorResponse.SituacaoReconciliacao situacao = diferenca.abs().compareTo(TOLERANCIA) <= 0
                ? FaturaProvedorResponse.SituacaoReconciliacao.SEM_DIVERGENCIA
                : diferenca.signum() > 0
                        ? FaturaProvedorResponse.SituacaoReconciliacao.ACIMA_ESTIMADO
                        : FaturaProvedorResponse.SituacaoReconciliacao.ABAIXO_ESTIMADO;
        return new FaturaProvedorResponse(
                fatura.getId(),
                fatura.getProvedorCodigo(),
                fatura.getCompetenciaInicio(),
                fatura.getCompetenciaFim(),
                fatura.getMoeda(),
                faturado,
                estimado,
                diferenca,
                situacao,
                fatura.getReferencia(),
                fatura.getObservacao(),
                fatura.getAtualizadoEm()
        );
    }

    private BigDecimal custoEstimado(FaturaProvedor fatura) {
        String sql = """
                SELECT COALESCE(SUM(custo_estimado), 0)
                  FROM execucoes_integracao
                 WHERE provedor_codigo = :provedor
                   AND moeda = :moeda
                   AND criado_em >= :inicio
                   AND criado_em < :fim
                """;
        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("provedor", fatura.getProvedorCodigo())
                .addValue("moeda", fatura.getMoeda())
                .addValue("inicio", Timestamp.from(fatura.getCompetenciaInicio().atStartOfDay(FUSO).toInstant()))
                .addValue("fim", Timestamp.from(fatura.getCompetenciaFim().plusDays(1).atStartOfDay(FUSO).toInstant()));
        BigDecimal valor = jdbc.queryForObject(sql, parametros, BigDecimal.class);
        return valor == null ? BigDecimal.ZERO : valor;
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (fim.isBefore(inicio)) {
            throw new ExcecaoNegocio(
                    "PERIODO_FATURA_INVALIDO",
                    "erros.periodoFaturaProvedorInvalido",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (ChronoUnit.DAYS.between(inicio, fim) > 366) {
            throw new ExcecaoNegocio(
                    "PERIODO_FATURA_EXCEDIDO",
                    "erros.periodoFaturaProvedorExcedido",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private String limpar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
