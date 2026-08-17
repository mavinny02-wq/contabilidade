# VAL-W007-FULLSTACK-008 — smoke consolidado após a Fast Lane 007

## Identificação

- **ITEM:** `VAL-W007-FULLSTACK-008`.
- **Wave:** `CONTABILIDADE_FAST_LANE_WAVE_008`.
- **Data:** 17/08/2026 (UTC).
- **Status:** `PASS`.
- **Baseline executado:** `c5f414061161eaf0e131cf8ceea64cf73f95e32c` (`latest main` disponível no
  checkout; merge do PR #102).
- **Baseline do dispatch:** `77141fae2f04a430bc2cb51264886c083977a3ce`, presente no checkout e
  ancestral do baseline executado.
- **Owner alterado:** somente `docs/testing/runs/VAL_W007_FULLSTACK_008.md`.
- **Produto:** read-only; nenhuma fonte, configuração executável, dependência, lockfile, manifest ou
  migration foi alterada.
- **Locks preservados:** `LOCK-EXT-001`, `LOCK-DATA-001`, `LOCK-ENV-001`, `LOCK-EVID-001` e
  `LOCK-TEST-001`.
- **Migração criada ou modificada:** nenhuma.

## Preparação e isolamento

O `dispatch_guard.py` aceitou e registrou a chave fornecida, retornando `DISPATCH_ALLOWED` com exit
code 0. A auditoria GitHub-aware não ficou disponível porque o executor não recebeu
`GITHUB_REPOSITORY` nem `GITHUB_TOKEN`; a validação local determinística do dispatch foi concluída.

O cenário usou Node.js `v24.19.0`, npm `11.17.0`, Java `21.0.2`, Maven `3.9.10`, PostgreSQL
`16.14`, Playwright `1.60.0` e Chromium for Testing `148.0.7778.96` (revisão `1223`). A base local
sintética `contabilidade_codex_e2e` foi recriada pelo launcher canônico. Backend, worker e frontend
escutaram somente em `127.0.0.1`; as URLs de providers apontaram para a porta local fechada
`127.0.0.1:9`, e a guarda Playwright recusou qualquer origem não local. Não foram usados segredo,
credencial, documento fiscal, CNPJ real, dado pessoal ou provider externo.

## Comandos e resultados

| Comando | Exit code | Resultado |
|---|---:|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_008 --item VAL-W007-FULLSTACK-008 --baseline 77141fae2f04a430bc2cb51264886c083977a3ce --key 226c9ff3c05b6024571a8b34eaaa9355c001b0d97870977502178db5aec5cd95 --github-aware --register` | 0 | dispatch permitido e registrado; auditoria remota indisponível por ausência das variáveis GitHub |
| `cd backend && mvn -B -DskipTests clean package` | 0 | `BUILD SUCCESS`; 164 fontes principais e 6 fontes de teste compiladas; JAR reconstruído |
| `cd frontend && npm ci --no-audit --no-fund` | 0 | 242 pacotes instalados estritamente pelo lockfile |
| `cd frontend && npm run locale:validate` | 0 | bundle `pt-BR` válido: 22 catálogos, 66 arquivos e 86 entradas dinâmicas |
| `cd frontend && npm run typecheck` | 0 | TypeScript aprovado |
| `cd frontend && npm run build` | 0 | Vite aprovou 154 módulos e produziu o bundle |
| `cd automation-worker && npm ci --no-audit --no-fund` | 0 | 13 pacotes instalados estritamente pelo lockfile |
| `cd automation-worker && npm run typecheck` | 0 | TypeScript aprovado sem emissão |
| `cd automation-worker && npm run build` | 0 | TypeScript aprovado e `dist` emitido |
| `node scripts/codex/validate-docker-orchestration.mjs` | 0 | seis contratos Docker/Buildx aprovados pelo guard estrutural |
| `node --test scripts/codex/validate-docker-orchestration.test.mjs` | 0 | 2/2 casos Node aprovados |
| `cd frontend && npm run test:a11y` | 0 | 6/6 casos aprovados: cinco rotas sem violações Axe críticas/sérias e navegação/modal por teclado |
| `bash scripts/codex/fullstack-e2e.sh` sob Node 24 | 0 | PostgreSQL/Flyway/JPA, serviços, heartbeat, proxy e 19 jornadas Playwright aprovados |
| guarda de encerramento por bind local nas portas `8080`, `3001`, `5173` e `4173`, mais `pgrep` e `pg_lsclusters` | 0 | portas livres, nenhum processo da aplicação/Playwright/Chromium órfão e cluster PostgreSQL parado |
| `git diff --check` | 0 | Markdown sem erro de whitespace |

Os avisos npm sobre a futura remoção da configuração global `http-proxy`, scripts sujeitos a
`allowScripts` e atualização opcional do npm foram informativos. No smoke a11y isolado, o proxy
local registrou `ECONNREFUSED` para APIs não mockadas porque o backend não fazia parte desse
launcher; as seis verificações locais terminaram aprovadas. Nenhum desses avisos alterou produto ou
lockfile.

## Provas full-stack e acessibilidade

| Prova | Resultado |
|---|---|
| Flyway V1–V12 | última entrada `12:true` confirmada por consulta estrita |
| JPA validate | backend iniciou contra o schema recém-migrado e readiness retornou HTTP 200 |
| liveness/readiness backend | HTTP 200 nos dois endpoints Actuator |
| saúde do worker | HTTP 200 em `/health` |
| saúde do frontend | HTTP 200 em `/` |
| proxy frontend → backend | HTTP 200 em `/api/info` |
| heartbeat persistido | `worker_heartbeats` confirmou `count(*) > 0` |
| smoke Playwright full-stack | 19 jornadas aprovadas, atendendo ao mínimo contratual |
| smoke a11y local-only | 5 rotas representativas sem violações críticas/sérias e 1 jornada de teclado aprovada |
| rede externa/provider real | zero chamadas; guards do navegador permaneceram sem achados |
| HTTP 5xx | zero nos logs temporários inspecionados pelo launcher |
| encerramento | browsers e serviços encerrados, portas liberadas e PostgreSQL parado |

O full-stack criou somente empresa, CNPJ e documento de texto sintéticos e capturou a evidência
visual temporária `/tmp/contabilidade-codex-e2e.png`. A execução não iniciou ação fiscal
autoritativa nem inferiu regularidade ou irregularidade fiscal.

## Classificação, limitações e handoff

Não ocorreu falha de produto, contrato de teste ou fixture; portanto não há classificação corretiva
nem successor. A única limitação foi `ENVIRONMENT_LIMITATION` na auditoria remota opcional do
preflight, causada pela ausência de contexto e credencial GitHub no executor. A prova obtida é
Cloud/Linux e não é alegada como prova de PowerShell, Windows, Docker Desktop, provider real ou
localhost do usuário.

- **Provas pendentes dentro do contrato:** nenhuma.
- **Successor:** `NONE`.
- **Commit/PR:** criados no handoff desta execução.
