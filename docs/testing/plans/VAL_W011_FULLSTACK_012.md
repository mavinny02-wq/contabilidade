# VAL-W011-FULLSTACK-012 — smoke do HEAD pós-Wave 011

**Status:** `RELEASED_FOR_EXECUTION`
**Wave:** `CONTABILIDADE_FAST_LANE_WAVE_012`
**Baseline:** `main@3850443701279e2002c527b6eb376de8abd664cf`
**Migration:** `NONE`
**Produto:** `READ_ONLY`

## Objetivo

Comprovar que as mudanças integradas na Wave 011 não introduziram regressão transversal:

- `AccessDeniedException` mapeada para 403 seguro;
- `DocumentoService` composto por porta/adapter da feature Empresa;
- architecture guard com zero findings;
- tooling de secrets, release e recovery sem impacto no runtime.

## Owner

Escrita permitida somente em:

`docs/testing/runs/VAL_W011_FULLSTACK_012.md`

Backend, frontend, worker, scripts, manifests, migrations, dependências e lockfiles são somente leitura.

## Ambiente autorizado

- Java 21;
- Node 24;
- PostgreSQL sintético e descartável;
- Playwright/Chromium compatível;
- serviços vinculados somente a loopback;
- providers apontados para endpoint local fechado;
- nenhum segredo, certificado, documento, empresa ou pessoa real.

## Validações obrigatórias

1. dispatch preflight;
2. backend package/test-compile e testes focados:
   - `ConsoleTecnicaAuthorizationTest`;
   - `TratadorGlobalExcecoesTest`;
   - `DocumentoServiceTest`;
   - `EmpresaDocumentoAdapterTest`;
3. frontend: `npm ci`, locale, typecheck, testes e build;
4. worker: `npm ci`, typecheck, testes e build;
5. guards:
   - Docker/startup;
   - architecture com zero findings;
   - IAM sem findings;
   - environment;
   - secret lifecycle;
   - release promotion;
   - recovery forbidden-command;
6. full-stack controlado:
   - PostgreSQL;
   - Flyway V1–V12;
   - JPA validate;
   - liveness/readiness;
   - worker `/health`;
   - frontend `/healthz`;
   - proxy `/api/info`;
   - heartbeat persistido;
   - upload e leitura de documento sintético;
   - mínimo de 19 jornadas;
   - a11y local-only;
   - zero HTTP 5xx;
   - zero chamada externa;
7. encerramento limpo de browsers, serviços e recursos temporários.

## Classificação

- falha de produto: `PRODUCT_REGRESSION`;
- divergência de prova/guard: `TEST_CONTRACT_DRIFT` ou `BASELINE_DRIFT`;
- ausência real de Docker/PostgreSQL/browser: `ENVIRONMENT_LIMITATION`.

A task não corrige produto. Toda falha gera successor bounded e rerun focado.

## Aceite

- todos os gates obrigatórios passam;
- 403/401/500 permanecem distintos;
- upload documental passa após o novo wiring;
- architecture reporta zero findings;
- nenhum artefato de produto é alterado;
- resultado registra comandos, exit codes, ambiente, limitações e disposição.

`VAL_W011_FULLSTACK_012_RELEASED`
