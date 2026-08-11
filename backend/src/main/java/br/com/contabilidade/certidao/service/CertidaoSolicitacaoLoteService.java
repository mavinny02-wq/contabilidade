package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.api.CertidaoResponse;
import br.com.contabilidade.certidao.api.CertidaoSolicitacaoLoteRequest;
import br.com.contabilidade.certidao.api.CertidaoSolicitacaoLoteResponse;
import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CertidaoSolicitacaoLoteService {

    private final CertidaoService certidaoService;
    private final AuditoriaService auditoriaService;

    public CertidaoSolicitacaoLoteService(
            CertidaoService certidaoService,
            AuditoriaService auditoriaService
    ) {
        this.certidaoService = certidaoService;
        this.auditoriaService = auditoriaService;
    }

    public CertidaoSolicitacaoLoteResponse solicitar(CertidaoSolicitacaoLoteRequest request) {
        UUID loteId = UUID.randomUUID();
        String chaveLote = chaveLote(request.idempotencyKey(), loteId);
        LinkedHashSet<UUID> idsUnicos = new LinkedHashSet<>(request.ids());
        List<CertidaoSolicitacaoLoteResponse.Item> itens = new ArrayList<>(idsUnicos.size());
        int aceitas = 0;

        for (UUID id : idsUnicos) {
            try {
                CertidaoResponse certidao = certidaoService.solicitar(
                        id,
                        "CERTIDAO:BULK:" + chaveLote + ":" + id
                );
                itens.add(new CertidaoSolicitacaoLoteResponse.Item(
                        id,
                        true,
                        "ACEITA",
                        certidao.situacaoConsulta(),
                        certidao.ultimaExecucaoId()
                ));
                aceitas++;
            } catch (ExcecaoNegocio exception) {
                itens.add(new CertidaoSolicitacaoLoteResponse.Item(
                        id,
                        false,
                        exception.getCodigo(),
                        null,
                        null
                ));
            }
        }

        int rejeitadas = idsUnicos.size() - aceitas;
        auditoriaService.registrar(
                "CERTIDOES_SOLICITADAS_EM_LOTE",
                "CERTIDAO_ACOMPANHAMENTO",
                null,
                Map.of(
                        "loteId", loteId,
                        "recebidas", request.ids().size(),
                        "unicas", idsUnicos.size(),
                        "aceitas", aceitas,
                        "rejeitadas", rejeitadas
                )
        );
        return new CertidaoSolicitacaoLoteResponse(
                loteId,
                request.ids().size(),
                idsUnicos.size(),
                aceitas,
                rejeitadas,
                itens
        );
    }

    private String chaveLote(String valor, UUID loteId) {
        if (valor == null || valor.isBlank()) return loteId.toString();
        String limpa = valor.replaceAll("[\\r\\n\\u0000-\\u001F\\u007F]", "").trim();
        return limpa.isEmpty() ? loteId.toString() : limpa;
    }
}
