package br.com.contabilidade.common.document;

import br.com.contabilidade.common.audit.AuditoriaService;
import br.com.contabilidade.common.error.ExcecaoNegocio;
import br.com.contabilidade.common.error.RecursoNaoEncontradoException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentoMetadadosService {

    private final DocumentoRepository repository;
    private final AuditoriaService auditoriaService;

    public DocumentoMetadadosService(
            DocumentoRepository repository,
            AuditoriaService auditoriaService
    ) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public DocumentoService.DocumentoResponse atualizar(UUID id, DocumentoMetadadosRequest request) {
        Documento documento = repository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "DOCUMENTO_NAO_ENCONTRADO",
                        "erros.documentoNaoEncontrado"
                ));
        validarDatas(request.emitidoEm(), request.validoAte());

        String tipoAnterior = documento.getTipo();
        LocalDate emissaoAnterior = documento.getEmitidoEm();
        LocalDate validadeAnterior = documento.getValidoAte();
        documento.atualizarMetadados(request.tipo(), request.emitidoEm(), request.validoAte());
        Documento salvo = repository.saveAndFlush(documento);

        Map<String, Object> detalhes = new LinkedHashMap<>();
        detalhes.put("empresaId", salvo.getEmpresaId());
        detalhes.put("tipoAlterado", !Objects.equals(tipoAnterior, salvo.getTipo()));
        detalhes.put("emissaoAlterada", !Objects.equals(emissaoAnterior, salvo.getEmitidoEm()));
        detalhes.put("validadeAlterada", !Objects.equals(validadeAnterior, salvo.getValidoAte()));
        auditoriaService.registrar("DOCUMENTO_METADADOS_ATUALIZADOS", "DOCUMENTO", id, detalhes);

        return DocumentoService.DocumentoResponse.de(salvo);
    }

    private void validarDatas(LocalDate emitidoEm, LocalDate validoAte) {
        if (emitidoEm != null && validoAte != null && validoAte.isBefore(emitidoEm)) {
            throw new ExcecaoNegocio(
                    "DATAS_DOCUMENTO_INVALIDAS",
                    "erros.datasDocumentoInvalidas",
                    HttpStatus.BAD_REQUEST
            );
        }
    }
}
