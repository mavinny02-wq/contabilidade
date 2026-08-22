# VAL-P0-CONTABILIDADE-DOCKER-COMPOSE-RUNTIME-002

**Classificação:** `CANONICAL_RELEASED_VALIDATION_SHARD`
**Status:** `RELEASED_FOR_EXECUTION`
**Source autorizado:** `https://github.com/mavinny02-wq/contabilidade.git`
**Branch runtime:** `origin/codex/bootstrap-deepseek-runner` no HEAD remoto observado
**Owner:** `DOCKER_COMPOSE_CLOUD_SOURCE_BOOTSTRAP_RUNTIME_VALIDATION_SERIAL`
**Limite:** `CODEX100-ON`, no máximo uma hora, zero LLM externo

## Objetivo e contexto HOT

Obter de modo não destrutivo o source interno confiável quando o checkout fornecido não o contiver e
executar a validação de `VAL-P0-CONTABILIDADE-DOCKER-COMPOSE-RUNTIME-001` no HEAD mais recente da
branch autorizada. Leia somente `AGENTS.md`, `docs/testing/AGENTS.md`, este shard, o shard predecessor
e os locks enumerados pelo launcher.

## Bootstrap fail-closed

1. Inspecione o checkout atual sem alterar arquivos, index, branch, remotes ou refs.
2. Um repositório existente só pode ser reutilizado se o URL de `origin` for exatamente o source
   autorizado. Faça fetch somente da branch autorizada e materialize o remote HEAD em worktree novo,
   vazio e separado; não faça switch/reset no checkout existente.
3. Se o checkout não tiver esse remote, faça clone `--single-branch` da branch autorizada em um
   diretório novo e vazio. Não adicione remote ao checkout desconhecido e não sobrescreva path.
4. São proibidos force, reset, stash, clean, prune, checkout destrutivo, alteração de remote,
   credencial em URL/log e escrita fora do novo clone/worktree e do RESULT governado.
5. Depois do clone/fetch, confirme novamente o URL exato, a branch remota, worktree limpo e igualdade
   entre `HEAD` e `refs/remotes/origin/codex/bootstrap-deepseek-runner`. Registre o SHA de 40
   caracteres observado apenas como evidência.
6. Não existe SHA esperado e `BASELINE_DRIFT` não bloqueia esta campanha. Falhe antes de Docker se o
   repo/branch não puder ser obtido ou se o HEAD não contiver este shard e seu launcher.

## Validação runtime

Com o source verificado, use o shell POSIX do host Cloud e o contrato canônico de `compose.yaml` +
`compose.dev.yaml`. PowerShell, BAT, Pester, NuGet e Docker Desktop pertencem à campanha Windows e
**não são pré-requisitos desta prova Linux**. Não invoque `START_CONTABILIDADE.bat`, scripts `.ps1`
ou os gates Windows do predecessor.

1. Exija somente `sh`, `docker`, Docker Engine acessível, `docker compose` v2 e `curl`. Ausência de
   Docker/Compose é `ENVIRONMENT_LIMITATION`; não instale nada.
2. Crie um diretório temporário fora do checkout para a evidência e derive um env efêmero de
   `.env.example`, sem imprimir seu conteúdo. Valide a configuração com
   `docker compose --env-file "$ENV_FILE" -f compose.yaml -f compose.dev.yaml config --quiet`.
3. Primeira inicialização: execute o mesmo prefixo com
   `up -d --build --wait --wait-timeout 900`. Registre exit code, duração, IDs do container
   PostgreSQL e do volume nomeado, sem registrar valores do env.
4. Comprove HTTP 200 reais em backend liveness/readiness, worker `/health`, frontend `/healthz` e
   proxy `/api/info`; confirme os quatro serviços dev esperados `healthy`, Keycloak/bootstrap
   ausentes e Flyway V12 aplicado. Não chame provider fiscal ou E2E externo.
5. Segunda inicialização, sem stop/down/cleanup: execute o mesmo prefixo com
   `up -d --wait --wait-timeout 900`, sem `--build`. Repita todos os checks e prove que o container
   PostgreSQL e o volume nomeado foram reutilizados.
6. Deixe a stack saudável em execução. Nunca use `down`, `down -v`, `rm`, `prune`, reset ou exclusão
   de dados. Falha real do produto recebe classificação e successor bounded; esta task não corrige
   produção.

Não há SHA esperado: o SHA remoto observado é evidência, nunca gate de `BASELINE_DRIFT`. O único
resultado persistente continua sendo o `RESULT_MD` governado, com comandos POSIX, versões, durações,
exit codes, IDs redigidos e classificação honesta.

Cada bug real recebe successor bounded e teste de regressão direto antes de rerun. A campanha não
corrige produção. O único resultado persistente é
`docs/implementacao/VAL_P0_CONTABILIDADE_DOCKER_COMPOSE_RUNTIME_002_RESULT.md`, com o SHA observado,
comandos, evidência redigida e uma classificação honesta. Nenhum runtime foi executado ao liberar
este successor.
