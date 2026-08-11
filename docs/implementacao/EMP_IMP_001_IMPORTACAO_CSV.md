# EMP-IMP-001 — Importação CSV de empresas

## Objetivo

Permitir o onboarding em lote de empresas a partir de um arquivo CSV UTF-8, com validação prévia,
resultado por linha e sem depender de integração externa.

## Fluxo

1. o operador baixa o modelo em `GET /api/empresas/importacao-csv/modelo`;
2. seleciona o arquivo na página Empresas;
3. executa primeiro `somenteValidar=true`;
4. o backend valida cabeçalho, encoding, tamanho, quantidade de linhas, CNPJ, enums e Bean Validation;
5. a interface exibe linhas válidas e rejeitadas;
6. ao desmarcar “Somente validar”, cada linha válida é cadastrada pela mesma regra autoritativa de
   `EmpresaService.criar`;
7. o resultado final informa importadas, rejeitadas e erros por linha.

## Formato

O modelo contém:

```text
razao_social;nome_fantasia;cnpj;status;cnae_principal;regime_tributario;inscricao_estadual;inscricao_municipal;logradouro;numero;complemento;bairro;municipio;uf;cep;responsavel_nome;responsavel_email
```

- separador `;` ou `,`, detectado pelo cabeçalho;
- UTF-8 com ou sem BOM;
- campos entre aspas e aspas escapadas por `""`;
- quebras de linha dentro de campo entre aspas são suportadas;
- `razao_social` e `cnpj` são obrigatórios;
- status vazio assume `ATIVA`;
- regime vazio assume `NAO_INFORMADO`.

Aliases seguros, como `razao`, `fantasia`, `cnae`, `ie`, `im`, `cidade` e `estado`, são aceitos.

## Segurança e consistência

- requer `EMPRESA_EDITAR`;
- não chama Receita, Serpro ou qualquer provider;
- não registra o conteúdo do CSV nem dados de linhas na auditoria;
- CNPJ duplicado no arquivo ou já existente é rejeitado;
- utiliza a criação autoritativa existente, incluindo auditoria e sincronização inicial de certidões;
- uma linha inválida não impede o processamento das demais;
- erros retornados são limitados por configuração;
- nenhum registro é removido ou sobrescrito.

## Configuração

```text
APP_COMPANY_CSV_IMPORT_MAX_FILE_SIZE_BYTES=2097152
APP_COMPANY_CSV_IMPORT_MAX_ROWS=2000
APP_COMPANY_CSV_IMPORT_MAX_ERRORS=200
```

Os valores ainda são limitados internamente para evitar configuração sem teto.

## Auditoria

Uma importação efetiva registra `EMPRESAS_IMPORTADAS_CSV` com apenas:

- total de linhas;
- linhas válidas;
- empresas importadas;
- linhas rejeitadas;
- separador detectado.

A validação sem gravação não cria evento de importação.

## Validação realizada

- revisão estática do parser CSV, incluindo aspas, BOM, CRLF e delimitador;
- revisão de limites, duplicidade e mensagens seguras;
- revisão do uso de `EmpresaService.criar` por linha;
- revisão do fluxo frontend com `FormData`, download do modelo e resultado por linha;
- nenhuma chamada externa e nenhuma migration.

## Validação runtime pendente

- `mvn clean verify` da main atual;
- i18n, typecheck e build frontend;
- validar arquivo correto com `somenteValidar=true`;
- importar arquivo misto com linhas válidas e inválidas;
- confirmar duplicidade no arquivo e no banco;
- confirmar sincronização inicial das certidões aplicáveis;
- confirmar auditoria sem conteúdo sensível;
- validar limites de arquivo, linhas e erros.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
