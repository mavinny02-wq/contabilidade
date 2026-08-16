# Fluxo de trabalho Codex

## Fluxo GitHub-first

```text
GitHub HEAD + open PRs
  -> reconciliação incremental
  -> documentação/gates resolvidos diretamente pelo orquestrador
  -> PREPARED_NOT_RELEASED
  -> refresh final
  -> 1–5 launchers RELEASED_FOR_EXECUTION
  -> PRs
  -> merge pelo usuário
  -> resultados integrados
  -> classificação/reuse de evidência
  -> CONSUMED
```

Uma onda pode ter menos de cinco tasks e possui no máximo um migration owner.

## Elegibilidade para o Codex

O Codex recebe somente trabalho que exige executor bounded, como implementação, correção, tooling,
teste ou geração inseparável de um owner executável.

Quando a documentação pode ser criada ou atualizada diretamente pelo orquestrador com acesso ao
GitHub, ela é feita no próprio fluxo e não vira task Codex. Isso inclui:

- índice e roteamento;
- checkpoint e estado atual;
- ledger e classificação de evidência;
- backlog e registro de IDs;
- locks e decisões já autorizadas;
- intake, reconciliação, seleção e manifests de preparação/liberação;
- documentação de análise sem código/tooling associado.

Exceções legítimas do executor:

- `RESULT_MD` da própria task;
- documentação inseparável da alteração implementada;
- contrato, schema ou runbook gerado e validado pelo tooling do mesmo owner;
- documentação cuja atualização exige capacidade que o orquestrador comprovadamente não possui.

Não crie launcher, slot ou branch Codex apenas para produzir uma alteração documentation-only que o
orquestrador consegue fazer diretamente. Aplique `LOCK-ORQ-DOC-001`.

## Cloud versus prova local

O executor é `CODEX_CLOUD_LINUX`. Windows, Docker Desktop e localhost do usuário são prova humana:

```text
Cloud cria/corrige artefato
  -> PR/merge
  -> usuário executa no Windows
  -> evidência segura é persistida
  -> Cloud reconcilia
```

Não crie task Cloud que finja executar `.bat`, caminho local, Docker Desktop ou stack persistente.

## Separação de responsabilidades

- documentação-only acessível: orquestrador, diretamente no GitHub;
- implementação/correção: executor bounded;
- documentação inseparável da implementação: mesmo executor do owner;
- teste: owner explícito;
- runtime Windows: humano;
- merge: usuário, salvo instrução explícita ou documentação-only owned pelo orquestrador;
- seleção de sucessor: orquestrador após evidência.
