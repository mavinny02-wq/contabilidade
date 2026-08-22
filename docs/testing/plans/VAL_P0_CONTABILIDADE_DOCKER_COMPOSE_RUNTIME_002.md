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

Com o source verificado, execute exatamente os gates e limites do shard predecessor, inclusive duas
inicializações sem cleanup, health HTTP real e PostgreSQL reutilizado. Não instale dependência global,
não use `down -v`, reset, segredo, provider ou deploy externo. Ausência de Docker/Compose é
`ENVIRONMENT_LIMITATION`; não tente instalar.

Cada bug real recebe successor bounded e teste de regressão direto antes de rerun. A campanha não
corrige produção. O único resultado persistente é
`docs/implementacao/VAL_P0_CONTABILIDADE_DOCKER_COMPOSE_RUNTIME_002_RESULT.md`, com o SHA observado,
comandos, evidência redigida e uma classificação honesta. Nenhum runtime foi executado ao liberar
este successor.
