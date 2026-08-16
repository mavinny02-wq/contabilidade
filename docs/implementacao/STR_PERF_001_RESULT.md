# STR-PERF-001 — resultado

**ITEM:** `STR-PERF-001`
**STATUS:** `PASS_WITH_ENVIRONMENT_NOTE`
**WAVE:** `CONTABILIDADE_QUALITY_GATE_WAVE_005`
**DISPATCH_KEY:** `e7203ebb99c0a8858c4c7c2ee8071c11f7e58356d874c45876e6a81251e7d9a1`
**BASELINE despachada:** `c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`
**HEAD de execução:** `f9559a5ecafd4fdbf2fed59c2736ab8c5303538d`

## Entrega e owners

- criado `scripts/performance/**` com medição, ratchet, baseline real, budgets, documentação e
  testes de fixtures;
- criado somente este `RESULT_MD` no owner documental permitido;
- código de produto, manifests, lockfiles, Dockerfiles, migrations e gates existentes permaneceram
  inalterados;
- preservados `LOCK-EVID-001`, `LOCK-TEST-001` e `LOCK-EXT-001`; nenhuma fonte externa fiscal foi
  chamada.

## Baseline e repetibilidade

Foram feitos dois builds limpos, removendo `backend/target`, `frontend/dist` e
`automation-worker/dist` antes de cada rodada. Todos os escalares de tamanho e quantidade foram
idênticos:

| componente | métricas principais |
|---|---|
| backend | JAR 70.423.857 bytes; 454 entries; maior entry 12.093.295 bytes |
| frontend | `dist` 567.372 bytes; maior JS 543.274 bytes bruto/157.660 gzip; CSS 23.435 bruto/5.239 gzip; 4 arquivos, 2 assets e 2 JS |
| worker | `dist`/código próprio 375.245 bytes; 72 arquivos; maior arquivo 22.169 bytes |

O hash do JAR variou entre `3850ac5f...` e `4ae24fde...` porque timestamps de entries ZIP mudam no
reempacotamento Maven. O guard de repetibilidade normaliza somente SHA/lista diagnóstica, mantém os
hashes brutos no baseline e compara todos os escalares. Frontend e worker foram determinísticos.

As tolerâncias são margens pequenas e explícitas sobre variação observada zero: 64 KiB para tamanhos
do backend, até 8 KiB no frontend e até 4 KiB no worker. Contagens têm tolerância zero. Reduções
sempre passam; crescimento além do limite falha. Exceções exigem componente, métrica, owner, motivo e
data de expiração válida.

O chunk frontend histórico permanece em 543.274 bytes e dispara o warning Vite acima de 500 kB.
Isso é baseline, não aprovação permanente; o successor recomendado é `STR-FE-BUNDLE-001`, sem
executar redução nesta task.

## Comandos e resultados

- dispatch preflight: `DISPATCH_ALLOWED`; auditoria GitHub indisponível por ausência de
  `GITHUB_REPOSITORY`/`GITHUB_TOKEN`;
- `cd backend && mvn -q -DskipTests package` — `PASS` nas duas rodadas;
- `cd frontend && npm run locale:validate && npm run typecheck && npm run build` — `PASS`; warning
  histórico do chunk >500 kB preservado;
- `cd automation-worker && npm run typecheck && npm run build` — `PASS`;
- `python3 -m unittest scripts/performance/test_artifact_budget.py` — `PASS`, 5 testes cobrindo
  baseline, crescimento tolerado/bloqueado, redução, ausência, novo componente, exceção válida e
  expirada e não repetibilidade;
- `artifact_budget.py reproducible` — `PASS` para as duas medições reais;
- `artifact_budget.py guard` — `PASS` contra o baseline versionado;
- `git diff --check` — `PASS`.

## Limitações e provas pendentes

- O ambiente forneceu Node `20.20.2`, abaixo do engine declarado (`>=22.12.0`; e `pdfjs-dist` requer
  `>=22.13.0 || >=24`). Builds e medições passaram, mas uma futura campanha pode repetir o baseline
  com Node suportado antes de promovê-lo a comparação entre ambientes.
- A execução mede somente artefatos Linux; não prova runtime, latência, throughput, browser,
  acessibilidade, Windows/Docker Desktop ou provider.
- Commit e PR são preenchidos pelo handoff Git após a criação correspondente.

## Commit/PR

- **Commit de implementação:** `e9ba1f0c5181d09d51b19615d6765bfec5ccb43d`
- **PR:** `NOT_CREATED_ENVIRONMENT_LIMITATION` — o ambiente não expôs a ferramenta `make_pr`, não possui remote Git nem credenciais GitHub.
