# AUT-TEL-001 — Histórico de heartbeats dos workers

## Objetivo

Persistir amostras seguras de heartbeat para investigar períodos de disponibilidade, mudanças de
estado e versões do automation worker sem transformar cada polling em crescimento descontrolado.

## Implementação

- migration `V12__worker_heartbeat_historico.sql`;
- amostragem por worker:
  - sempre na primeira observação;
  - sempre quando status ou versão mudam;
  - periodicamente após o intervalo configurado;
- intervalo padrão de cinco minutos;
- limite padrão de 5.000 amostras retornadas;
- endpoint:
  - `GET /api/console-tecnica/workers/historico`;
- filtros por período e `workerId`;
- contagens por status e indicação de resultado parcial;
- página administrativa protegida pela Console Técnica.

## Segurança e operação

- escrita continua exclusiva do endpoint interno autenticado por `X-Worker-Token`;
- leitura exige `CONSOLE_TECNICA_LER`;
- o horário persistido é o horário do servidor, não o valor enviado pelo cliente;
- nenhuma empresa, execução, sessão, ticket, grant ou payload é gravado;
- estados desconhecidos são normalizados para `DESCONHECIDO`;
- período máximo de 366 dias;
- nenhuma chamada externa.

## Configurações

```text
APP_WORKER_HEARTBEAT_HISTORY_SAMPLE_INTERVAL=PT5M
APP_WORKER_HEARTBEAT_HISTORY_MAX_ROWS=5000
```

## Provas runtime pendentes

- aplicação da V12;
- primeiro heartbeat, intervalo e mudança de estado/versão;
- ausência de amostra a cada polling dentro do intervalo;
- múltiplos workers;
- período padrão/inválido/excedido;
- resultado parcial;
- autorização do endpoint de leitura;
- token inválido no endpoint interno;
- i18n, typecheck e build do frontend.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
