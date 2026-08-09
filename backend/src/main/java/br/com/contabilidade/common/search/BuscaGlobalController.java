package br.com.contabilidade.common.search;

import br.com.contabilidade.empresa.api.EmpresaResumoResponse;
import br.com.contabilidade.empresa.service.EmpresaService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/busca")
public class BuscaGlobalController {

    private final EmpresaService empresaService;

    public BuscaGlobalController(EmpresaService empresaService) {
        this.empresaService = empresaService;
    }

    @GetMapping
    @PreAuthorize("@permissaoService.tem('EMPRESA_LER')")
    public BuscaGlobalResponse buscar(@RequestParam String termo) {
        if (termo == null || termo.trim().length() < 2) {
            return new BuscaGlobalResponse(List.of());
        }
        List<ResultadoBusca> resultados = empresaService.listar(termo, 0, 10).getContent().stream()
                .map(this::empresa)
                .toList();
        return new BuscaGlobalResponse(resultados);
    }

    private ResultadoBusca empresa(EmpresaResumoResponse empresa) {
        return new ResultadoBusca(
                "EMPRESA",
                empresa.id().toString(),
                empresa.razaoSocial(),
                empresa.cnpj(),
                "/empresas/" + empresa.id()
        );
    }

    public record BuscaGlobalResponse(List<ResultadoBusca> resultados) {
    }

    public record ResultadoBusca(
            String tipo,
            String id,
            String titulo,
            String subtitulo,
            String destino
    ) {
    }
}
