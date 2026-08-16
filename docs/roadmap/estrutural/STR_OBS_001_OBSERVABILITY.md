# STR-OBS-001 — correlação e observabilidade operacional

**Objetivo:** correlacionar frontend/proxy, backend e automation worker com logs e métricas
operacionais sem registrar PII, segredo ou payload fiscal.

## Dispatch obrigatório

Antes de editar:

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_HARDENING_WAVE_006 \
  --item STR-OBS-001 \
  --baseline a3344a15a0581fd7f76f78766c6432b46f9a361e \
  --key 12513604f08b8e970241633e0f7f9d9e0a2f01e2b7dc1594a837dd01f3037a65 \
  --github-aware --register
```

Resultado e descrição da PR devem conter:

```text
DISPATCH_KEY: 12513604f08b8e970241633e0f7f9d9e0a2f01e2b7dc1594a837dd01f3037a65
```

Duplicata bloqueada encerra a task como `SUPERSEDED_DUPLICATE_OWNER` sem editar.

## Owner

Pode alterar somente:

- `backend/src/main/java/br/com/contabilidade/common/observability/**`;
- configuração/backend tests estritamente necessários à observabilidade;
- `automation-worker/src/observability/**`;
- `automation-worker/src/BackendClient.ts` e testes focados de propagação;
- `docs/implementacao/STR_OBS_001_RESULT.md`.

Fluxos de provider, regras fiscais, migrations, frontend, manifests/lockfiles e workflows são
read-only.

## Contrato

- aceitar `X-Correlation-Id` válido ou gerar UUID seguro;
- devolver o ID na resposta e propagá-lo do worker para o backend;
- colocar apenas IDs técnicos permitidos no contexto de log;
- limpar contexto ao fim da request/task para evitar vazamento entre execuções;
- métricas Micrometer para requests/erros/latência e métricas bounded do worker;
- labels de baixa cardinalidade: operação técnica, resultado, classe de erro;
- proibir CNPJ/CPF, nome, documento, URL autenticada, token, certificado e mensagem externa bruta;
- health/readiness continuam distintos de resultado de negócio.

## Testes

Cobrir geração/aceitação/rejeição do header, propagação worker-backend, limpeza após concorrência,
cardinalidade permitida e redaction. Executar backend test-compile/testes focados, worker
typecheck/testes/build e `git diff --check`.

## Aceite

- mesma correlação observável em request e chamada do worker;
- logs estruturados sem dados sensíveis;
- métricas disponíveis em Actuator/Prometheus sem label explosiva;
- nenhum provider real;
- falha de observabilidade nunca altera o resultado fiscal autoritativo.
