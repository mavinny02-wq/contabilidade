# STR-ARCH-002 — resultado

- **ITEM:** `STR-ARCH-002`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_008`
- **BASELINE executado:** `c5f414061161eaf0e131cf8ceea64cf73f95e32c` (latest main disponível no checkout; o dispatch foi autorizado contra `77141fae2f04a430bc2cb51264886c083977a3ce`)
- **STATUS:** `SUCCESS`
- **OWNERS alterados:** worker index/composition/testes focados; baseline e allowlist de arquitetura; este resultado
- **MIGRATION:** `NONE`

## Implementação

O `index.ts` deixou de conhecer as quatro classes concretas. A nova composition layer mantém a
ordem Federal, SEFAZ-SP, PGE-SP e Serpro e oferece factories injetáveis, sem service locator. Os
testes sintéticos verificam ordem, capacidades, ausência de provider não fornecido e o contrato
exato da composição padrão (códigos, operações e modos `PORTAL`/`API`).

O inventário passou de 10 para 6 findings. As quatro ocorrências
`worker.core_to_provider` foram eliminadas da allowlist; os seis findings backend e suas datas de
revisão permaneceram inalterados.

## Locks preservados

- `LOCK-EXT-001`: nenhuma chamada a provider real ou rede externa.
- `LOCK-AUT-001`: nenhuma mudança em CAPTCHA, MFA, anti-bot ou intervenção humana.
- `LOCK-EVID-001`: validações focadas e determinísticas; inventário/check repetidos.
- `LOCK-TEST-001`: a falha inicial de tipagem da fixture sintética foi classificada como
  `TEST_CONTRACT_DRIFT` e corrigida apenas no teste, sem mudar produção.

## Validação e resultados

- `dispatch_guard.py ... --github-aware --register`: `DISPATCH_ALLOWED`; auditoria remota reportou
  `GITHUB_UNAVAILABLE` por ausência das variáveis de autenticação.
- Node `v24.19.0`.
- `npm ci --no-audit --no-fund`: concluído sem alterar dependências.
- `npm run typecheck`: passou.
- `npm run build`: passou.
- `node --test --test-concurrency=1 dist/composition/WorkerFlowComposition.test.js`: 3 testes
  focados passaram.
- `python3 scripts/architecture/architecture_guard.py inventory --output scripts/architecture/baseline.json`: passou e foi repetido de forma determinística.
- `python3 scripts/architecture/architecture_guard.py check`: passou duas vezes, com 600 arestas e
  6 findings permitidos.
- `git diff --check`: passou.

## Limitações e provas pendentes

Validação estrutural não prova runtime de browser, provider, backend ou Windows. Nenhuma dessas
provas foi executada ou alegada. Não há prova pendente dentro do aceite estrutural desta task.

## Commit e PR

- **COMMIT:** este commit (`STR-ARCH-002`).
- **PR:** criado após o commit pelo fluxo de entrega da task.
