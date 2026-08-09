package br.com.contabilidade.common.info;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/info")
public class InfoAplicacaoController {

    private final String ambiente;
    private final String versao;

    public InfoAplicacaoController(
            @Value("${app.environment:LOCAL}") String ambiente,
            @Value("${app.version:0.2.0}") String versao
    ) {
        this.ambiente = ambiente;
        this.versao = versao;
    }

    @GetMapping
    public InfoAplicacao info() {
        return new InfoAplicacao("Contabilidade", versao, ambiente);
    }

    public record InfoAplicacao(String nome, String versao, String ambiente) {
    }
}
