# VAL-W008-FULLSTACK-009 — smoke pós-Wave 008

## Identificação

- **ITEM:** `VAL-W008-FULLSTACK-009`.
- **Wave:** `CONTABILIDADE_FAST_LANE_WAVE_009`.
- **DISPATCH_KEY:** `bcdc73d37e0142413803761e8d2d02289d9f2ce57b2b3102a4c0bb38fc7658f0`.
- **Data:** 17/08/2026 (UTC).
- **Status:** `FAIL`.
- **Classificação:** `BASELINE_DRIFT`.
- **Baseline executado:** `cd11fb439420708756d9de9c1e62483a839cbd8d` (`latest main` disponível no
  checkout; merge do PR #108).
- **Baseline do dispatch:** `357dd4b8827c0c9620d0dd7e8398bc3468418ff9`, presente no checkout e
  ancestral do baseline executado.
- **Owner alterado:** somente `docs/testing/runs/VAL_W008_FULLSTACK_009.md`.
- **Produto:** read-only; nenhuma fonte, configuração executável, dependência, lockfile, manifest ou
  migration foi alterada.
- **Locks preservados:** `LOCK-EXT-001`, `LOCK-DATA-001`, `LOCK-ENV-001`, `LOCK-EVID-001` e
  `LOCK-TEST-001`.
- **Migração criada ou modificada:** nenhuma.

## Preparação e isolamento

O `dispatch_guard.py` aceitou e registrou a chave publicada usando o baseline canônico do manifest,
retornando `DISPATCH_ALLOWED`. A auditoria GitHub-aware não ficou disponível porque o executor não
recebeu `GITHUB_REPOSITORY` nem `GITHUB_TOKEN`; a validação local determinística do dispatch foi
concluída. O primeiro preflight com o SHA materializado de `latest main` foi corretamente recusado
por não corresponder à chave derivada do baseline do manifest e não foi registrado.

O cenário usou Node.js `v24.19.0`, npm `11.17.0`, Java `21.0.2`, Maven `3.9.10`, PostgreSQL
`16.14`, Playwright frontend `1.55.0`, Playwright worker `1.60.0` e Chrome for Testing
`148.0.7778.96`. PostgreSQL e os browsers ausentes foram provisionados no ambiente efêmero antes
da repetição focada. A primeira tentativa a11y, antes da instalação do Chromium correspondente,
falhou por `ENVIRONMENT_LIMITATION`; depois da preparação, os 6 casos passaram.

A base sintética `contabilidade_codex_e2e` foi recriada pelo launcher canônico. Backend, worker e
frontend escutaram somente em `127.0.0.1`; providers apontaram para a porta local fechada
`127.0.0.1:9`, e a guarda Playwright recusou qualquer origem não local. Não foram usados segredo,
credencial, documento fiscal, CNPJ real, dado pessoal ou provider externo.

## Comandos e resultados

| Comando | Exit code | Resultado |
|---|---:|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_009 --item VAL-W008-FULLSTACK-009 --baseline 357dd4b8827c0c9620d0dd7e8398bc3468418ff9 --key bcdc73d37e0142413803761e8d2d02289d9f2ce57b2b3102a4c0bb38fc7658f0 --github-aware --register` | 0 | dispatch permitido; auditoria remota indisponível por ausência das variáveis GitHub |
| `cd backend && mvn -B -DskipTests clean package` | 0 | `BUILD SUCCESS`; 165 fontes principais e 7 fontes de teste compiladas; JAR reconstruído sem executar testes |
| `cd frontend && npm ci --no-audit --no-fund` | 0 | 242 pacotes instalados estritamente pelo lockfile |
| `cd frontend && npm run locale:validate` | 0 | bundle `pt-BR` válido: 22 catálogos, 66 arquivos e 86 entradas dinâmicas |
| `cd frontend && npm run typecheck` | 0 | TypeScript aprovado |
| `cd frontend && npm run build` | 0 | Vite aprovou 154 módulos e produziu o bundle com chunks lazy separados |
| `cd automation-worker && npm ci --no-audit --no-fund` | 0 | 13 pacotes instalados estritamente pelo lockfile |
| `cd automation-worker && npm run typecheck` | 0 | TypeScript aprovado sem emissão |
| `cd automation-worker && npm run build` | 0 | TypeScript aprovado e `dist` emitido |
| `node scripts/codex/validate-docker-orchestration.mjs` | 0 | seis contratos Docker/Buildx aprovados pelo guard estrutural |
| `node --test scripts/codex/validate-docker-orchestration.test.mjs` | 0 | 2/2 casos Node aprovados |
| `python3 scripts/observability/alert_guard.py` | 0 | 15 alertas, 7 SLOs e 4 fixtures aprovados |
| `python3 -m unittest scripts.observability.test_alert_guard` | 0 | teste determinístico do guard de alertas aprovado |
| `python3 scripts/architecture/architecture_guard.py check` | 1 | grafo atual diverge de `scripts/architecture/baseline.json`; gate obrigatório vermelho |
| `python3 -m unittest scripts.architecture.tests.test_architecture_guard` | 0 | 4 testes do mecanismo do guard aprovados |
| `cd automation-worker && node --test dist/composition/WorkerFlowComposition.test.js` | 0 | 3/3 casos aprovados; quatro providers, operações e modos preservados pela composição padrão |
| `cd frontend && npm run test:a11y` após instalar o Chromium esperado | 0 | 6/6 casos aprovados: cinco rotas sem violações Axe críticas/sérias e navegação/modal por teclado |
| `bash scripts/codex/fullstack-e2e.sh` sob Node 24 | 0 | PostgreSQL/Flyway/JPA, serviços, heartbeat, proxy e 19 jornadas Playwright aprovados |
| guarda de encerramento por bind local nas portas `8080`, `3001`, `5173` e `4173`, mais `pgrep` e `pg_lsclusters` | 0 | portas livres, nenhum processo da aplicação/Playwright/Chromium órfão e cluster PostgreSQL parado |
| `git diff --check` | 0 | Markdown sem erro de whitespace |

Os avisos npm sobre `http-proxy`, scripts sujeitos a `allowScripts` e atualização opcional do npm
foram informativos. No smoke a11y isolado, o proxy local registrou `ECONNREFUSED` para APIs não
mockadas porque o backend não fazia parte desse launcher; as seis verificações terminaram
aprovadas. Nenhum aviso alterou produto ou lockfile.

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
| lazy routes | build produziu chunk `routePages`; as rotas representativas carregaram no browser |
| registro de providers | `FEDERAL_PORTAL`, `PGE_SP_PORTAL`, `SEFAZ_SP_PORTAL` e `SERPRO`, com operações e modos esperados, aprovados no teste focado |
| smoke Playwright full-stack | 19 jornadas aprovadas, atendendo ao mínimo contratual |
| smoke a11y local-only | 5 rotas sem violações críticas/sérias e 1 jornada de teclado aprovada |
| rede externa/provider real | zero chamadas; guards do navegador permaneceram sem achados |
| HTTP 5xx | zero nos logs temporários inspecionados pelo launcher |
| encerramento | browsers e serviços encerrados, portas liberadas e PostgreSQL parado |

O full-stack criou somente empresa, CNPJ e documento de texto sintéticos e capturou a evidência
visual temporária `/tmp/contabilidade-codex-e2e.png`. A execução não iniciou ação fiscal
autoritativa nem inferiu regularidade ou irregularidade fiscal.

## Classificação, limitações e handoff

O resultado global é `FAIL`, apesar dos gates runtime verdes, porque o aceite exige todos os gates
obrigatórios e o guard arquitetural detectou que o grafo executável atual não corresponde ao
baseline versionado. O inventário diagnóstico manteve 6 findings, mas mudou o grafo após a nova
composição do worker; isso caracteriza `BASELINE_DRIFT`, não autoriza regenerar baseline dentro
desta task read-only e não indica, por si só, regressão funcional.

- **Successor:** reconciliar de forma revisada `scripts/architecture/baseline.json` com o grafo
  atual, serializado com o owner arquitetural `STR-ARCH-BE-003`, e repetir somente
  `python3 scripts/architecture/architecture_guard.py check` antes de promover este resultado.
- **Provas pendentes dentro do contrato:** guard arquitetural verde.
- **Limitações:** auditoria GitHub remota opcional indisponível; Docker Engine/Buildx e
  Testcontainers não estavam presentes, portanto nenhuma prova de daemon, container crítico,
  Windows ou Docker Desktop é alegada. Os contratos Docker/Buildx foram validados estruturalmente.
- **Commit/PR:** criados no handoff desta execução.
