# Contabilidade Stabilization Wave 003 — consumed

**Status:** `CONSUMED`
**Execução comum:** `main@1e0122d2cfc5f7108c94fef0e965b2720661daec`
**Migration owner:** `NONE`

## Resultados integrados

| ITEM | PR | Resultado |
|---|---:|---|
| `FIX-STARTUP-MAIN-001` | `#71` | `PASS_WITH_ENVIRONMENT_LIMITATION` |
| `BUG-RUN-001` | `#72` | `IMPLEMENTED_AWAITING_LOCAL_WINDOWS_MANUAL` |
| `STR-ORQ-003` | `#74` | `PASS` |
| `STR-REL-001` | `#75` | `PASS` |
| `STR-OWN-001` | `#76` | `PASS_STRUCTURAL_WITH_EXTERNAL_PROOF_PENDING` |

A PR `#73` repetiu o mesmo owner de `STR-ORQ-003` e foi encerrada sem merge como
`SUPERSEDED_DUPLICATE_OWNER`.

## Disposição

- nenhum owner exige rerun Cloud amplo;
- startup e coletor seguem para campanha Windows manual;
- branch protection aguarda required gate estável;
- o defeito de dispatch duplicado é sucedido por `BUG-ORQ-001`.

`CONTABILIDADE_STABILIZATION_WAVE_003_CONSUMED`
