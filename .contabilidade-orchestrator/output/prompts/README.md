# Prompts preparados

`GATE-VAL-001` recebeu validação Cloud substancial integrada pela PR `#12`.

## Provas já comprovadas no Codex Cloud

- lockfiles versionados e usados por `npm ci`;
- frontend com i18n, typecheck e build verdes;
- worker com typecheck, build e startup controlado sem crash de PDF.js;
- extração de texto de PDF sintético fictício no Linux Cloud;
- sintaxe YAML/JSON/shell e revisão estática de Compose, Dockerfiles, BAT, PowerShell e migrations V1–V7;
- contrato permanente que separa `CODEX_CLOUD_LINUX` de `LOCAL_WINDOWS_MANUAL`.

A evidência canônica está em:

```text
docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md
```

A classificação é `CLOUD_AMARELO`: o backend Maven ficou bloqueado por HTTP 403 do registry e o
Cloud não possui Docker/Windows para comprovar a stack.

## Provas ainda obrigatórias

- Maven verde em ambiente com acesso ao registry;
- builds no Windows com Node 22.12+;
- Compose efetivo `dev` e `onpremise`;
- imagens artifact-only reais;
- PostgreSQL, `postgres-bootstrap`, Flyway, Keycloak e Liquibase;
- BAT, healthchecks, endpoints, proxies e smoke UI.

A extração de PDF sintético já foi resolvida no Linux Cloud. No ambiente local resta comprovar o
empacotamento da imagem artifact-only do worker, não repetir o mesmo teste apenas por formalidade.

## Como coletar a prova local

Não criar outra task Codex com `EXECUTION MODE: LOCAL_WINDOWS`. O único executor Codex disponível é o
Cloud Linux. O fluxo correto é:

1. usar os BATs e scripts já versionados;
2. o usuário executá-los no Windows local;
3. salvar a saída no relatório canônico ou em um commit de evidência;
4. enviar uma task `CODEX_CLOUD_LINUX` apenas para reconciliar esse commit.

Os arquivos `PREVIEW_SLOT_*` continuam apenas como candidatos. Eles não estão selecionados e não
devem ser executados até que a evidência runtime local seja `VERDE` no mesmo commit atualizado de
`main`.
