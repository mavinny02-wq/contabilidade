package br.com.contabilidade.common.intervention;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessaoInterativaTicketConsumoService {

    private final SolicitacaoIntervencaoRepository intervencaoRepository;
    private final JdbcTemplate jdbcTemplate;

    public SessaoInterativaTicketConsumoService(
            SolicitacaoIntervencaoRepository intervencaoRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.intervencaoRepository = intervencaoRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void consumir(
            UUID jti,
            UUID sessaoId,
            UUID intervencaoId,
            UUID execucaoId,
            String usuario,
            Instant expiraEm,
            String workerId
    ) {
        Instant agora = Instant.now();
        if (!expiraEm.isAfter(agora)) {
            throw new ExcecaoNegocio(
                    "TICKET_SESSAO_EXPIRADO",
                    "erros.ticketSessaoExpirado",
                    HttpStatus.GONE
            );
        }

        SolicitacaoIntervencao intervencao = intervencaoRepository.findByIdForUpdate(intervencaoId)
                .orElseThrow(() -> new ExcecaoNegocio(
                        "INTERVENCAO_NAO_ENCONTRADA",
                        "erros.intervencaoNaoEncontrada",
                        HttpStatus.NOT_FOUND
                ));

        validarVinculos(intervencao, sessaoId, execucaoId, usuario, expiraEm, agora);

        // A tabela representa estado de segurança temporário, não um log de auditoria.
        jdbcTemplate.update(
                "DELETE FROM tickets_sessao_interativa_consumidos WHERE expira_em <= ?",
                agora
        );

        int inseridos = jdbcTemplate.update(
                """
                INSERT INTO tickets_sessao_interativa_consumidos (
                    jti,
                    sessao_id,
                    intervencao_id,
                    execucao_id,
                    usuario,
                    worker_id,
                    expira_em,
                    consumido_em
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (jti) DO NOTHING
                """,
                jti,
                sessaoId,
                intervencaoId,
                execucaoId,
                usuario,
                workerId,
                expiraEm,
                agora
        );

        if (inseridos == 0) {
            throw new ExcecaoNegocio(
                    "TICKET_SESSAO_REUTILIZADO",
                    "erros.ticketSessaoReutilizado",
                    HttpStatus.CONFLICT
            );
        }
    }

    private void validarVinculos(
            SolicitacaoIntervencao intervencao,
            UUID sessaoId,
            UUID execucaoId,
            String usuario,
            Instant expiraEm,
            Instant agora
    ) {
        boolean sessaoDivergente = intervencao.getSessaoReferencia() == null
                || !intervencao.getSessaoReferencia().equalsIgnoreCase(sessaoId.toString());
        boolean execucaoDivergente = !intervencao.getExecucaoId().equals(execucaoId);
        boolean usuarioDivergente = intervencao.getAtribuidaPara() == null
                || !intervencao.getAtribuidaPara().equals(usuario);
        boolean statusInvalido = intervencao.getStatus() != StatusIntervencao.EM_ATENDIMENTO;
        boolean intervencaoExpirada = intervencao.getExpiraEm() != null
                && !intervencao.getExpiraEm().isAfter(agora);
        boolean ticketExcedeIntervencao = intervencao.getExpiraEm() != null
                && expiraEm.isAfter(intervencao.getExpiraEm());

        if (sessaoDivergente
                || execucaoDivergente
                || usuarioDivergente
                || statusInvalido
                || intervencaoExpirada
                || ticketExcedeIntervencao) {
            throw new ExcecaoNegocio(
                    "TICKET_SESSAO_DIVERGENTE",
                    "erros.ticketSessaoDivergente",
                    HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
    }
}
