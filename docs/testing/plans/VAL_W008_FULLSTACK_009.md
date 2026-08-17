# VAL-W008-FULLSTACK-009 — smoke pós-Wave 008

## Estado

`RELEASED_FOR_EXECUTION` pela `CONTABILIDADE_FAST_LANE_WAVE_009`.

## Objetivo

Comprovar uma única vez o HEAD final depois da Wave 008, cobrindo observabilidade operacional,
composition root do worker e contratos de qualidade sem repetir campanhas não invalidadas.

## Owner

Produto inteiro read-only. Somente
`docs/testing/runs/VAL_W008_FULLSTACK_009.md` pode ser criado.

## Provas

- Node 24 e Java 21;
- guards Docker/Buildx, alertas e arquitetura;
- builds de backend, frontend e worker;
- PostgreSQL sintético e Flyway V1–V12;
- JPA validate;
- liveness/readiness;
- worker health e heartbeat;
- frontend, proxy `/api/info` e lazy routes;
- mínimo histórico de 19 jornadas Playwright;
- smoke a11y local sem violações critical/serious;
- registro dos providers preservado após a nova composição;
- zero rede externa e zero HTTP 5xx;
- encerramento sem processos ou portas órfãs.

## Regras

- nenhuma correção de produto dentro da task;
- nenhuma prova Windows/Docker Desktop alegada;
- falha é classificada e produz successor;
- provider real/pago permanece proibido;
- fixtures e identidades são sintéticas;
- a suíte Testcontainers crítica pendente continua separada quando o ambiente não oferece Docker.

## Aceite

`PASS` somente com todos os gates obrigatórios verdes e baseline exata registrada.

`VAL_W008_FULLSTACK_009_RELEASED`
