# STR-QA-BE-001 — testes críticos do motor de execuções

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_008 --item STR-QA-BE-001 --baseline 77141fae2f04a430bc2cb51264886c083977a3ce \
  --key 620e49f09111d07764735c3161b8326c0d94639092a13fa93f6a40d4129bef85 --github-aware --register
```

## Owner

Pode alterar somente testes em `backend/src/test/java/br/com/contabilidade/common/execution/**`,
suporte sintético estritamente necessário e `docs/implementacao/STR_QA_BE_001_RESULT.md`.
Produção, POM, migrations e baseline global de coverage são read-only.

## Objetivo

Transformar os invariantes críticos de fila PostgreSQL em regressões reproduzíveis, sem mascarar
falha de produto com mocks que eliminem concorrência, locking ou persistência.

## Cenários mínimos

- criação idempotente retorna a mesma execução e rejeita chave reutilizada com comando divergente;
- aquisição concorrente por workers distintos nunca entrega a mesma execução;
- prioridade/ordem e `skip locked` preservam progresso sem dupla aquisição;
- token ausente, divergente ou lease expirado bloqueia renovação/conclusão;
- recuperação de lease agenda retry abaixo do limite e termina em falha no limite;
- recuperação limpa token, prazo e worker, mantendo auditoria/lifecycle coerentes;
- retry respeita máximo, backoff e custo/moeda sem dupla contabilização;
- fallback terminal idempotente não cria sucessores duplicados.

## Prova

Usar PostgreSQL/Testcontainers e dados sintéticos. Testes concorrentes devem ter timeout bounded,
barreiras determinísticas e duas execuções consecutivas verdes. Falha observada em produção é
`PRODUCT_REGRESSION` e gera successor; este owner não altera código produtivo.

## Validação

Java 21; `mvn -B -Dtest=<suíte focada> test`, repetição da suíte crítica, compile/test-compile e
`git diff --check`.
