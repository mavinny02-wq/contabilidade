# Prompts preparados

## Estado atual

A onda mais recente foi implementada por autorização direta do usuário e integrada pelas PRs
`#31` a `#35`.

| Slot | Item | PR | Estado | Evidência |
|---:|---|---:|---|---|
| 1 | `EMP-HIS-001` | `#31` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_HIS_001_HISTORICO_CADASTRAL.md` |
| 2 | `CRT-BULK-001` | `#32` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/CRT_BULK_001_SOLICITACAO_LOTE.md` |
| 3 | `AUT-LIM-001` | `#33` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/AUT_LIM_001_LIMITES_SESSAO_INTERATIVA.md` |
| 4 | `OPS-BKP-UI-001` | `#34` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OPS_BKP_UI_001_INVENTARIO_BACKUPS.md` |
| 5 | `DOC-RET-001` | `#35` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/DOC_RET_001_PREVIA_RETENCAO.md` |

O commit final de implementação da onda é:

```text
0e310acecedf186bb62339e152bd7d5ee7bc0e2e
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
EMP-IMP-001
AUT-SHD-001
CRT-DASH-001
AUD-EXP-001
DOC-ORP-001
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

- `EMP-HIS-001`: isolamento entre empresas, paginação, permissão e ausência de detalhes JSON;
- `CRT-BULK-001`: limite, deduplicação, idempotência e resultado parcial;
- `AUT-LIM-001`: concorrência de criação, limite SSE, liberação e health;
- `OPS-BKP-UI-001`: manifesto, tamanho, SHA-256, symlink e mount read-only;
- `DOC-RET-001`: critérios, filtro, resultado parcial e zero alteração.

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
