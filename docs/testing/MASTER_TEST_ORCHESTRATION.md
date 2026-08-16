# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`
**Reconciliado em:** `2026-08-16`

Este ledger agenda, classifica e reutiliza evidência. Não é uma lista para executar tudo sempre.

## Política

- ordinary implementation/correction: validação estrutural somente;
- validação executa apenas owner explicitamente liberado;
- produção não é alterada para tornar teste verde;
- Cloud Linux e Windows/Docker Desktop são ambientes diferentes;
- provider real/pago não é executado sem autorização;
- evidence reuse precede rerun;
- aggregate coverage só é declarado quando produzido no mesmo baseline verificado.

## Evidência existente

| ID | Owner | Baseline | Ambiente | Resultado atual | Disposição |
|---|---|---|---|---|---|
| `VAL-CLOUD-V051-002` | aplicação ampla | baseline anterior à main atual | Cloud Linux | parcial/histórico | `BASELINE_DRIFT`; não classifica HEAD atual |
| `VAL-RUNTIME-V051-001` | runtime on-premise | relatório parcial | Windows local | não concluído | `ENVIRONMENT_LIMITATION` no Cloud |
| `GATE-VAL-001` | aplicação ampla | múltiplos SHAs | misto | agregado legado | decompor em `STR-TEST-001` |
| `VAL-STARTUP-PR56-001` | startup dev/on-premise | PR aberta `#56` | CI + Windows pendente | não integrado | owner reservado; prova após merge |

## Matriz atual de owners

| Owner de prova | Estado | Ambiente requerido | Evidência reutilizável |
|---|---|---|---|
| backend compile/test-compile | `NO_CURRENT_RELEASE_PROOF` | Cloud Linux | não |
| backend unit/integration | `NOT_SCHEDULED` | Cloud/PostgreSQL controlado | não |
| frontend locale/typecheck/build | `NO_CURRENT_RELEASE_PROOF` | Cloud Linux Node 22.12+ | não |
| frontend Vitest | `NOT_SCHEDULED` | Cloud Linux | não |
| worker typecheck/build | `NO_CURRENT_RELEASE_PROOF` | Cloud Linux Node 22.12+ | não |
| worker tests | `NOT_SCHEDULED` | Cloud Linux | não |
| Flyway V1–V12 | `LOCAL_RUNTIME_PROOF_PENDING` | PostgreSQL alvo | não |
| dev startup | `PR56_OWNER_OPEN` | Windows/Docker Desktop | não |
| on-premise/Keycloak | `LOCAL_RUNTIME_PROOF_PENDING` | Windows/Docker Desktop | não |
| smoke UI | `LOCAL_RUNTIME_PROOF_PENDING` | aplicação local | não |
| external providers | `NOT_AUTHORIZED_NOT_REQUIRED` | ambiente contratado | não executar |
| aggregate coverage | `NOT_MEASURED` | campanha única/baseline fixo | não |

## Decomposição obrigatória

`STR-TEST-001` deve converter `GATE-VAL-001` em uma matriz por owner:

1. mapear cada implementação integrada ao código/teste/prova relevante;
2. decidir `REUSE_PASS`, `RERUN_FOCUSED` ou blocker;
3. separar Cloud de Windows;
4. evitar reexecutar owners não afetados;
5. criar campanha consolidada somente para lacunas transversais;
6. registrar coverage como desconhecido até medida real.

## Formato de resultado

```text
ITEM:
BASELINE:
ENVIRONMENT:
COMMANDS:
EXPECTED:
ACTUAL:
CLASSIFICATION:
DISPOSITION:
OWNERS_AFFECTED:
EVIDENCE_REUSED:
LIMITATIONS:
REFERENCES:
```

## Próxima campanha

Nenhuma campanha ampla está liberada por este ledger. A próxima ação é documental/estrutural:
`STR-TEST-001`. Owners executáveis de teste surgem apenas após a decomposição e seleção.
