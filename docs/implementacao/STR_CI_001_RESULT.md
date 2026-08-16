# STR-CI-001 — required gate estável

**ITEM:** `STR-CI-001`
**WAVE_ID:** `CONTABILIDADE_QUALITY_GATE_WAVE_005`
**DISPATCH_KEY:** `d26681eceae7b6f3332378b27b3ce7e0b98f540519641153774217257f0a825f`
**Baseline do dispatch:** `c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`
**Checkout recebido (latest main):** `f9559a5ecafd4fdbf2fed59c2736ab8c5303538d`
**Status:** `IMPLEMENTADO_AGUARDANDO_INTEGRACAO`

## Resultado

Foi criado o workflow obrigatório de nome estável `Required CI`, cujo check agregador estável é
`Required CI / required-ci`. O agregador usa `if: always()`, depende exatamente de `governance`,
`backend-postgresql`, `frontend` e `worker`, e falha se qualquer conclusão não for `success`.
Nenhuma lane obrigatória usa `continue-on-error`. A branch protection não foi alterada.

A lane de governança reúne guards e testes de governança, manifests de onda, packs de prompt e
launcher, dispatch duplicado, registro de migrations, versão, segredo/PII e política determinística
de SBOM/licenças. O scan advisory dependente de rede continua separado no workflow existente e não
é mascarado como sucesso pelo required gate.

A lane backend usa Java 21, verifica Docker, rejeita edição de migration Flyway preexistente e
executa `mvn -B clean verify -Dsurefire.failIfNoTests=true`; assim a suíte inclui a prova
Testcontainers/PostgreSQL 17 e uma ausência silenciosa de testes falha. Frontend usa Node 24 e roda
instalação locked, locale, typecheck, suíte e build. Worker usa Node 24, instala Chromium compatível
com Playwright `1.60.0` antes da suíte, e roda typecheck, a suíte completa (incluindo
`reliability.test`) e build; o smoke existente prova que navegação externa é abortada.

O validador de contrato usa somente Python standard library e o parser YAML nativo do Ruby. Os
testes mutantes cobrem nome estável, remoção de cada lane, `needs` incompleto, `continue-on-error`
em job ou step, perda da prova backend, perda de Chromium/suíte worker e gate final pulável.

## Owners alterados e locks preservados

- owners alterados: novo `.github/workflows/required-ci.yml`, novo `scripts/ci/**` e este resultado;
- workflows existentes, código de produto, manifests, lockfiles, migrations, checkpoint, ledger e
  manifests de onda permaneceram read-only;
- `LOCK-GIT-001`: integração será definida pelo GitHub via PR, sem push direto na `main`;
- `LOCK-EVID-001`: provas locais válidas foram reutilizadas e o runtime indisponível foi separado;
- `LOCK-TEST-001`: ausência de Docker foi classificada como `ENVIRONMENT_LIMITATION`, sem mudança de
  produção para forçar verde;
- `LOCK-DB-001`: PostgreSQL 17/Testcontainers é a prova persistente e migrations aplicadas são
  protegidas contra edição; Flyway permanece o mecanismo exclusivo.

## Validações

- parser/contrato: `python3 scripts/ci/validate_required_ci.py` — `PASS`;
- testes do contrato: `python3 -m unittest discover -s scripts/ci -p 'test_*.py' -v` — `PASS` (8);
- parser YAML: `ruby -e "require 'yaml'; YAML.safe_load(File.read('.github/workflows/required-ci.yml'), aliases: true)"` — `PASS`;
- governance lane proporcional: guards de governança, manifests, três packs, migrations, versão,
  segredo/PII e testes determinísticos — `PASS` (21 orchestration, 3 migration, 6 version, 3
  secret/PII e 7 dependency scenarios);
- `bash scripts/dependencies/generate-sboms.sh` — `PASS` (três SBOMs normalizadas e política válida);
- frontend: `npm ci --no-audit --no-fund && npm run locale:validate && npm run typecheck && npm test && npm run build` — `PASS` (7 arquivos/20 testes e build);
- worker: `npm ci --no-audit --no-fund && npx playwright@1.60.0 install --with-deps chromium && npm run typecheck && npm test && npm run build` — `PASS` (Chromium provisionado e 11 testes);
- backend estrutural: `mvn -B clean test-compile -DskipTests` — `PASS`;
- `git diff --check` — `PASS`.

## Limitações e provas pendentes

O ambiente local não possui o comando Docker. Por isso, `docker info && mvn -B clean verify
-Dsurefire.failIfNoTests=true` não pôde executar a prova Testcontainers/PostgreSQL 17 e foi
classificado como `ENVIRONMENT_LIMITATION`; compile e test-compile passaram, mas não substituem a
prova runtime. O runner do workflow (`ubuntu-latest`) fornece Docker e deve executar essa prova.

O ambiente local usa Node 20 e emitiu `EBADENGINE`; as provas frontend/worker ainda passaram, mas o
workflow fixa Node 24, que é o runner suportado e a prova autoritativa pendente. Não há remoto nem
autenticação GitHub configurados no checkout (`gh auth status` informa ausência de login), portanto
não há URL/ID de execução remota disponível antes da criação da PR pelo ambiente de entrega.

## Commit/PR

`661a496` (`ci: add stable required quality gate`). PR: `NOT_CREATED_ENVIRONMENT_LIMITATION` porque este checkout não possui remoto, credenciais GitHub ou ferramenta `make_pr` disponível.
