# STR-DOC-002 — contratos do storage local de documentos

## Estado

`RELEASED_FOR_EXECUTION` pela `CONTABILIDADE_FAST_LANE_WAVE_009`.

## Objetivo

Endurecer `ArmazenamentoLocalDocumento` com suíte adversarial determinística e correções mínimas
quando um contrato comprovadamente falhar.

## Owner

- implementação local de storage de documentos;
- testes focados em `common/document`;
- `docs/implementacao/STR_DOC_002_RESULT.md`.

POM, migrations, banco, controllers, retenção, antivírus e storage remoto permanecem fora do owner.

## Contratos obrigatórios

- referência sempre relativa e normalizada;
- nenhuma fuga do diretório raiz por `..`, caminho absoluto ou encoding;
- não seguir symlink/junction em escrita, leitura, listagem ou exclusão;
- aceitar somente arquivo regular;
- escrita temporária e promoção atômica quando suportada;
- cleanup do temporário em falha;
- leitura bounded;
- exclusão idempotente e limitada à referência autorizada;
- listagem bounded e sem expor path físico;
- nomes fornecidos pelo usuário nunca definem o path final;
- concorrência não produz conteúdo parcial;
- erros e logs não expõem root path, hash bruto, conteúdo ou PII.

## Prova

Usar diretórios temporários e bytes sintéticos. Cobrir caminhos adversariais, symlink, falha durante
escrita/move, leitura concorrente, arquivo ausente e cleanup. Nenhum documento real será usado.

## Aceite

Testes verdes em duas execuções, sem dependência nova, sem migration e sem ampliar o escopo para
antivírus, retenção ou S3/MinIO.

`STR_DOC_002_RELEASED`
