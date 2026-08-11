# Prompts preparados

## Estado atual

A onda mais recente foi implementada por autorização direta do usuário e integrada pelas PRs
`#37` a `#41`.

| Slot | Item | PR | Estado | Evidência |
|---:|---|---:|---|---|
| 1 | `EMP-GRP-001` | `#37` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_GRP_001_GRUPOS_TAGS.md` |
| 2 | `CRT-CAL-001` | `#38` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/CRT_CAL_001_AGENDA_VENCIMENTOS.md` |
| 3 | `OBS-PRV-001` | `#39` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OBS_PRV_001_HISTORICO_PROVEDORES.md` |
| 4 | `ADM-CFG-001` | `#40` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/ADM_CFG_001_CONFIGURACAO_SEGURA.md` |
| 5 | `DOC-PRE-001` | `#41` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/DOC_PRE_001_PREVIEW_SEGURO.md` |

O commit final de implementação da onda é:

```text
d7e50e55ad7c2ee0dafbf48736d22507470e0c92
```

Não existem prompts executáveis para esses cinco itens. Não os reenvie ao Codex.

## Implementações anteriores

Também permanecem aguardando prova runtime todos os itens funcionais integrados pelas PRs `#14` a
`#35`, conforme `plano-onda.json` e o Registro de Itens do Roadmap.

Os prompts `PREVIEW_SLOT_*` antigos são apenas referências históricas.

## Prova Cloud histórica

A PR `#12` comprovou, em uma baseline anterior:

- lockfiles;
- frontend e worker;
- startup controlado e PDF sintético;
- sintaxe YAML/JSON/shell;
- revisão estática de Compose, Dockerfiles, BAT, PowerShell e migrations V1–V7.

As implementações posteriores modificaram backend, frontend, worker e migrations. Portanto, essa
prova não classifica a `main` atual como verde.

## Provas obrigatórias da onda mais recente

- `EMP-GRP-001`: V9, busca, deduplicação, limites e isolamento do cadastro fiscal;
- `CRT-CAL-001`: períodos, filtro por empresa, status e resultado parcial;
- `OBS-PRV-001`: status, moedas, duração, taxa e ausência de payload/segredo;
- `ADM-CFG-001`: alertas seguros e ausência de valores sensíveis na resposta;
- `DOC-PRE-001`: PDF/PNG/JPEG, integridade, headers, Blob URL, auditoria e MIME não suportado.

Essas provas se somam ao ciclo geral Maven, npm, Docker, PostgreSQL/Flyway V1–V9,
Keycloak/Liquibase, endpoints e smoke UI.

## Coleta da prova runtime

O Codex disponível é `CODEX_CLOUD_LINUX`. O fluxo correto continua:

1. o usuário atualiza e executa os scripts no Windows local;
2. a evidência é anexada ao relatório runtime ou commitada;
3. uma task Cloud reconcilia o commit de evidência;
4. somente após classificação `VERDE` a próxima onda é selecionada.

## Próxima onda

A próxima onda está `NAO_SELECIONADA`. Ela terá exatamente cinco itens independentes depois do
fechamento de `GATE-VAL-001`.
