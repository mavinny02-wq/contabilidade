# VAL-W011-FULLSTACK-012 — smoke do HEAD pós-Wave 011

## Identificação

- **ITEM:** `VAL-W011-FULLSTACK-012`.
- **Wave:** `CONTABILIDADE_FAST_LANE_WAVE_012`.
- **DISPATCH_KEY:** `ff45c84916215ff6f7b65e0dc9ef136eb1ad2267c9e3011ac3fb57475f2dcda0`.
- **Data:** 17/08/2026 (UTC).
- **Status:** `FAIL`.
- **Classificação:** `TEST_CONTRACT_DRIFT`.
- **Baseline executado:** `56ff65fd4d83a33aab422fbc95cd963fabc83ce8` (`latest main`
  disponível no checkout; release documental da Wave 012).
- **Baseline do dispatch:** `3850443701279e2002c527b6eb376de8abd664cf`, presente no checkout,
  ancestral direto do baseline executado e sem mudança posterior de produto.
- **Owner alterado:** somente `docs/testing/runs/VAL_W011_FULLSTACK_012.md`.
- **Produto:** read-only; nenhuma fonte, configuração executável, dependência, lockfile, manifest ou
  migration foi alterada.
- **Locks preservados:** `LOCK-EXT-001`, `LOCK-DATA-001`, `LOCK-ENV-001`, `LOCK-EVID-001` e
  `LOCK-TEST-001`.
- **Migração criada ou modificada:** nenhuma.

## Preparação e isolamento

O dispatch preflight aceitou e registrou localmente a chave publicada, retornando
`DISPATCH_ALLOWED`. A auditoria GitHub-aware não ficou disponível porque o executor não recebeu
`GITHUB_REPOSITORY` nem `GITHUB_TOKEN`; isso não impediu a validação determinística local. O
registro transitório criado pelo preflight foi removido antes do handoff para preservar o owner
exato.

O ambiente usou Node.js `v24.19.0`, npm `11.17.0`, Java `21.0.2`, Maven `3.9.10`, PostgreSQL
`16.14`, Playwright frontend `1.55.0` e Playwright worker `1.60.0`. PostgreSQL e os browsers
compatíveis ausentes foram provisionados no ambiente efêmero. A primeira execução dos testes do
worker encontrou Chromium ausente; após a preparação autorizada, a repetição focada passou 15/15.

A base sintética `contabilidade_codex_e2e` foi recriada pelo launcher canônico. Backend, worker e
frontend escutaram somente em `127.0.0.1`; providers apontaram para a porta local fechada
`127.0.0.1:9`, e o Playwright recusou origens não locais. Não foram usados segredo, credencial,
documento fiscal, CNPJ real, dado pessoal ou provider externo.

## Comandos e resultados

