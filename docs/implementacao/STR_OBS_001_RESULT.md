# STR-OBS-001 — resultado

**ITEM:** `STR-OBS-001`
**WAVE_ID:** `CONTABILIDADE_HARDENING_WAVE_006`
**DISPATCH_KEY:** `12513604f08b8e970241633e0f7f9d9e0a2f01e2b7dc1594a837dd01f3037a65`
**BASELINE CONTRATUAL:** `a3344a15a0581fd7f76f78766c6432b46f9a361e`
**HEAD DE EXECUÇÃO:** `0c4d42b78cd996ac22f1940fed4c21dcc5d4405b`
**STATUS:** `PASS`

## Owners alterados

- observabilidade HTTP comum do backend e seus testes focados;
- observabilidade do automation worker e propagação no `BackendClient`;
- este resultado.

Nenhuma migration, fluxo de provider, regra fiscal, frontend, manifest, lockfile ou workflow foi
alterado.

## Entrega

- O filtro de correlação existente foi coberto para aceitação, geração segura, rejeição e limpeza
  de MDC; um filtro adicional publica contadores de requests/erros e timer de latência com dimensões
  técnicas bounded.
- O worker ganhou contexto assíncrono isolado, propagação de `X-Correlation-Id`, redaction para logs
  estruturados e acumulador de métricas com buckets permitidos.
- Respostas de erro do backend deixaram de incorporar payload externo bruto na mensagem do worker.
- Correlações de leases concorrentes são preservadas entre aquisição, renovação e reporte, e
  removidas após resultado terminal.

## Locks preservados

- `LOCK-DATA-001`: somente fixtures sintéticas; redaction cobre campos e padrões sensíveis.
- `LOCK-EXT-001`: testes substituem `fetch`; nenhum provider real ou pago foi chamado.
- `LOCK-TEST-001`: a primeira falha do typecheck foi classificada como
  `ENVIRONMENT_LIMITATION` (dependências Node ausentes) e resolvida com o `npm ci` prescrito, sem
  mudança de produção para mascará-la.

## Comandos e resultados

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_HARDENING_WAVE_006 --item STR-OBS-001 --baseline a3344a15a0581fd7f76f78766c6432b46f9a361e --key 12513604f08b8e970241633e0f7f9d9e0a2f01e2b7dc1594a837dd01f3037a65 --github-aware --register` | `DISPATCH_ALLOWED`; auditoria remota indisponível por ausência de variáveis GitHub. |
| `cd backend && mvn -B -DskipTests test-compile` | `PASS`. |
| `cd backend && mvn -B -Dtest=HttpObservabilityFilterTest test` | `PASS`, 3 testes. |
| `cd automation-worker && npm ci --no-audit --no-fund` | `PASS`, com aviso de engine porque o ambiente oferece Node 20 e o projeto requer Node 22. |
| `cd automation-worker && npm run typecheck` | `PASS` após instalação reproduzível. |
| `cd automation-worker && npm run build` | `PASS`. |
| `cd automation-worker && node --test --test-concurrency=1 dist/observability/observability.test.js` | `PASS`, 4 testes. |
| `git diff --check` | `PASS`. |

## Limitações e provas pendentes

- A execução ocorreu em Node `v20.20.2`, abaixo do engine `>=22.12.0`; typecheck, build e testes
  focados passaram, mas isto não substitui prova no runtime Node suportado.
- Não houve teste de runtime com PostgreSQL, browser, provider, Actuator servido ou Prometheus
  coletando, conforme o escopo de validação focada desta task.
- O dispatch guard não pôde auditar duplicidade remota sem `GITHUB_REPOSITORY` e `GITHUB_TOKEN`.

## Commit e PR

Preenchidos no handoff Git/GitHub desta execução.
