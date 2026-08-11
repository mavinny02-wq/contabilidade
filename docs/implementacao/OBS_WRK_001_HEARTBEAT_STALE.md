# OBS-WRK-001 — Heartbeat vencido na Console Técnica

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`

## Problema

A Console Técnica mostrava banco, storage e filas, mas não distinguia:

- worker saudável;
- worker iniciando ou degradado;
- heartbeat atrasado;
- heartbeat expirado;
- ausência total de worker.

A ausência do worker também não deve ser confundida com falha fiscal ou irregularidade de certidão.

## Solução

O backend passou a classificar os heartbeats persistidos com limiares configuráveis:

```text
APP_WORKER_HEARTBEAT_DEGRADED_AFTER=PT90S
APP_WORKER_HEARTBEAT_UNAVAILABLE_AFTER=PT5M
APP_WORKER_HEARTBEAT_FUTURE_TOLERANCE=PT30S
APP_WORKER_HEARTBEAT_MAX_LISTED=100
```

Para cada worker são expostos:

- identificador;
- versão;
- status reportado normalizado;
- status técnico calculado;
- instante do último heartbeat;
- idade em segundos;
- motivo seguro sem exception ou payload interno.

A classificação considera:

- `SAUDAVEL`: heartbeat recente e status reportado saudável;
- `DEGRADADO`: atraso intermediário, inicialização, relógio divergente, status degradado ou desconhecido;
- `INDISPONIVEL`: heartbeat expirado ou status explicitamente indisponível.

Quando há vários registros, a disponibilidade agregada permanece saudável se ao menos um worker está
saudável. Heartbeats antigos de workers substituídos continuam visíveis, mas não transformam uma
capacidade ativa em falha global.

## Console Técnica

A resposta `/api/console-tecnica/resumo` agora inclui:

- componente agregado `worker`;
- lista dos heartbeats mais recentes;
- total de workers registrados;
- indicação de lista limitada;
- limiares usados na classificação.

O frontend mostra um card agregado e uma linha por worker com status, versão, data, idade e motivo.
Todos os textos visíveis permanecem em i18n pt-BR.

## Separação de domínios

O estado do worker não altera:

- `execucoesComFalha`;
- resultado fiscal de certidão;
- regularidade/irregularidade;
- estado de provider externo.

Ele representa apenas disponibilidade operacional da automação.

## Arquivos principais

- `backend/src/main/java/br/com/contabilidade/common/worker/WorkerHeartbeatStatusService.java`;
- `backend/src/main/java/br/com/contabilidade/common/worker/WorkerHeartbeatRepository.java`;
- `backend/src/main/java/br/com/contabilidade/common/technical/ConsoleTecnicaController.java`;
- `backend/src/main/resources/application.yml`;
- `frontend/src/api/technical.ts`;
- `frontend/src/pages/ConsoleTecnicaPage.tsx`;
- `frontend/src/i18n/pt-BR-console-tecnica.json`;
- `frontend/src/i18n/index.ts`;
- `frontend/scripts/validate-locale.mjs`.

## Validações ainda necessárias

- compilação Maven Java 21;
- validação i18n, typecheck e build do frontend;
- heartbeat recente classificado como saudável;
- atraso acima de 90 segundos classificado como degradado;
- atraso acima de 5 minutos classificado como indisponível;
- ausência de registros exibida sem marcar execução fiscal como falha;
- lista limitada com mais de 100 worker IDs;
- alteração dos limiares por ambiente.
