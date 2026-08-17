# Contabilidade Startup Recovery Wave 013

**Classificação:** `CANONICAL_RELEASED_WAVE`
**Status:** `RELEASED_FOR_EXECUTION`
**Contrato:** `2.0`
**Baseline comum:** `main@a34afbe0c7a7876ea231c3a9a1c913dbe39928ae`
**Owners executáveis:** `1`
**Migration owner:** `NONE`
**Lane:** `P0_STARTUP_RECOVERY`

## Owner

| Slot | ITEM | Owner | Resultado |
|---:|---|---|---|
| 1 | `FIX-STARTUP-PROBE-001` | `STARTUP_RECOVERY_SERIAL` | startup idempotente + harness integrado |

`STR-STARTUP-TEST-001` está incorporado ao mesmo owner porque seus fixtures e testes são
inseparáveis da correção. Não existe segundo slot nem execução paralela sobre o hotspot de startup.

## Dispatch

- **DISPATCH_KEY:** `8fdb5495fdc929d5e973da48f6594d7fe411b7094f08865744ed1571fb99a00c`.
- **RESULT_MD:** `docs/implementacao/FIX_STARTUP_PROBE_001_RESULT.md`.

## Limites

- startup, executor Docker, lifecycle do probe e testes/harness focados;
- Compose base, produto, banco, migrations, providers e dados reais permanecem read-only;
- nenhuma dependência ou migration;
- nenhum cleanup global, alteração automática de contexto Docker ou mascaramento de stderr;
- Docker CLI ausente deve falhar no preflight antes de builds longos;
- `VAL-WINDOWS-COMPOSE-STARTUP-001` só é liberada após integração do resultado.

## Ambiente autoritativo

Windows PowerShell 5.1 + Docker Desktop. A sessão que preparou a wave possui PowerShell 5.1, mas não
possui Docker CLI; portanto, não reivindica prova runtime e registra essa limitação como requisito de
preflight.

## Launcher pack

`docs/orquestracao/waves/released/CONTABILIDADE_STARTUP_RECOVERY_WAVE_013_LAUNCHERS.txt`

`CONTABILIDADE_STARTUP_RECOVERY_WAVE_013_RELEASED`
