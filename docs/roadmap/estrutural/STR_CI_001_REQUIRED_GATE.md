# STR-CI-001 — required gate estável

**Objetivo:** criar um único check confiável para futura branch protection e fechar as lacunas
focadas de Docker/Testcontainers e worker/Chromium.

## Dispatch obrigatório

Antes de editar:

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_QUALITY_GATE_WAVE_005 \
  --item STR-CI-001 \
  --baseline c3c06e8cb5921f96ecdb9b1e397594d01dd4430f \
  --key d26681eceae7b6f3332378b27b3ce7e0b98f540519641153774217257f0a825f \
  --github-aware --register
```

Resultado e descrição da PR devem conter:

```text
DISPATCH_KEY: d26681eceae7b6f3332378b27b3ce7e0b98f540519641153774217257f0a825f
```

Duplicata bloqueada encerra a task como `SUPERSEDED_DUPLICATE_OWNER` sem editar.

## Owner

Pode alterar somente:

- novo `.github/workflows/required-ci.yml`;
- novo `scripts/ci/**`;
- testes focados do contrato do gate;
- `docs/implementacao/STR_CI_001_RESULT.md`.

Todos os workflows existentes, código de produto, manifests, lockfiles, migrations, checkpoint,
ledger e manifests da wave são read-only.

## Contrato do workflow

Criar workflow com nome estável:

```text
Required CI
```

E job final estável:

```text
required-ci
```

O check observado deve ser:

```text
Required CI / required-ci
```

### Lanes obrigatórias

1. `governance`
   - governance guard;
   - wave manifest validator;
   - prompt/launcher pack validator;
   - duplicate-dispatch tests;
   - migration registry guard/test;
   - version guard/test;
   - secret/PII guard/test;
   - SBOM/license deterministic tests.

2. `backend-postgresql`
   - Java 21;
   - Docker disponível;
   - `mvn -B clean verify` com Testcontainers/PostgreSQL 17;
   - nenhuma migration editada ou teste silenciosamente ignorado.

3. `frontend`
   - Node 24;
   - `npm ci`;
   - locale, typecheck, testes e build.

4. `worker`
   - Node 24;
   - Playwright `1.60.0` e Chromium correspondente provisionados antes do bloqueio de rede;
   - typecheck, suíte completa incluindo `reliability.test`, build;
   - nenhuma navegação externa permitida durante a prova.

5. `required-ci`
   - `needs` de todas as lanes obrigatórias;
   - `if: always()` apenas para inspecionar conclusões;
   - falha quando qualquer lane obrigatória não for `success`;
   - nenhum `continue-on-error` em lane obrigatória.

Advisory scan dependente de rede permanece check separado e não é mascarado como verde. Não incorporar
outputs criados pelos outros slots desta mesma wave.

## Testes do contrato

Adicionar parser/testes que falhem quando:

- workflow ou job final muda de nome;
- lane obrigatória desaparece;
- `required-ci` não depende de todas as lanes;
- aparece `continue-on-error` obrigatório;
- backend não executa a prova Testcontainers;
- worker não provisiona Chromium ou não executa a suíte completa;
- um job obrigatório pode ser pulado sem fazer o gate falhar.

## Aceite

- contrato e YAML válidos;
- execução local proporcional onde possível;
- execução remota do PR observável;
- backend Testcontainers e worker/Chromium verdes ou limitação claramente registrada;
- `RESULT_MD` inclui dispatch key, nomes finais dos checks e URLs/IDs de execução quando disponíveis;
- branch protection não é alterada nesta task.
