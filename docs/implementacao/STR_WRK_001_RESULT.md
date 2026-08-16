# STR-WRK-001 — resultado

- **ITEM:** `STR-WRK-001`
- **Baseline:** `6f9f7a600a3f16db91f07be7b3cfa983c53c7f92` (checkout fornecido sem remote e sem ref local `main`)
- **Status:** `PASS_WITH_ENVIRONMENT_LIMITATION`
- **Owners alterados:** worker — seams de lease/shutdown e testes focados; este `RESULT_MD`
- **Migration:** nenhuma

## Implementação

- O relógio e os timers do loop são injetáveis, permitindo provar aquisição exclusiva, renovação
  somente durante trabalho ativo, interrupção da renovação e descarte de conclusão após expiração
  do lease sem sleeps reais.
- A espera bounded do shutdown foi extraída para um seam isolado e limpa o timer tanto na conclusão
  graciosa quanto no timeout.
- A suíte focada cobre ainda a preservação da classificação `retryable`/terminal e uma única
  tentativa de reporte por resultado, sem provider, credencial, navegação ou custo externo.
- A suíte completa passou a incluir as regressões de confiabilidade.

## Locks preservados

- `LOCK-EXT-001`: doubles locais; nenhuma chamada a provider fiscal real.
- `LOCK-COST-001`: nenhuma chamada paga ou implementação de provider foi exercitada/alterada.
- `LOCK-AUT-001`: nenhuma automação de CAPTCHA, MFA, anti-bot ou intervenção humana.
- `LOCK-TEST-001`: o único erro da suíte completa foi classificado como
  `ENVIRONMENT_LIMITATION` (binário Chromium ausente); produção não foi alterada para mascará-lo.

## Validação (Node 24.19.0)

| Comando | Resultado |
|---|---|
| `node --version` (binário Node 24 obtido por `npx --yes node@24`) | `PASS` — `v24.19.0` |
| `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` | `PASS` |
| `node node_modules/typescript/bin/tsc -p tsconfig.json` | `PASS` |
| `node --test --test-concurrency=1 dist/reliability.test.js` | `PASS` — 4/4 testes |
| `node --test --test-concurrency=1 dist/worker.test.js dist/reliability.test.js` | `ENVIRONMENT_LIMITATION` — 10/11 passaram; smoke local não iniciou porque o executável Chromium do Playwright não está instalado |
| `git diff --check` | `PASS` |

Os testes focados usam apenas doubles em memória e não abrem rede externa. A tentativa de instalar
browser foi deliberadamente evitada para manter o bloqueio de rede externa solicitado.

## Limitações e provas pendentes

- O smoke Playwright local deve ser repetido em ambiente com o Chromium 1223 correspondente já
  provisionado. A falha ocorreu antes de qualquer navegação e não representa regressão do produto.
- O checkout não possui remote/ref `main`; portanto, o baseline mais recente verificável é o HEAD
  fornecido.

## Commit e PR

- Commit de implementação: `07b6fa6`.
- PR: `NOT_CREATED_ENVIRONMENT_LIMITATION` — o checkout não possui remote Git e o ambiente não
  disponibiliza a ferramenta `make_pr`.
