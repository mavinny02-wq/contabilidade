# STR-TEST-001 — decomposição do GATE-VAL-001

**Tipo:** documentação/reconciliação owned pelo orquestrador.

## Objetivo

Converter o gate agregado em matriz por owner, baseline, ambiente, prova, validade e disposição.

## Escopo

- mapear PRs/implementações integradas a owners de prova;
- separar Cloud, PostgreSQL controlado e Windows;
- identificar evidência reutilizável;
- classificar gaps/falhas;
- selecionar somente reruns focados;
- registrar campanha ampla apenas quando necessária.

## Proibições

- não executar suites;
- não mudar produção/testes;
- não marcar coverage/runtime como verde sem medição;
- não chamar provider.

## Aceite

Master ledger atualizado, matriz completa e sucessores exatos ou `NO_SUCCESSOR`.
