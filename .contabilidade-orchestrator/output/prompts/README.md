# Prompts preparados

## Estado atual

A onda mais recente foi implementada por autorização direta do usuário e integrada pelas PRs
`#25` a `#29`.

| Slot | Item | PR | Estado | Evidência |
|---:|---|---:|---|---|
| 1 | `EMP-IMP-001` | `#25` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_IMP_001_IMPORTACAO_CSV.md` |
| 2 | `AUT-SHD-001` | `#26` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/AUT_SHD_001_SHUTDOWN_GRACIOSO.md` |
| 3 | `CRT-DASH-001` | `#27` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/CRT_DASH_001_DASHBOARD_GERENCIAL.md` |
| 4 | `AUD-EXP-001` | `#28` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/AUD_EXP_001_EXPORTACAO_CSV.md` |
| 5 | `DOC-ORP-001` | `#29` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/DOC_ORP_001_RECONCILIACAO_STORAGE.md` |

O commit final de implementação da onda é:

```text
9fdfe8b2af8170397d49925027c55ad7e6365760
```

Não existem prompts executáveis para esses cinco itens. Não os reenvie ao Codex.

## Implementações anteriores

Também permanecem aguardando prova runtime:

```text
SEC-AUT-001
PERF-CRT-001
OPS-BKP-001
OBS-WRK-001
SEC-DOC-001
EXP-CRT-001
EMP-FIL-001
```

Os prompts `PREVIEW_SLOT_*` antigos são apenas referências históricas.

## Prova Cloud histórica

A PR `#12` comprovou, em uma baseline anterior:

- lockfiles;
- frontend e worker;
- startup controlado e PDF sintético;
- sintaxe YAML/JSON/shell;
- revisão estática de Compose, Dockerfiles, BAT, PowerShell e migrations V1–V7.

As implementações posteriores modificaram backend, frontend e worker. Portanto, essa prova não
classifica a `main` atual como verde.

## Provas obrigatórias da onda mais recente

- `EMP-IMP-001`: modelo, validação, importação parcial, duplicidades, limites e auditoria;
- `AUT-SHD-001`: `SIGTERM` ocioso/em execução, timeout, segundo sinal e Compose;
- `CRT-DASH-001`: base vazia, consolidada, parcial, permissão e consistência;
- `AUD-EXP-001`: filtros, período, CSV, limite e evento de exportação;
- `DOC-ORP-001`: storage íntegro, divergências, symlink, limites e zero alteração.

Essas provas se somam ao ciclo geral Maven, npm, Docker, PostgreSQL/Flyway, Keycloak/Liquibase,
endpoints e smoke UI.

## Coleta da prova runtime

O Codex disponível é `CODEX_CLOUD_LINUX`. O fluxo correto continua:

1. o usuário atualiza e executa os scripts no Windows local;
2. a evidência é anexada ao relatório runtime ou commitada;
3. uma task Cloud reconcilia o commit de evidência;
4. somente após classificação `VERDE` a próxima onda é selecionada.

## Próxima onda

A próxima onda está `NAO_SELECIONADA`. Ela terá exatamente cinco itens independentes depois do
fechamento de `GATE-VAL-001`.
