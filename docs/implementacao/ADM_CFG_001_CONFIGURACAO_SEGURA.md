# ADM-CFG-001 — Configuração efetiva segura

## Objetivo

Apresentar uma visão operacional da configuração realmente carregada pelo backend sem devolver
senhas, tokens, segredos, URLs completas ou valores sensíveis.

## API

```http
GET /api/console-tecnica/configuracao
```

- exige `CONSOLE_TECNICA_LER`;
- consulta somente configuração em memória e definições de provider;
- não altera parâmetros nem reinicia serviços.

## Informações exibidas

- ambiente e versão;
- segurança habilitada ou desabilitada;
- provider de storage;
- validade configurada do ticket interativo;
- presença adequada do token interno do worker;
- presença adequada do segredo da sessão interativa;
- quantidade de providers definidos, habilitados e pagos;
- por provider: tipo, habilitação, presença de Base URL, referência de segredo, custo/moeda,
  timeout e retries.

## Alertas seguros

A API sinaliza, sem mostrar valores:

- segurança desabilitada;
- token ou segredo ausente, curto ou com valor de exemplo;
- storage local em ambiente não local;
- provider habilitado sem Base URL;
- provider de API sem referência de segredo;
- provider pago sem custo ou moeda.

## Segurança

- nenhum valor de segredo é serializado;
- Base URL e referência de segredo viram apenas booleanos de presença;
- não consulta provider externo;
- não registra configuração em auditoria;
- nenhuma migration.

## Provas pendentes

- Maven completo;
- i18n, typecheck e build frontend;
- ambiente local seguro e configurações deliberadamente incompletas;
- providers API, portal, manual e pago;
- inspeção da resposta para confirmar ausência de segredo e URL;
- usuário sem `CONSOLE_TECNICA_LER`.
