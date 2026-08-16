# Fluxo de trabalho Codex

## Fluxo GitHub-first

```text
GitHub HEAD + open PRs
  -> reconciliação incremental
  -> documentação/gates resolvidos pelo orquestrador
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

- documentação-only: orquestrador;
- implementação/correção: executor bounded;
- teste: owner explícito;
- runtime Windows: humano;
- merge: usuário, salvo instrução explícita;
- seleção de sucessor: orquestrador após evidência.
