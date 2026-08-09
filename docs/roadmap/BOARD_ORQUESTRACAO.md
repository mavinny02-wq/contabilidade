# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- versão candidata: `0.5.1` sobre a baseline `0.5.0`;
- análise canônica: `docs/analise/ANALISE_COMPLETA_BASELINE_V050.md`;
- gate ativo: `GATE-VAL-001`;
- correções do gate: preparadas na candidata v0.5.1;
- validação obrigatória: Windows + JDK 21 + Node 22.12+ + Maven/npm/Docker;
- slots oficiais selecionados: zero enquanto o gate não estiver verde;
- próxima onda: cinco candidatos independentes já preparados como `PREVIEW`.

## Regra de promoção

Os prompts `PREVIEW_SLOT_*` só podem ser promovidos a slots oficiais após evidência de:

- lockfiles versionados;
- frontend typecheck/build verdes;
- worker typecheck/build verdes;
- Maven package verde;
- três variantes de Compose válidas;
- PostgreSQL/Flyway/Keycloak e cinco health checks verdes;
- execução do BAT no Windows sem chamada fiscal externa.

## Candidatos da onda após o gate

1. `SEC-AUT-001` — anti-replay de tickets de sessão;
2. `PERF-CRT-001` — consultas limitadas no scheduler de certidões;
3. `OPS-BKP-001` — manifesto/verificação de backup;
4. `OBS-WRK-001` — heartbeat vencido na Console Técnica;
5. `SEC-DOC-001` — verificação de integridade do storage.

Os cinco candidatos não possuem dependência entre si e devem partir do mesmo futuro commit verde.
