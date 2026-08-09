# Centro de Certidões

## Tipos iniciais

- `FEDERAL_RFB_PGFN`;
- `SP_SEFAZ_NAO_INSCRITOS`;
- `SP_PGE_DIVIDA_ATIVA`.

## Separação de estados

`ResultadoCertidao` representa o fato fiscal observado.

`SituacaoConsultaCertidao` representa o processo técnico.

A UI deriva um `StatusCertidao` sem transformar falha externa em regularidade.

## Resultado manual

Resultados conclusivos exigem documento. `REGULAR` e
`POSITIVA_COM_EFEITO_NEGATIVA` também exigem emissão e validade.

O arquivo:

- pertence à mesma empresa;
- passa por validação de MIME e assinatura básica;
- recebe hash;
- fica vinculado ao acompanhamento e ao histórico.

## Provedores

Todos são substituíveis:

- API oficial;
- API comercial;
- portal automatizado;
- portal assistido;
- manual.

Os providers reais permanecem desabilitados nesta versão. O provider manual permite operação antes
dos conectores.

## Política

Cada operação possui lista ordenada de providers, intervenção, timeout humano, fallback pago e
limite de custo. Provider pago só é usado:

- como primeiro provider explicitamente configurado; ou
- como fallback quando `fallbackPago=true`.

Se houver limite de custo, custo desconhecido ou moeda incompatível bloqueiam o provider.

## Agendamento

A próxima consulta usa a validade menos a antecedência configurada. O scheduler também inicializa
acompanhamentos ausentes para empresas ativas.

## Limites

- sem parser real de PDFs governamentais;
- sem portais reais;
- sem agregação universal de “regularidade da empresa”;
- sem IA fiscal;
- sem inferência de pendência a partir de indisponibilidade.
