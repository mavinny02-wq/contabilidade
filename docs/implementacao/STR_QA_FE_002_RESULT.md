# STR-QA-FE-002 — resultado

## Identificação

- **ITEM:** `STR-QA-FE-002`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_009`
- **DISPATCH_KEY:** `3920c8e51fb1074265fe89c5f6262544fd16e7796b0085f0ef92fbcf649e768f`
- **BASELINE da onda:** `357dd4b8827c0c9620d0dd7e8398bc3468418ff9`
- **Checkout executado:** `cd11fb439420708756d9de9c1e62483a839cbd8d` (`latest main` disponível)
- **STATUS:** `PASS_COMPLETE`
- **complete:** `true`
- **Owners alterados:** teste de acessibilidade frontend, seção `frontend` do baseline de coverage e
  este resultado
- **Produção:** read-only; nenhum arquivo de `frontend/src` foi alterado
- **Migration:** nenhuma

## Implementação e evidência

- O smoke de teclado agora aguarda o skip link ficar visível antes de iniciar a sequência de foco.
  A primeira falha após provisionar o browser foi classificada como `TEST_CONTRACT_DRIFT`: o teste
  pressionava `Tab` antes de o shell assíncrono montar, embora o link existisse e fosse o primeiro
  controle focável. A correção ficou restrita ao teste.
- A prova usou Node `24.19.0`, Vitest `3.2.4` e `@vitest/coverage-v8` `3.2.4`.
- A suíte unitária completa aprovou 8 arquivos e 24 testes. Duas execuções consecutivas de coverage
  produziram arquivos `coverage-summary.json` byte a byte idênticos e os mesmos contadores:
  - linhas: `795/6180` (`12.8641%`);
  - branches: `79/142` (`55.6338%`);
  - funções: `33/86` (`38.3721%`);
  - statements: `795/6180` (`12.8641%`).
- Todos os percentuais cresceram em relação ao baseline anterior. A tolerância canônica de `0.01`
  ponto percentual, as demais seções e os thresholds permaneceram inalterados.
- O smoke a11y final aprovou 6/6 cenários após o provisionamento local de Chromium e das bibliotecas
  de sistema. As recusas esperadas dos proxies de API não foram tratadas como prova de negócio.

## Locks preservados

- `LOCK-DATA-001`: somente fixtures sintéticas do smoke foram usadas; nenhuma credencial ou dado
  real foi introduzido.
- `LOCK-EVID-001`: os dois relatórios consecutivos foram comparados diretamente e o rerun a11y foi
  focado nas limitações/falha classificadas.
- `LOCK-TEST-001`: a ausência inicial do Chromium foi classificada como `ENVIRONMENT_LIMITATION` e
  provisionada sem mudança de produto; a falha de timing seguinte foi classificada como
  `TEST_CONTRACT_DRIFT` antes da correção exclusiva do teste.

## Comandos e resultados

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_009 --item STR-QA-FE-002 --baseline 357dd4b8827c0c9620d0dd7e8398bc3468418ff9 --key 3920c8e51fb1074265fe89c5f6262544fd16e7796b0085f0ef92fbcf649e768f --github-aware --register` | `DISPATCH_ALLOWED`; auditoria remota indisponível sem `GITHUB_REPOSITORY`/`GITHUB_TOKEN` |
| `mise install node@24` | Node `v24.19.0` provisionado |
| `npm ci --no-audit --no-fund` | `PASS`; 242 pacotes instalados a partir do lockfile |
| `npm run locale:validate` | `PASS`; 22 catálogos, 66 arquivos e 86 entradas dinâmicas |
| `npm run typecheck` | `PASS` |
| `npm test` | `PASS`; 8 arquivos e 24 testes |
| `npm run test:coverage` (duas vezes consecutivas) | `PASS`; medições idênticas |
| `cmp /tmp/str-qa-fe-002-coverage-1.json /tmp/str-qa-fe-002-coverage-2.json` | `PASS`; arquivos idênticos |
| `npm run build` | `PASS`; build Vite concluído |
| `npx playwright install chromium && npx playwright install-deps chromium` | Chromium pinado e dependências locais provisionados após `ENVIRONMENT_LIMITATION` inicial |
| `npm run test:a11y` (final) | `PASS`; 6/6 |
| `python3 scripts/quality/coverage_ratchet.py --baseline /tmp/str-qa-fe-002-baseline-before.json --current scripts/quality/coverage-baseline.json` | `PASS` |
| `git diff --check` | `PASS` |

## Limitações e provas pendentes

- A auditoria remota GitHub-aware não ocorreu porque o ambiente não expõe
  `GITHUB_REPOSITORY`/`GITHUB_TOKEN`; o guard local validou e registrou o dispatch.
- Não há prova Windows, Docker Desktop, backend, banco ou provider fiscal, e esta task não as
  reivindica.

## Commit e PR

- **Commit:** registrado nesta branch com a mensagem `test(frontend): refresh coverage baseline`.
- **PR:** pendente; o ambiente não disponibilizou a ferramenta `make_pr`, remoto Git ou credenciais
  GitHub para criação do PR.
