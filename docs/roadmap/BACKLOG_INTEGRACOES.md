# Backlog Integrações

## Providers presentes

- `FEDERAL_PORTAL` — portal assistido, runtime pendente;
- `SEFAZ_SP_PORTAL` — portal assistido, runtime pendente;
- `PGE_SP_PORTAL` — portal assistido, runtime pendente;
- `SERPRO` — client oficial implementado na v0.5.0, runtime pendente;
- `INFOSIMPLES` — somente definição;
- `MANUAL` — contingência operacional.

## HIST-CRT-007 — Serpro Consulta CND

**Estado:** pacote v0.5.0 preparado; contrato e runtime pendentes.

Entregue:

- OAuth2 `client_credentials`;
- bearer estático somente com opt-in explícito para demonstração;
- token cache/refresh;
- request de PJ com PDF;
- status 1–15 e 99;
- status 7 sem persistência da chave;
- CND e CPEND;
- PDF e dados validados;
- custo estimado e acumulado;
- modo API sem browser;
- preflight sem consulta;
- migration V7;
- provider desabilitado por padrão.

Provas pendentes:

- contrato e credenciais reais;
- token real;
- CND/CPEND reais;
- status 7 real;
- conferência de faturamento;
- rate limit e indisponibilidade reais;
- testes permanentes.

## Regras permanentes

- provider pago depende de política e custo autorizado;
- secret é valor de ambiente, nunca domínio ou frontend;
- falha técnica não substitui resultado fiscal anterior;
- provider real permanece desabilitado até prova autorizada;
- `MANUAL` deve permanecer disponível como contingência.
