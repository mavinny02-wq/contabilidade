package br.com.contabilidade.certidao.service;

import br.com.contabilidade.certidao.domain.CertidaoAcompanhamento;
import br.com.contabilidade.certidao.domain.TipoCertidao;
import br.com.contabilidade.certidao.repository.CertidaoAcompanhamentoRepository;
import br.com.contabilidade.empresa.domain.Estabelecimento;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CertidaoEstabelecimentoLifecycleService {

    private final CertidaoAcompanhamentoRepository repository;

    public CertidaoEstabelecimentoLifecycleService(CertidaoAcompanhamentoRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void sincronizar(Estabelecimento estabelecimento) {
        Map<TipoCertidao, CertidaoAcompanhamento> existentes = new EnumMap<>(TipoCertidao.class);
        repository.findByEstabelecimentoId(estabelecimento.getId())
                .forEach(item -> existentes.put(item.getTipo(), item));

        for (TipoCertidao tipo : TipoCertidao.values()) {
            boolean aplicavel = estabelecimento.isAtivo()
                    && tipo.aplicavel(estabelecimento.getUf(), estabelecimento.isMatriz());
            CertidaoAcompanhamento acompanhamento = existentes.get(tipo);

            if (acompanhamento == null) {
                if (aplicavel) {
                    repository.save(new CertidaoAcompanhamento(
                            estabelecimento.getEmpresa().getId(),
                            estabelecimento.getId(),
                            tipo
                    ));
                }
                continue;
            }

            if (aplicavel) {
                acompanhamento.ativar();
            } else {
                acompanhamento.inativar();
            }
        }
    }
}
