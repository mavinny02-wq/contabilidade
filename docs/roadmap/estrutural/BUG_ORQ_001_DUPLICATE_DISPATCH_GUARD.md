# BUG-ORQ-001 — prevenção de dispatch e PR duplicados

**Classificação:** `PRODUCT_GOVERNANCE_DEFECT`
**Evidência:** duas execuções do owner `STR-ORQ-003` produziram as PRs duplicadas `#73` e `#74`; somente `#74` foi integrada.

## Objetivo

Tornar cada execução de owner idempotente e rastreável, impedindo que o mesmo item da mesma wave e
baseline seja despachado ou integrado duas vezes.

## Escopo executável

- introduzir `dispatchKey` determinística derivada de `waveId + item + baseline.commit`;
- versionar o contrato de manifest/launcher sem invalidar manifests históricos;
- exigir a chave em waves liberadas e resultados novos;
- criar preflight local que rejeite chave ativa, integrada, consumida ou já registrada;
- oferecer modo GitHub-aware quando `GITHUB_TOKEN` e repositório estiverem disponíveis, sem exigir
  rede para o guard estrutural;
- marcar tentativa repetida como `SUPERSEDED_DUPLICATE_OWNER`, nunca como segundo sucesso;
- adicionar testes e workflow dedicados.

## Aceite

- mesma wave, item e baseline produzem a mesma chave;
- segunda tentativa com a mesma chave falha antes do dispatch ou do merge;
- o mesmo item em nova baseline recebe nova chave;
- owners distintos não colidem;
- resultado e PR tornam a chave auditável sem incluir segredo;
- ausência de GitHub/token é classificada, não transforma duplicata em válida;
- launchers históricos continuam legíveis;
- nenhuma mudança em código funcional, migration ou provider.

## Owner

Schema/validator de manifests, template/validator de launcher, registry/preflight de dispatch,
fixtures, testes e workflow dedicado. Estado canônico, backlog e manifests da wave corrente ficam
fora do owner.
