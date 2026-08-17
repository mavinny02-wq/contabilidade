# STR-OBS-003 — monitoração sintética local-only

**Status:** `RETURNED_TO_BACKLOG_P0_HOLD`
**Wave anterior:** `CONTABILIDADE_FAST_LANE_WAVE_012` (`SUPERSEDED`)
**Baseline:** `main@3850443701279e2002c527b6eb376de8abd664cf`
**Migration:** `NONE`

## Problema

SLOs e alertas já existem, mas falta um probe sintético governado para validar readiness e o caminho
frontend → backend sem depender de browser completo, credencial, provider fiscal ou endpoint externo.

## Escopo

Criar somente:

- `scripts/observability/synthetic/**`;
- `infra/observability/synthetic/**`;
- schema/policy/fixtures/testes;
- workflow dedicado com servidor local sintético;
- `docs/implementacao/STR_OBS_003_RESULT.md`.

Backend, frontend, worker, Compose, alert rules e SLO catalog existentes são somente leitura.

## Probes mínimos

- backend liveness;
- backend readiness;
- worker `/health`;
- frontend `/healthz`;
- proxy frontend `/api/info`;
- resposta técnica com correlation ID;
- opcionalmente frontier Flyway apenas quando fonte local autorizada estiver disponível.

Cada probe declara:

- ID;
- URL template sem credencial;
- ambientes permitidos;
- timeout;
- retry/backoff bounded;
- status codes esperados;
- classificação;
- owner/runbook;
- redaction rules.

## Segurança

- somente loopback/hosts explicitamente permitidos;
- bloquear DNS/IP externo, redirect externo e URL autenticada;
- nenhuma empresa, CNPJ, documento, token ou payload fiscal;
- não imprimir body completo;
- fingerprints e amostras bounded;
- labels de baixa cardinalidade.

## Regras e estados

Estados:

- `HEALTHY`;
- `DEGRADED`;
- `UNAVAILABLE`;
- `ENVIRONMENT_LIMITATION`;
- `POLICY_VIOLATION`.

Testar sucesso, timeout, conexão recusada, 5xx, status inesperado, retry, recovery, redirect externo,
body sensível, correlation ID ausente e saída determinística.

## Validação

- servidor HTTP local de fixture;
- zero rede externa;
- dois relatórios byte-idênticos para a mesma fixture;
- testes de timeout/retry/redaction/policy;
- workflow YAML e JSON válidos;
- `git diff --check`.

## Aceite

- probes bounded e reutilizáveis;
- nenhuma mudança de produto;
- nenhuma alegação de regularidade fiscal;
- indisponibilidade ambiental separada de falha do serviço;
- runbook/owner presentes para cada probe.

`STR_OBS_003_RELEASED`