| Comando | Exit code | Resultado |
|---|---:|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_012 --item VAL-W011-FULLSTACK-012 --baseline 3850443701279e2002c527b6eb376de8abd664cf --key ff45c84916215ff6f7b65e0dc9ef136eb1ad2267c9e3011ac3fb57475f2dcda0 --github-aware --register` | 0 | dispatch permitido; auditoria remota indisponível por ausência das variáveis GitHub |
| `cd backend && mvn -B -DskipTests clean package` | 0 | `BUILD SUCCESS`; 171 fontes principais e 19 fontes de teste compiladas sem executar a suíte |
| `cd backend && mvn -B -Dtest=ConsoleTecnicaAuthorizationTest,TratadorGlobalExcecoesTest,DocumentoServiceTest,EmpresaDocumentoAdapterTest test` | 0 | 8 testes focados aprovados; 403, erro interno e wiring documental cobertos |
| `cd frontend && npm ci --no-audit --no-fund` sob Node 24 | 0 | 242 pacotes instalados estritamente pelo lockfile |
| `cd frontend && npm run locale:validate` | 0 | bundle `pt-BR` válido: 22 catálogos, 67 arquivos e 86 entradas dinâmicas |
| `cd frontend && npm run typecheck` | 0 | TypeScript aprovado |
| `cd frontend && npm test` | 0 | 9 arquivos e 26 testes Vitest aprovados |
| `cd frontend && npm run build` | 0 | Vite aprovou 154 módulos e produziu chunks lazy separados |
| `cd automation-worker && npm ci --no-audit --no-fund` sob Node 24 | 0 | 13 pacotes instalados estritamente pelo lockfile |
| `cd automation-worker && npm run typecheck` | 0 | TypeScript aprovado sem emissão |
| `cd automation-worker && npm test` antes da preparação do browser | 1 | Chromium ausente; `ENVIRONMENT_LIMITATION` transitória, sem falha de produto |
| `cd automation-worker && npx playwright install --with-deps chromium` | 0 | browser compatível e bibliotecas efêmeras provisionados |
| `cd automation-worker && npm test && npm run build` | 0 | repetição focada: 15/15 testes aprovados e `dist` emitido |
| `node scripts/codex/validate-docker-orchestration.mjs` | 0 | doze contratos Docker/startup aprovados estruturalmente |
| `node --test scripts/codex/validate-docker-orchestration.test.mjs` | 0 | 4/4 casos do guard aprovados |
| `python3 scripts/architecture/architecture_guard.py check` | 0 | 601 edges e zero findings permitidos |
| `python3 scripts/security/iam/iam_guard.py` | 0 | `PASS`, sem findings |
| `python3 scripts/environment/environment_guard.py` | 0 | inventário determinístico de seis arquivos aprovado |
| `python3 scripts/security/secret-lifecycle/secret_lifecycle_guard.py` | 0 | `PASS`, sem findings |
| `python3 -m unittest scripts.release.promotion.tests.test_promotion_guard` | 0 | 7/7 contratos de promotion aprovados |
| `python3 scripts/release/promotion/promotion_guard.py scripts/release/promotion/fixtures/valid-promotion.json --target-frontier 12 --expected-digests scripts/release/promotion/fixtures/expected-digests.json --expected-version 0.5.1 --expected-commit 1111111111111111111111111111111111111111 --now 2026-08-17T00:00:00Z --format json` | 0 | fixture offline válida retornou `PASS`, sem erro |
| `python3 scripts/recovery/forbidden_command_guard.py` | 0 | `RECOVERY_FORBIDDEN_COMMAND_GUARD_OK` |
| `cd frontend && npx playwright install chromium && npm run test:a11y` | 0 | 6/6 casos locais aprovados após provisionar o Chromium esperado |
| `bash scripts/codex/fullstack-e2e.sh` sob Node 24 | 0 | PostgreSQL/Flyway/JPA, serviços, heartbeat, proxy, upload/leitura e 19 jornadas aprovados |
| verificação por sockets locais, `pg_lsclusters` e `pgrep` após o launcher | 0 | portas `8080`, `3001`, `5173`, `4173` e `5432` livres; cluster parado e sem processo órfão da aplicação/browser |

Os avisos npm sobre `http-proxy`, scripts sujeitos a `allowScripts` e atualização opcional do npm
foram informativos. No smoke a11y isolado, o proxy local registrou `ECONNREFUSED` para APIs não
mockadas porque o backend não integra esse launcher; as seis verificações terminaram aprovadas.

## Provas full-stack e acessibilidade

| Prova | Resultado |
|---|---|
| Flyway V1–V12 | última entrada `12:true` confirmada por consulta estrita |
| JPA validate | backend iniciou contra o schema recém-migrado e readiness retornou HTTP 200 |
| liveness/readiness backend | HTTP 200 nos dois endpoints Actuator |
| saúde do worker | HTTP 200 em `/health` |
| frontend servido | HTTP 200 em `/` pelo Vite local |
| frontend `/healthz` | **não exercitado**: existe no contrato Nginx, mas o launcher canônico inicia Vite e consulta `/`; Docker Engine não está instalado neste executor |
| proxy frontend → backend | HTTP 200 em `/api/info` |
| heartbeat persistido | `worker_heartbeats` confirmou `count(*) > 0` |
| documento sintético | criação da empresa, upload de texto, leitura autenticada do conteúdo e download aprovados nas jornadas 11–15 |
| códigos de autenticação/erro | testes focados mantiveram acesso negado em 403 e erro inesperado em 500; o smoke preservou 401 no contrato autenticado |
| smoke Playwright full-stack | 19 jornadas aprovadas |
| smoke a11y local-only | 5 rotas sem violações críticas/sérias e 1 jornada de teclado aprovada |
| rede externa/provider real | zero chamadas; guards do browser permaneceram sem achados |
| HTTP 5xx runtime | zero nos logs temporários inspecionados pelo launcher |
| encerramento | browsers e serviços encerrados, portas liberadas e PostgreSQL parado |

O full-stack criou somente empresa, CNPJ e documento de texto sintéticos. Não iniciou ação fiscal
autoritativa nem inferiu regularidade ou irregularidade fiscal.

## Classificação, limitações e handoff

O resultado global é `FAIL`, apesar dos gates de produto executados estarem verdes, porque o aceite
exige prova de `frontend /healthz`. O launcher canônico `scripts/codex/fullstack-e2e.sh` inicia o
servidor Vite e comprova `/`, enquanto `/healthz` pertence ao Nginx da imagem; o ambiente não possui
Docker Engine para executar essa imagem. A divergência entre o shard obrigatório e o launcher de
evidência é `TEST_CONTRACT_DRIFT`, e esta task read-only não pode alterar o launcher nem reduzir o
critério. A ausência de Docker também preserva `LOCK-ENV-001`: nenhuma prova de Docker Desktop ou
Windows é alegada.

- **Successor bounded:** adaptar o owner de teste para exercitar o frontend Nginx em loopback e
  comprovar `/healthz` (sem provider externo), ou reconciliar explicitamente o critério com o
  launcher; depois repetir somente a prova `/healthz` e a guarda de encerramento.
- **Provas pendentes dentro do contrato:** HTTP 200 real de `frontend /healthz`.
- **Limitações:** auditoria GitHub remota indisponível; Docker Engine/Buildx, Windows e Docker
  Desktop ausentes. Os contratos Docker/startup foram validados somente de forma estrutural.
- **Commit:** criado no handoff; PR não criado porque o checkout não possui remote Git e o ambiente
  não expõe integração `make_pr`.
