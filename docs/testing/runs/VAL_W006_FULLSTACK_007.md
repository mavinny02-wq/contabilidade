# VAL-W006-FULLSTACK-007 — smoke pós-hardening

## Identificação

- **ITEM:** `VAL-W006-FULLSTACK-007`.
- **Wave:** `CONTABILIDADE_FAST_LANE_WAVE_007`.
- **Data:** 17/08/2026 (UTC).
- **Status:** `PASS`.
- **Baseline executado:** `9d5561e331b09aaec76783cd29f63afec1d7ceea` (`latest main` disponível no
  checkout; merge do PR #95).
- **Baseline do dispatch:** `d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b`, confirmado como ancestral
  do baseline executado.
- **Owner alterado:** somente `docs/testing/runs/VAL_W006_FULLSTACK_007.md`.
- **Produto:** read-only; nenhuma fonte, configuração executável, dependência, lockfile ou migration
  foi alterada.
- **Locks preservados:** `LOCK-EXT-001`, `LOCK-DATA-001`, `LOCK-EVID-001` e `LOCK-TEST-001`.
- **Migração criada ou modificada:** nenhuma.

## Preparação e isolamento

O `dispatch_guard.py` aceitou a chave de dispatch e retornou
`DISPATCH_ALLOWED e82ffab2bfaac2412a1d9d885845bdd6b4489ce14e86e9e0630418ae7cf36563` com
exit code 0. A auditoria remota GitHub-aware não estava disponível porque o executor não recebeu
`GITHUB_REPOSITORY` nem `GITHUB_TOKEN`; isso não alterou a validação local do dispatch.

O cenário usou Node.js `v24.19.0`, npm `11.17.0`, Java `21.0.2`, Maven `3.9.10`, PostgreSQL
`16.14` e Chromium for Testing `148.0.7778.96` (revisão Playwright `1223`). O PostgreSQL foi
instalado localmente e a base sintética dedicada `contabilidade_codex_e2e` foi recriada pelo
launcher canônico. Backend, worker e frontend escutaram somente em `127.0.0.1`; URLs de providers
foram direcionadas à porta local fechada `127.0.0.1:9`, e a guarda Playwright recusou hosts não
locais. Nenhuma credencial, dado fiscal, CNPJ real ou provider externo foi usado.

## Comandos e resultados

| Comando | Exit code | Resultado |
|---|---:|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_007 --item VAL-W006-FULLSTACK-007 --baseline d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b --key e82ffab2bfaac2412a1d9d885845bdd6b4489ce14e86e9e0630418ae7cf36563 --github-aware --register` | 0 | dispatch permitido; auditoria GitHub indisponível por ausência de variáveis do executor |
| `cd backend && mvn -B -DskipTests clean package` | 0 | `BUILD SUCCESS`; fontes principais e testes compilados; JAR reconstruído |
| `cd frontend && npm ci --no-audit --no-fund` | 0 | 236 pacotes instalados estritamente pelo lockfile |
| `cd frontend && npm run locale:validate` | 0 | bundle `pt-BR` válido: 22 catálogos, 66 arquivos e 86 entradas dinâmicas |
| `cd frontend && npm run typecheck` | 0 | TypeScript aprovado |
| `cd frontend && npm run build` | 0 | Vite aprovou 154 módulos e produziu chunks separados de rota e entrada |
| `cd frontend && npx vitest run src/app/router.test.tsx` | 0 | 2/2 casos aprovados: fallback lazy acessível e erro controlado de chunk |
| `cd automation-worker && npm ci --no-audit --no-fund` | 0 | 13 pacotes instalados estritamente pelo lockfile |
| `cd automation-worker && npm run typecheck && npm run build` | 0 | TypeScript aprovado e `dist` emitido |
| `cd automation-worker && node --test dist/observability/observability.test.js` | 0 | 4/4 casos aprovados, incluindo propagação worker → backend do correlation ID |
| `cd backend && mvn -B -Dtest=HttpObservabilityFilterTest test` | 0 | 3/3 casos aprovados; `X-Correlation-Id` seguro é devolvido e valor inseguro é substituído |
| `cd automation-worker && npx playwright install --with-deps chromium` | 0 | Chromium e headless shell da revisão 1223 disponíveis |
| `bash scripts/codex/fullstack-e2e.sh` sob Node 24 | 0 | PostgreSQL/Flyway/JPA, serviços, heartbeat, proxy e 19 jornadas Playwright aprovados |

Os avisos npm sobre a configuração global futura `http-proxy`, scripts de instalação sujeitos ao
`allowScripts` e a atualização opcional do npm foram informativos; não houve mudança de lockfile ou
falha de build.

## Provas full-stack

| Prova | Resultado |
|---|---|
| Flyway V1–V12 | última entrada `12:true` confirmada por consulta estrita |
| JPA validate | backend iniciou com o schema recém-migrado e readiness HTTP 200 |
| liveness/readiness backend | HTTP 200 nos dois endpoints Actuator |
| saúde do worker | HTTP 200 em `/health` |
| saúde do frontend | HTTP 200 em `/` |
| proxy frontend → backend | HTTP 200 em `/api/info` |
| heartbeat persistido | `worker_heartbeats` confirmou `count(*) > 0` |
| smoke Playwright | 19 jornadas aprovadas, sem redução do mínimo histórico |
| lazy routes | build produziu chunk `routePages`; testes focados aprovaram loading e falha controlada |
| observabilidade HTTP | 3 casos backend aprovaram devolução/sanitização de `X-Correlation-Id` |
| propagação worker → backend | caso focado do `BackendClient` aprovou a propagação |
| rede externa | zero chamadas; guarda do contexto Playwright permaneceu sem achados |
| HTTP 5xx | zero nos logs temporários verificados pelo launcher |

O smoke criou somente empresa, CNPJ e documento de texto sintéticos, percorreu todas as jornadas e
capturou `/tmp/contabilidade-codex-e2e.png`. A execução técnica não iniciou ação fiscal autoritativa
nem inferiu regularidade ou irregularidade fiscal.

## Classificação, limitações e handoff

Não ocorreu falha de produto, contrato de teste ou fixture; portanto não há classificação corretiva
nem successor. A única limitação foi `ENVIRONMENT_LIMITATION` para a auditoria remota opcional do
preflight, causada pela ausência de contexto/credencial GitHub no executor. A prova Cloud/Linux não
é alegada como prova Windows, Docker Desktop, provider real ou ambiente do usuário.

- **Provas pendentes:** nenhuma dentro do contrato desta campanha.
- **Successor:** `NONE`.
- **Commit:** `4e1b678` (commit inicial da evidência; metadados de handoff adicionados por amend).
- **PR:** `NOT_CREATED_ENVIRONMENT_LIMITATION`; `gh pr create` retornou exit code 4 porque o
  executor não possui `GH_TOKEN`/sessão autenticada nem remote Git configurado.
