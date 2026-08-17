# STR-OBS-002 — SLOs, alertas e runbooks operacionais

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_008 --item STR-OBS-002 --baseline 77141fae2f04a430bc2cb51264886c083977a3ce \
  --key 6cae6b84522ce540b1a2e0973d6572f5c8fadf34c1bb4a8591aafa7db2dc3be6 --github-aware --register
```

## Owner

Pode alterar o pacote backend de observabilidade e seus testes, `infra/observability/**`,
`scripts/observability/**`, o runbook operacional associado e
`docs/implementacao/STR_OBS_002_RESULT.md`. Execuções, regras fiscais, worker, providers e migrations
são read-only.

## Objetivo

Converter as métricas técnicas existentes em sinais operacionais bounded, regras versionadas e
ações de resposta que não confundam indisponibilidade técnica com situação fiscal.

## Entrega mínima

- catálogo versionado de SLO/SLI para disponibilidade HTTP, latência, erro 5xx, fila, lease expirado,
  heartbeat do worker e backup;
- instrumentação mínima somente quando o sinal ainda não existir, sem PII, CNPJ, IDs ou labels de
  alta cardinalidade;
- regras Prometheus warning/critical com janela, `for`, missing-data e link estável de runbook;
- guard determinístico que rejeita métrica desconhecida, label proibida, alerta sem owner/runbook,
  limiar invertido e duplicidade;
- fixtures que comprovem estado normal, warning, critical e recovery;
- runbook com sintoma, impacto técnico, triagem, ação segura, escalonamento e critério de fechamento.

## Restrições

Nenhum alerta chama provider, reinicia serviço, executa correção automática ou altera estado fiscal.
Integração com canal externo permanece fora do escopo; a entrega é vendor-neutral e local.

## Validação

Java 21 compile/test-compile, testes focados de métricas, testes do guard, parse das regras,
reprodutibilidade dos artefatos e `git diff --check`.
