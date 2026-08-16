# VAL-STAB-FULLSTACK-001 — validação full-stack controlada

## Identificação

- **Data:** 16/08/2026 (UTC).
- **Baseline:** `7c6079caa54d1e7526a3e03c5ee41893581ff9b1` (`latest main` disponível no
  checkout, merge do PR #55).
- **Branch preparada:** `fullstack-validation`.
- **Versão:** `0.5.1`.
- **Escopo:** validação read-only do código; somente este relatório foi alterado.
- **Locks respeitados:** `LOCK-EXT-001`, `LOCK-COST-001`, `LOCK-DATA-001`,
  `LOCK-AUT-001` e `LOCK-TEST-001`.
- **Migração criada ou modificada:** nenhuma.

## Arquivos lidos

- `AGENTS.md`;
- `scripts/codex/fullstack-e2e.sh`;
- `scripts/codex/e2e-smoke.mjs`;
- manifests de build `backend/pom.xml`, `frontend/package.json` e
  `automation-worker/package.json`;
- workflow de referência `.github/workflows/build.yml`;
- relatório anterior `docs/operacao/VALIDACAO_CODEX_FULLSTACK_E2E_V051.md`.

## Preparação e isolamento

Os artefatos do backend, frontend e worker foram reconstruídos antes do cenário. O ambiente recebeu
PostgreSQL 16 local e o Chromium gerenciado pelo Playwright. Nenhuma dependência do projeto, lockfile,
fonte ou configuração versionada foi modificada durante essa preparação.

O script recriou exclusivamente a base descartável `contabilidade_codex_e2e`, com usuário local
`contabilidade`, após validar `APP_ENVIRONMENT=CODEX_CLOUD`, host `127.0.0.1` e nome da base. Backend,
worker e frontend escutaram somente em `127.0.0.1`. Os providers externos foram direcionados para a
porta local fechada `127.0.0.1:9`; o smoke instalou uma guarda de rede no contexto do navegador e
rejeitaria qualquer host que não fosse local. O cenário utilizou apenas empresa, CNPJ e documento de
texto sintéticos, sem segredo, documento fiscal ou payload real.

## Builds dos pré-requisitos

| Comando | Resultado | Evidência resumida |
|---|---:|---|
| `cd backend && mvn -B -DskipTests clean package` | aprovado | `BUILD SUCCESS`; JAR executável reconstruído em 42,240 s |
| `cd frontend && npm ci --no-audit --no-fund` | aprovado | 232 pacotes instalados pelo lockfile |
| `cd frontend && npm run locale:validate` | aprovado | bundle `pt-BR`: 22 catálogos, 64 arquivos e 86 entradas dinâmicas |
| `cd frontend && npm run build` | aprovado | TypeScript e Vite; 152 módulos transformados |
| `cd automation-worker && npm ci --no-audit --no-fund` | aprovado | 50 pacotes instalados pelo lockfile |
| `cd automation-worker && npm run build` | aprovado | TypeScript emitido em `dist` |
| `cd automation-worker && npx playwright install --with-deps chromium` | aprovado | Chromium 148 / Playwright revision 1223 disponível |

O frontend preservou o warning não bloqueante de chunk acima de 500 kB. O executor oferecia Node
20.20.2, abaixo do engine declarado (22.12+), portanto o npm emitiu `EBADENGINE`; apesar dessa
limitação ambiental, instalação, compilação e execução do worker e do browser concluíram com código
zero. Java 21.0.2 e PostgreSQL 16.14 atenderam os demais pré-requisitos.

## Provas full-stack

O comando obrigatório `bash scripts/codex/fullstack-e2e.sh` terminou com código **0** e produziu as
seguintes provas:

| Prova | Resultado |
|---|---|
| readiness do backend | HTTP 200 em `http://127.0.0.1:8080/actuator/health/readiness` |
| liveness do backend | HTTP 200 em `http://127.0.0.1:8080/actuator/health/liveness` |
| saúde do worker | HTTP 200 em `http://127.0.0.1:3001/health` |
| frontend | HTTP 200 em `http://127.0.0.1:5173/` |
| proxy frontend/backend | HTTP 200 em `http://127.0.0.1:5173/api/info` |
| Flyway | consulta estrita confirmou última migração `12:true` |
| heartbeat | consulta estrita confirmou ao menos um registro em `worker_heartbeats` |
| browser smoke | 19 jornadas Playwright aprovadas |
| chamadas externas | zero; guarda do navegador permaneceu sem achados |
| erros HTTP 5xx | zero nos logs dos processos |

O smoke criou a empresa fictícia `CODEX-E2E-1786914210517-55d9d038 EMPRESA FICTÍCIA`, percorreu as
rotas operacionais e administrativas previstas, fez upload de um arquivo `text/plain` sintético,
recarregou diretamente a Empresa 360 e gerou `/tmp/contabilidade-codex-e2e.png`. A captura foi
inspecionada e apresentou a Empresa 360 renderizada, sem mensagem de erro visível. Console, falhas
HTTP, requisições e tentativas externas permaneceram sem achados.

## Resultado e comportamento preservado

**VERDE.** Saúde, Flyway, heartbeat, browser smoke e ausência de chamadas externas foram provados no
full-stack local. A separação entre execução técnica e resultado fiscal foi preservada: nenhuma ação
fiscal autoritativa foi iniciada e nenhuma conclusão de regularidade foi produzida. A validação não
alterou código, schema, dependências, dados reais ou contratos da aplicação.

## Pendências

- Repetir em executor com Node 22.13+ elimina o warning de engine, embora ele não tenha afetado esta
  execução.
- O warning de tamanho do chunk principal do frontend permanece informativo e fora do escopo desta
  validação.

## Estado Git esperado

Somente `docs/testing/runs/VAL_STAB_FULLSTACK_001.md` integra a entrega. Artefatos de build e dados
temporários não são versionados; os processos e o cluster PostgreSQL iniciados pelo cenário foram
encerrados pelo trap do script.
