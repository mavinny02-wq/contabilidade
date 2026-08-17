# STR-OBS-002 — Resultado

- **ITEM:** `STR-OBS-002`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_008`
- **Baseline do checkout:** `c5f414061161eaf0e131cf8ceea64cf73f95e32c`
- **Baseline do dispatch:** `77141fae2f04a430bc2cb51264886c083977a3ce`
- **Status:** `PASS_STRUCTURAL`
- **Owners alterados:** backend observability, `infra/observability/**`,
  `scripts/observability/**`, backup POSIX, runbook e este resultado.
- **Migration:** nenhuma.

## Entrega

Catálogo versionado com sete SLOs, regras Prometheus warning/critical e missing-data, fixtures dos
quatro estados e guard determinístico. O backend publica histogramas HTTP e sinais agregados de
fila, lease e heartbeat sem labels de negócio; o backup POSIX pode publicar timestamp atômico para
o textfile collector. O runbook separa impacto técnico de resultado fiscal e proíbe ação automática.

## Locks preservados

- `LOCK-DATA-001`: métricas, fixtures e regras não contêm dados ou credenciais reais.
- `LOCK-EVID-001`: validação focada; nenhuma suíte ampla foi executada.
- `LOCK-TEST-001`: nenhuma falha de produto foi observada ou corrigida sem classificação.

## Comandos e resultados

- `python3 scripts/orchestration/dispatch_guard.py ... --github-aware --register` —
  `DISPATCH_ALLOWED`; auditoria remota indisponível porque as variáveis GitHub não existem.
- `cd backend && mvn -B -DskipTests test-compile` — `BUILD SUCCESS` (Java 21; testes não executados).
- `python3 scripts/observability/alert_guard.py` —
  `ALERT_GUARD_OK alerts=15 slos=7 fixtures=4`.
- `python3 -m unittest scripts/observability/test_alert_guard.py` — 1 teste, `OK`.
- `git diff --check` — sem erros.

Uma primeira composição de shell chamou os dois comandos Python a partir de `backend/` e falhou
por caminho relativo incorreto (`AGENT_INVOCATION_ERROR`); ambos foram repetidos corretamente a
partir da raiz e passaram. Não houve alteração de produção decorrente dessa falha.

## Limitações e provas pendentes

Validação estrutural não prova Prometheus em runtime, PostgreSQL real, node exporter, canal externo
ou comportamento Windows. O canal externo é deliberadamente fora do escopo. A emissão de backup
exige que a operação configure `PROMETHEUS_TEXTFILE_DIR`.

## Commit e PR

Preenchidos após a criação: ver commit e PR associados à branch desta entrega.
