# Prompts preparados

## Estado atual

A onda de cinco itens foi implementada por autorização direta do usuário e integrada pelas PRs
`#14` a `#18` sobre a versão declarada `0.5.1`.

Depois da reconciliação dessa onda, o usuário autorizou a próxima implementação direta:
`EXP-CRT-001`, integrada pela PR `#20`.

| Item | PR | Estado | Evidência |
|---|---:|---|---|
| `SEC-AUT-001` | `#14` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/SEC_AUT_001_ANTI_REPLAY_SESSAO.md` |
| `PERF-CRT-001` | `#15` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/PERF_CRT_001_CONSULTAS_LIMITADAS.md` |
| `OPS-BKP-001` | `#16` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OPS_BKP_001_MANIFESTO_BACKUP.md` |
| `OBS-WRK-001` | `#17` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OBS_WRK_001_HEARTBEAT_STALE.md` |
| `SEC-DOC-001` | `#18` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/SEC_DOC_001_INTEGRIDADE_DOWNLOAD.md` |
| `EXP-CRT-001` | `#20` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EXP_CRT_001_EXPORTACAO_CSV.md` |

Os arquivos `PREVIEW_SLOT_1_*` a `PREVIEW_SLOT_5_*` estão arquivados como referência histórica. Eles
não são prompts executáveis e não devem ser enviados novamente ao Codex.

## Prova Cloud histórica

A PR `#12` comprovou, em sua baseline:

- lockfiles;
- frontend e worker;
- startup controlado e PDF sintético;
- sintaxe YAML/JSON/shell;
- revisão estática de Compose, Dockerfiles, BAT, PowerShell e migrations V1–V7.

Essa evidência permanece em:

```text
docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md
```

Entretanto, as PRs `#14` a `#18` e `#20` alteraram backend, worker e frontend. Portanto a prova da
PR `#12` é histórica e não classifica a main atual como verde.

## Provas obrigatórias para a main atual

- Maven Java 21;
- frontend e worker com Node 22.12+;
- Compose efetivo `dev` e `onpremise`;
- imagens artifact-only;
- PostgreSQL, `postgres-bootstrap`, Flyway V1–V8, Keycloak e Liquibase;
- BAT, healthchecks, endpoints, proxies e smoke UI;
- anti-replay de ticket/grant;
- lotes e cursores do scheduler;
- manifesto/backup PowerShell e geração real;
- estados de heartbeat;
- adulteração documental recusada e auditada;
- exportação CSV com filtros, UTF-8/BOM, proteção contra fórmula, limite e auditoria.

## Coleta da prova runtime

O Codex disponível é `CODEX_CLOUD_LINUX`. Não criar task com executor Windows fictício. O fluxo é:

1. o usuário atualiza e executa os scripts no Windows local;
2. a saída é anexada ao relatório runtime ou commitada;
3. uma task Cloud reconcilia o commit de evidência;
4. somente após classificação verde a próxima onda é selecionada.

## Próxima onda

Não há slots oficiais nem previews novos. A próxima onda terá exatamente cinco itens independentes,
selecionados apenas depois da validação verde da main atual e da reconciliação de ownership,
migrations e baseline.
