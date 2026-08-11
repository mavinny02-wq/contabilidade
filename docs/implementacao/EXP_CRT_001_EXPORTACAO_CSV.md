# EXP-CRT-001 — Exportação CSV do Centro de Certidões

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`

Implementação iniciada por autorização direta do usuário após a onda das PRs `#14` a `#18`. O item
não fecha `GATE-VAL-001` e não seleciona sozinho uma nova onda oficial.

## Objetivo

Permitir que usuários com permissão de leitura exportem o estado atual do Centro de Certidões para
CSV, respeitando os filtros de empresa, tipo e status exibido.

## Fluxo

1. o frontend envia somente os filtros atualmente selecionados;
2. o backend lê acompanhamentos ativos em lotes ordenados por ID;
3. o status é calculado pela mesma regra de domínio usada na tela;
4. o limite máximo é aplicado sobre as linhas efetivamente exportadas;
5. o backend gera CSV UTF-8 com BOM e separador `;`;
6. a operação é registrada em auditoria sem conteúdo fiscal ou nomes de arquivo;
7. o navegador baixa o arquivo usando o nome informado por `Content-Disposition`.

## Filtros

- `empresaId` — opcional;
- `tipo` — opcional;
- `status` — opcional e calculado na data da exportação.

A ausência de filtros exporta todos os acompanhamentos ativos até o limite configurado.

## Colunas

- IDs do acompanhamento e da empresa;
- razão social e CNPJ;
- tipo, resultado, situação técnica e status exibido;
- número, emissão e validade;
- documento, provider, modo de aquisição e última execução;
- observação, próxima consulta, antecedência e mensagem segura da fonte;
- data da última atualização.

## Segurança

- exige `CERTIDAO_LER`;
- não consulta Receita, SEFAZ-SP, PGE-SP, Serpro ou qualquer provider;
- não exporta conteúdo de documentos, segredos, tokens ou payload completo de execução;
- todos os campos são delimitados e escapados;
- quebras de linha são normalizadas;
- valores iniciados por `=`, `+`, `-`, `@` ou tab são prefixados para impedir fórmula em planilhas;
- resposta usa `no-store` e `nosniff`;
- limite padrão de 10.000 linhas evita geração de arquivo sem controle.

## Configuração

```text
APP_CERTIFICATE_EXPORT_BATCH_SIZE=500
APP_CERTIFICATE_EXPORT_MAX_ROWS=10000
```

Os valores são limitados internamente:

- lote: 10 a 5.000;
- máximo de linhas: 1 a 100.000.

## Arquivos principais

- `backend/src/main/java/br/com/contabilidade/certidao/api/CertidaoController.java`;
- `backend/src/main/java/br/com/contabilidade/certidao/service/CertidaoExportacaoCsvService.java`;
- `backend/src/main/java/br/com/contabilidade/certidao/repository/CertidaoExportacaoLinha.java`;
- `backend/src/main/java/br/com/contabilidade/certidao/repository/CertidaoAcompanhamentoRepository.java`;
- `frontend/src/pages/CertidoesPage.tsx`;
- `frontend/src/i18n/pt-BR-exportacao-certidoes.json`.

## Validações ainda necessárias

- compilação Maven da `main` atual;
- i18n, typecheck e build do frontend;
- exportação sem filtros;
- exportação com cada filtro isolado e combinado;
- arquivo vazio contendo somente cabeçalho;
- limite excedido retornando erro acionável;
- abertura no Excel/LibreOffice preservando CNPJ e UTF-8;
- valor sintético iniciado por fórmula sendo tratado como texto;
- auditoria `CERTIDOES_EXPORTADAS_CSV` com quantidade e filtros, sem conteúdo sensível.

## Fora de escopo

- XLSX;
- exportação de PDFs;
- execução assíncrona de relatórios muito grandes;
- envio por e-mail;
- qualquer chamada fiscal externa.
