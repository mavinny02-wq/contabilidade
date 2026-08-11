package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.api.CertidaoAgendaResponse;
import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import br.com.contabilidade.certidao.repository.CertidaoAgendaLinha;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CertidaoAgendaService {

    private static final ZoneId ZONA_NEGOCIO = ZoneId.of("America/Sao_Paulo");
    private static final int MAXIMO_DIAS = 366;

    private final CertidaoAcompanhamentoRepository repository;
    private final int maximoLinhas;

    public CertidaoAgendaService(
            CertidaoAcompanhamentoRepository repository,
            @Value("${app.certificate.agenda-max-rows:5000}") int maximoLinhas
    ) {
        this.repository = repository;
        this.maximoLinhas = Math.min(Math.max(maximoLinhas, 1), 50_000);
    }

    @Transactional(readOnly = true)
    public CertidaoAgendaResponse consultar(
            LocalDate inicioInformado,
            LocalDate fimInformado,
            UUID empresaId
    ) {
        LocalDate hoje = LocalDate.now(ZONA_NEGOCIO);
        LocalDate inicio = inicioInformado == null ? hoje : inicioInformado;
        LocalDate fim = fimInformado == null ? inicio.plusDays(90) : fimInformado;
        validarPeriodo(inicio, fim);

        long total = repository.contarAgendaVencimentos(inicio, fim, empresaId);
        List<CertidaoAgendaResponse.Item> itens = repository.buscarAgendaVencimentos(
                        inicio,
                        fim,
                        empresaId,
                        PageRequest.of(0, maximoLinhas)
                ).stream()
                .map(linha -> mapear(linha, hoje))
                .toList();

        return new CertidaoAgendaResponse(
                inicio,
                fim,
                empresaId,
                total,
                total > itens.size(),
                itens
        );
    }

    private CertidaoAgendaResponse.Item mapear(CertidaoAgendaLinha linha, LocalDate hoje) {
        var certidao = linha.certidao();
        return new CertidaoAgendaResponse.Item(
                certidao.getId(),
                certidao.getEmpresaId(),
                linha.empresaRazaoSocial(),
                certidao.getEstabelecimentoId(),
                linha.cnpj(),
                certidao.getTipo(),
                certidao.statusExibicao(hoje),
                certidao.getValidaAte(),
                ChronoUnit.DAYS.between(hoje, certidao.getValidaAte()),
                certidao.getDocumentoId()
        );
    }

    private void validarPeriodo(LocalDate inicio, LocalDate fim) {
        if (fim.isBefore(inicio)) {
            throw new ExcecaoNegocio(
                    "PERIODO_AGENDA_INVALIDO",
                    "erros.periodoAgendaCertidoesInvalido",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (ChronoUnit.DAYS.between(inicio, fim) > MAXIMO_DIAS) {
            throw new ExcecaoNegocio(
                    "PERIODO_AGENDA_EXCEDIDO",
                    "erros.periodoAgendaCertidoesExcedido",
                    HttpStatus.BAD_REQUEST
            );
        }
    }
}
