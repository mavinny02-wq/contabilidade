package br.com.contabilidade.common.integration;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProvedorHistoricoService {

    private static final ZoneId ZONA_NEGOCIO = ZoneId.of("America/Sao_Paulo");
    private static final int MAXIMO_DIAS = 366;

    private final NamedParameterJdbcTemplate jdbc;
    private final int maximoProvedores;

    public ProvedorHistoricoService(
            NamedParameterJdbcTemplate jdbc,
            @Value("${app.integration.history-max-providers:100}") int maximoProvedores
    ) {
        this.jdbc = jdbc;
        this.maximoProvedores = Math.min(Math.max(maximoProvedores, 1), 1_000);
    }

    @Transactional(readOnly = true)
    public ProvedorHistoricoResponse consultar(LocalDate inicioInformado, LocalDate fimInformado) {
        LocalDate hoje = LocalDate.now(ZONA_NEGOCIO);
        LocalDate inicioData = inicioInformado == null ? hoje.minusDays(29) : inicioInformado;
        LocalDate fimData = fimInformado == null ? hoje : fimInformado;
        validarPeriodo(inicioData, fimData);

        Instant inicio = inicioData.atStartOfDay(ZONA_NEGOCIO).toInstant();
        Instant fimExclusivo = fimData.plusDays(1).atStartOfDay(ZONA_NEGOCIO).toInstant();
        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("inicio", parametroTemporal(inicio))
                .addValue("fim", parametroTemporal(fimExclusivo))
                .addValue("limite", maximoProvedores);

        long totalExecucoes = numero("""
                select count(*)
                  from execucoes_integracao
                 where criado_em >= :inicio
                   and criado_em < :fim
                """, parametros);
        long totalProvedores = numero("""
                select count(distinct coalesce(nullif(provedor_codigo, ''), 'SEM_PROVEDOR'))
                  from execucoes_integracao
                 where criado_em >= :inicio
                   and criado_em < :fim
                """, parametros);

        List<LinhaResumo> resumos = jdbc.query("""
                select coalesce(nullif(provedor_codigo, ''), 'SEM_PROVEDOR') as codigo,
                       count(*) as total,
                       count(*) filter (where status = 'SUCESSO') as sucesso,
                       count(*) filter (where status = 'PARCIAL') as parcial,
                       count(*) filter (where status = 'FALHA') as falha,
                       count(*) filter (where status = 'FONTE_INDISPONIVEL') as fonte_indisponivel,
                       count(*) filter (where status = 'CANCELADO') as cancelada,
                       count(*) filter (where status not in (
                           'SUCESSO', 'PARCIAL', 'FALHA', 'FONTE_INDISPONIVEL', 'CANCELADO'
                       )) as aberta,
                       avg(
                           case
                             when iniciada_em is not null and finalizada_em is not null
                             then extract(epoch from (finalizada_em - iniciada_em))
                             else null
                           end
                       ) as duracao_media_segundos,
                       max(criado_em) as ultima_execucao_em
                  from execucoes_integracao
                 where criado_em >= :inicio
                   and criado_em < :fim
                 group by coalesce(nullif(provedor_codigo, ''), 'SEM_PROVEDOR')
                 order by count(*) desc, codigo asc
                 limit :limite
                """, parametros, this::mapearResumo);

        Map<String, List<ProvedorHistoricoResponse.Custo>> custos = carregarCustos(
                inicio,
                fimExclusivo,
                resumos.stream().map(LinhaResumo::codigo).toList()
        );
        List<ProvedorHistoricoResponse.Item> itens = new ArrayList<>(resumos.size());
        for (LinhaResumo resumo : resumos) {
            double taxa = resumo.total() == 0
                    ? 0.0
                    : Math.round((resumo.sucesso() * 10_000.0) / resumo.total()) / 100.0;
            itens.add(new ProvedorHistoricoResponse.Item(
                    resumo.codigo(),
                    resumo.total(),
                    resumo.sucesso(),
                    resumo.parcial(),
                    resumo.falha(),
                    resumo.fonteIndisponivel(),
                    resumo.cancelada(),
                    resumo.aberta(),
                    taxa,
                    resumo.duracaoMediaSegundos(),
                    resumo.ultimaExecucaoEm(),
                    custos.getOrDefault(resumo.codigo(), List.of())
            ));
        }

        return new ProvedorHistoricoResponse(
                inicio,
                fimExclusivo,
                totalExecucoes,
                totalProvedores,
                totalProvedores > itens.size(),
                itens
        );
    }

    private Map<String, List<ProvedorHistoricoResponse.Custo>> carregarCustos(
            Instant inicio,
            Instant fim,
            List<String> codigos
    ) {
        if (codigos.isEmpty()) return Map.of();
        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("inicio", parametroTemporal(inicio))
                .addValue("fim", parametroTemporal(fim))
                .addValue("codigos", codigos);
        Map<String, List<ProvedorHistoricoResponse.Custo>> porProvedor = new HashMap<>();
        jdbc.query("""
                select coalesce(nullif(provedor_codigo, ''), 'SEM_PROVEDOR') as codigo,
                       moeda,
                       sum(custo_estimado) as custo_total
                  from execucoes_integracao
                 where criado_em >= :inicio
                   and criado_em < :fim
                   and coalesce(nullif(provedor_codigo, ''), 'SEM_PROVEDOR') in (:codigos)
                   and custo_estimado is not null
                   and moeda is not null
                 group by coalesce(nullif(provedor_codigo, ''), 'SEM_PROVEDOR'), moeda
                 order by codigo asc, moeda asc
                """, parametros, resultSet -> {
            String codigo = resultSet.getString("codigo");
            porProvedor.computeIfAbsent(codigo, _key -> new ArrayList<>())
                    .add(new ProvedorHistoricoResponse.Custo(
                            resultSet.getString("moeda"),
                            resultSet.getBigDecimal("custo_total")
                    ));
        });
        porProvedor.replaceAll((_codigo, valores) -> List.copyOf(valores));
        return Map.copyOf(porProvedor);
    }

    private LinhaResumo mapearResumo(ResultSet resultSet, int _rowNum) throws SQLException {
        BigDecimal duracao = resultSet.getBigDecimal("duracao_media_segundos");
        var ultima = resultSet.getTimestamp("ultima_execucao_em");
        return new LinhaResumo(
                resultSet.getString("codigo"),
                resultSet.getLong("total"),
                resultSet.getLong("sucesso"),
                resultSet.getLong("parcial"),
                resultSet.getLong("falha"),
                resultSet.getLong("fonte_indisponivel"),
                resultSet.getLong("cancelada"),
                resultSet.getLong("aberta"),
                duracao == null ? null : duracao.doubleValue(),
                ultima == null ? null : ultima.toInstant()
        );
    }

    private long numero(String sql, MapSqlParameterSource parametros) {
        Long valor = jdbc.queryForObject(sql, parametros, Long.class);
        return valor == null ? 0L : valor;
    }

    static Timestamp parametroTemporal(Instant instante) {
        return Timestamp.from(instante);
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (fim.isBefore(inicio)) {
            throw new ExcecaoNegocio(
                    "PERIODO_HISTORICO_PROVEDORES_INVALIDO",
                    "erros.periodoHistoricoProvedoresInvalido",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (ChronoUnit.DAYS.between(inicio, fim) > MAXIMO_DIAS) {
            throw new ExcecaoNegocio(
                    "PERIODO_HISTORICO_PROVEDORES_EXCEDIDO",
                    "erros.periodoHistoricoProvedoresExcedido",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private record LinhaResumo(
            String codigo,
            long total,
            long sucesso,
            long parcial,
            long falha,
            long fonteIndisponivel,
            long cancelada,
            long aberta,
            Double duracaoMediaSegundos,
            Instant ultimaExecucaoEm
    ) {
    }
}
