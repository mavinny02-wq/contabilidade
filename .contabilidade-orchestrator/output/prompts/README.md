# Prompts preparados

## Estado atual

A onda mais recente foi implementada por autorização direta do usuário e integrada pelas PRs
`#43` a `#47`.

| Slot | Item | PR | Estado | Evidência |
|---:|---|---:|---|---|
| 1 | `EMP-RSP-001` | `#43` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/EMP_RSP_001_RESPONSAVEIS_MODULO.md` |
| 2 | `CRT-FAT-001` | `#44` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/CRT_FAT_001_RECONCILIACAO_FATURAS.md` |
| 3 | `AUT-TEL-001` | `#45` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/AUT_TEL_001_HISTORICO_HEARTBEATS.md` |
| 4 | `OPS-UPD-001` | `#46` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/OPS_UPD_001_PREFLIGHT_ATUALIZACAO.md` |
| 5 | `DOC-MET-001` | `#47` | `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` | `docs/implementacao/DOC_MET_001_EDICAO_METADADOS.md` |

O commit final de implementação da onda é:

```text
8d7357bf70a77bf6e265f4c50aed6453510a93d3
```

Não existem prompts executáveis para esses cinco itens. Não os reenvie ao Codex.

## Implementações anteriores

Também permanecem aguardando prova runtime todos os itens funcionais integrados pelas PRs `#14` a
`#41`, conforme `plano-onda.json` e o Registro de Itens do Roadmap.

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

- `EMP-RSP-001`: V10, módulos, unicidade, isolamento, permissões e auditoria sem PII;
- `CRT-FAT-001`: V11, custos, moeda, tolerância, período e atualização idempotente;
- `AUT-TEL-001`: V12, amostragem, mudança de estado/versão, múltiplos workers e resultado parcial;
- `OPS-UPD-001`: schema, versões, componentes, nomes, traversal, tamanho, hash e ausência de execução;
- `DOC-MET-001`: tipo/datas, permissões e imutabilidade de arquivo, hash, MIME, origem e storage.

Essas provas se somam ao ciclo geral Maven, npm, Docker, PostgreSQL/Flyway V1–V12,
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
