# Classificação de evidência e falhas

**Classificação:** `CANONICAL_ACTIVE_EVIDENCE_POLICY`

## Falhas

| Classe | Significado | Disposição típica |
|---|---|---|
| `PRODUCT_REGRESSION` | produção contradiz lock/contrato aceito | `FIX_PRODUCT` |
| `TEST_CONTRACT_DRIFT` | teste contradiz comportamento/lock atual | `FIX_TEST_CONTRACT` |
| `DATA_OR_FIXTURE_DEFECT` | dado/fixture inválido impede prova | `FIX_DATA_OR_FIXTURE` |
| `ENVIRONMENT_LIMITATION` | runner não possui capacidade necessária | `RERUN_IN_CAPABLE_ENVIRONMENT` |
| `BASELINE_DRIFT` | provas não pertencem ao mesmo SHA/estado | `RERUN_FROM_VERIFIED_BASELINE` |

## Disposição da evidência

- `REUSE_PASS`: owner e condições não mudaram; prova continua válida.
- `REUSE_PASS_WITH_LIMITATION`: válida apenas para escopo/ambiente declarado.
- `RERUN_FOCUSED`: mudança ou lacuna afeta owner exato.
- `RERUN_CONSOLIDATED`: baseline transversal/release gate invalida vários owners.
- `NOT_AUTHORIZED`: prova externa/paga/real não pode ser executada.
- `NO_PROOF`: não há evidência suficiente.
- `SUPERSEDED`: evidência existe, mas outra atual é autoridade.

## Validade

Toda evidência declara:

- SHA/baseline;
- ambiente;
- comando;
- resultado;
- owner;
- limitações;
- condições de invalidação;
- referências a log/artefato sem segredos.

Mudança não relacionada não invalida automaticamente prova focada.
