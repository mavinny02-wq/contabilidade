# STR-QA-001 — resultado

**ITEM:** `STR-QA-001`  
**STATUS:** `PASS_WITH_ENVIRONMENT_LIMITATIONS`  
**BASELINE:** `c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`  
**DISPATCH_KEY:** `88f897e1dc468bd04488dba240ba6b6d67c6c535f01843f2f074a3a341180226`

## Owners alterados

- configuração JaCoCo em `backend/pom.xml`;
- provider V8 e manifests gerados pelo npm em `frontend/`;
- comando de coverage Node em `automation-worker/package.json`;
- contrato, ratchet e fixtures em `scripts/quality/`;
- este resultado.

Nenhum workflow, migration ou regra de negócio foi alterado. `LOCK-DEP-001`, `LOCK-EVID-001` e
`LOCK-TEST-001` foram preservados: ferramentas são locais/on-premise, medições repetidas foram
reutilizadas e falhas de Docker/Chromium foram classificadas como `ENVIRONMENT_LIMITATION`.

## Baseline medido

Não existe média agregada entre componentes. Os contadores canônicos estão em
`scripts/quality/coverage-baseline.json`.

| Componente | Completude | Lines | Branches | Functions | Statements |
|---|---|---:|---:|---:|---:|
| backend | `PARTIAL` | 4/4433 (0.0902%) | 3/1790 (0.1676%) | n/a | n/a |
| frontend | `COMPLETE` | 602/6093 (9.8802%) | 56/117 (47.8632%) | 24/73 (32.8767%) | 602/6093 (9.8802%) |
| automation-worker | `PARTIAL` | 798/1465 (54.4710%) | 146/211 (69.1943%) | 88/146 (60.2740%) | n/a |

O frontend inclui todos os arquivos `src/**/*.{ts,tsx}`, inclusive não importados pelos testes. O
backend excluiu somente o teste de integração bloqueado por Docker, sem excluir código de produção.
O worker executou `worker.test` e `reliability.test`: 10/11 passaram; o smoke Playwright ficou
bloqueado porque Chromium não está provisionado.

## Ratchet e tolerância

A primeira medição estabelece o baseline real. Duas medições consecutivas mantiveram os mesmos
numeradores e denominadores; por isso a tolerância técnica mínima é `0.01` ponto percentual. O
ratchet compara cada componente/métrica, torna aumento de denominador descoberto visível, rejeita
relatório ausente/vazio e exige que exceções tenham owner, motivo, escopo e expiração.

## Dependências e licenças

- JaCoCo Maven Plugin 0.8.13 — EPL-2.0, test/report-only;
- `@vitest/coverage-v8` 3.2.4 — MIT, versão alinhada ao Vitest existente e dev-only;
- worker usa coverage nativo do Node 24, sem dependência nova.

## Comandos e resultados

- dispatch preflight: permitido; auditoria GitHub indisponível por ausência de variáveis do GitHub;
- `mvn -B verify`: `ENVIRONMENT_LIMITATION`, 4 testes executados e integração Testcontainers
  bloqueada sem Docker;
- backend focado executado duas vezes: contadores idênticos, `PASS`;
- frontend coverage executado duas vezes: 7 arquivos/20 testes passaram e contadores idênticos;
- worker coverage executado duas vezes com Node 24: 10/11 testes passaram e contadores idênticos;
  Chromium ausente mantém o componente parcial;
- fixtures do ratchet: 6 testes passaram;
- validações estruturais e `git diff --check`: ver execução final registrada no commit/PR.

## Limitações e provas pendentes

- rerun do backend completo requer Docker e PostgreSQL Testcontainers;
- rerun do worker completo requer provisionar o Chromium compatível com Playwright 1.60.0;
- o host possui Node 20.20.2; Node 24.19.0 foi usado via pacote efêmero para medir o worker. A
  compatibilidade estrutural mínima do frontend foi preservada, mas sua medição ocorreu nesse Node
  disponível;
- GitHub remoto não estava configurado no checkout durante o dispatch preflight.

## Commit/PR

Preenchido pelo handoff Git/GitHub desta task.
