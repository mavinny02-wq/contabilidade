# Regras de tasks Codex

## Elegibilidade

Uma task Codex precisa de um owner executável real: implementação, correção, tooling, teste ou
artefato inseparável dessa execução.

Documentação-only que o orquestrador consegue manter diretamente no GitHub não é elegível para o
Codex. Não crie task, launcher, slot, branch ou `RESULT_MD` apenas para atualizar índice,
checkpoint, ledger, backlog, decisão, lock, intake, reconciliação, seleção ou análise documental.
Aplique `LOCK-ORQ-DOC-001`.

Continuam elegíveis:

- o `RESULT_MD` da task executável;
- documentação inseparável da mudança de código/configuração/tooling do mesmo owner;
- contrato/schema/runbook que precisa ser gerado ou testado pela implementação;
- documentação para a qual o orquestrador comprovadamente não possui capacidade de edição.

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

Todo outcome de uma task executável persiste Markdown, inclusive blocked, failed, environment
limitation e no diff. Uma atualização documentation-only feita diretamente pelo orquestrador não
cria `RESULT_MD` artificial.
