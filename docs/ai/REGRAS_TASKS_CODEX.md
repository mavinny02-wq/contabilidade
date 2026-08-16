# Regras de tasks Codex

## Launcher

Use o template compacto. O prompt contém ITEM, baseline, preparo, referências, locks, owner,
migration, validação e `RESULT_MD`. Detalhes permanecem no shard.

## Release gates

Uma task liberada possui:

- ITEM/owner/result exatos;
- baseline comum;
- nenhum alias ou stop condicional;
- nenhuma dependência same-wave;
- nenhum overlap com PR/owner reservado;
- migration `NONE` ou uma lane única na onda.

Documentação-only e no-op não consomem slot.

## Testes

Task comum não executa suíte. Faz somente compilação/typecheck/build/configuração proporcional.
Task de teste executa apenas o owner liberado e não muda produção para obter verde.

## Escopo

- sem item vizinho/refactor amplo;
- sem dependência/licença não revisada;
- sem fonte de verdade paralela;
- sem arquivo de outro owner;
- sem provider real/pago, credencial ou dado real;
- sem sucessor automático.

## Ambiente

`CODEX_CLOUD_LINUX` não pressupõe Windows, WSL, Docker Desktop, `.env` local ou localhost do usuário.

`LOCAL_WINDOWS_MANUAL` é contexto de prova humana. Evidência Cloud e local não são intercambiáveis.

## Resultado

Todo outcome persiste Markdown, inclusive blocked, failed, environment limitation e no diff.
