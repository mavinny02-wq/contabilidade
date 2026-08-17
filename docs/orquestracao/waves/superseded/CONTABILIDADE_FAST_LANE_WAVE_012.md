# Contabilidade Fast Lane Wave 012 — superseded

**Estado:** `SUPERSEDED`  
**Baseline:** `main@3850443701279e2002c527b6eb376de8abd664cf`  
**Motivo:** `P0_STARTUP_RELIABILITY_HOLD`  
**Successor:** `CONTABILIDADE_STARTUP_RELIABILITY_GATE_P0_001`

## Resultado integrado antes do hold

`VAL-W011-FULLSTACK-012` foi integrado pela PR `#134` com classificação
`TEST_CONTRACT_DRIFT`. Os gates executados em Linux ficaram verdes, mas o launcher não exercitou o
Nginx `/healthz` e não possui autoridade sobre Windows, Docker Desktop ou o fluxo oficial BAT/PowerShell.

## Motivo da supersession

A execução real do usuário construiu as três imagens e falhou antes de iniciar qualquer serviço porque
o cleanup de `contabilidade-startup-probe` transformou a ausência esperada do container em
`NativeCommandError`.

Essa evidência atual invalida a continuidade normal da wave. A prioridade passa a ser garantir:

- exit-code-driven Docker invocation;
- cleanup idempotente e race-safe;
- testes de lifecycle do probe;
- primeiro startup dev;
- segundo startup com PostgreSQL reutilizado.

## Owners retornados ao backlog

- `STR-INF-002` — TLS/certificados;
- `STR-INF-003` — IaC on-premise;
- `STR-CI-003` — paridade local do Required CI;
- `STR-OBS-003` — synthetic monitoring.

Nenhum launcher da Wave 012 permanece autorizado. A onda não deve ser relançada.

`CONTABILIDADE_FAST_LANE_WAVE_012_SUPERSEDED_BY_STARTUP_P0`
