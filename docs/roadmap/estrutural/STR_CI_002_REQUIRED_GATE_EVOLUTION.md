# STR-CI-002 — evolução e observabilidade do required gate

**Objetivo:** transformar o workflow já criado em um gate observável, acionável em PR/push/manual e
incorporar os controles concluídos na Wave 005 sem mudar o nome futuro de branch protection.

## Dispatch obrigatório

Antes de editar:

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_HARDENING_WAVE_006 \
  --item STR-CI-002 \
  --baseline a3344a15a0581fd7f76f78766c6432b46f9a361e \
  --key 637a4ff2255908913d33d005b70d0bf1431ea273302816583a2bce736bcae4cd \
  --github-aware --register
```

Resultado e descrição da PR devem conter:

```text
DISPATCH_KEY: 637a4ff2255908913d33d005b70d0bf1431ea273302816583a2bce736bcae4cd
```

Duplicata bloqueada encerra a task como `SUPERSEDED_DUPLICATE_OWNER` sem editar.

## Owner

Pode alterar somente:

- `.github/workflows/required-ci.yml`;
- novo `.github/workflows/ci-canary.yml`, se necessário para diagnóstico mínimo;
- `scripts/ci/**`;
- testes focados do contrato;
- `docs/implementacao/STR_CI_002_RESULT.md`.

Código de produto, migrations, manifests/lockfiles, workflows dedicados existentes, checkpoint,
ledger e manifests da wave são read-only.

## Contrato imutável

Preservar:

```text
workflow: Required CI
job final: required-ci
check: Required CI / required-ci
```

O workflow deve aceitar `pull_request`, `push` na `main` e `workflow_dispatch`, sem path filter que
possa impedir o gate obrigatório. Adicionar diagnóstico seguro de evento/ref/SHA e conclusões das
lanes, sem imprimir secrets, environment completo ou payloads.

## Evolução das lanes

Manter backend PostgreSQL 17/Testcontainers, frontend e worker/Chromium. Incorporar, como comandos
determinísticos ou lanes próprias:

- coverage e ratchet dos três componentes;
- OpenAPI snapshot/compatibility/usage map;
- catálogo/fixtures sintéticas;
- performance budgets;
- secret/PII, migrations, versão, manifests de wave e dependency policy.

O fan-in final usa `if: always()` apenas para avaliar conclusões e falha quando qualquer lane
obrigatória não termina em `success`. Sem `continue-on-error` ou skip silencioso.

## Diagnóstico de execução remota

Criar testes que falhem quando:

- nome do workflow/job/check muda;
- trigger obrigatório desaparece;
- gate usa path filter incompatível com required check;
- lane concluída na Wave 005 não está representada;
- uma lane pode falhar/ser pulada e o fan-in continuar verde;
- logs expõem segredo ou dump amplo do ambiente.

A task deve consultar a execução do próprio PR quando houver acesso. Se nenhuma run aparecer, não
inventar PASS: registrar `GITHUB_ACTIONS_SETTINGS_OR_PERMISSION_BLOCKER`, IDs/URLs ausentes e o
checklist exato de configuração externa. Não alterar branch protection.

## Aceite

- contrato/YAML/testes locais verdes;
- `Required CI / required-ci` preservado;
- controles da Wave 005 integrados;
- execução remota comprovada ou blocker externo explícito;
- nenhuma chamada fiscal, credencial ou dado real.
