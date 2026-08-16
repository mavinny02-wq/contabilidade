# BUG-ORQ-001 — resultado

- **ITEM:** `BUG-ORQ-001`
- **Baseline:** `6f9f7a600a3f16db91f07be7b3cfa983c53c7f92` (`main` local; fetch remoto indisponível porque o checkout não possui `origin`)
- **Status:** `IMPLEMENTED`
- **Owners alterados:** contrato de manifest/launcher, registry/preflight local, testes focados, workflow dedicado e este resultado.
- **Locks preservados:** `LOCK-GIT-001`, `LOCK-WAVE-001`, `LOCK-EVID-001`.
- **Comportamento:** manifests históricos `1.0` permanecem aceitos; contrato `2.0` exige chave SHA-256 determinística e auditável. O preflight local rejeita chaves ativas/terminais, marca repetição como `SUPERSEDED_DUPLICATE_OWNER` e classifica ausência de GitHub sem liberar uma duplicata local.
- **Migração/provider:** nenhuma migration, dependência ou chamada a provider fiscal.

## Validação

- `python3 -m unittest scripts/orchestration/test_dispatch_guard.py scripts/orchestration/test_validate_wave_manifests.py scripts/orchestration/test_validate_prompt.py -v`: PASS.
- `python3 scripts/orchestration/validate_wave_manifests.py --repo-root .`: PASS.
- `python3 scripts/orchestration/validate_prompt.py .contabilidade-orchestrator/templates/launcher-compacto.md --mode launcher`: PASS.
- `python3 scripts/orchestration/validate_orchestration_governance.py --repo-root .`: BASELINE_DRIFT; falha preexistente fora do owner (`ROUTING_MARKER_MISSING` no current state).
- `git diff --check`: PASS.

## Limitações e provas pendentes

- O modo GitHub-aware não foi exercitado contra a API por ausência de repositório remoto/token; a classificação offline possui teste focado e o guard estrutural não depende de rede.
- Workflow dedicado requer execução pelo GitHub após abertura da PR; não constitui prova de runtime externo neste checkout.

## Handoff Git

- **Commit:** a preencher após commit.
- **PR:** a preencher após criação da PR.
