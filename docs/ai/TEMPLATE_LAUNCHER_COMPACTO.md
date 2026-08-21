# Template de launcher compacto

**Classificação:** `CANONICAL_EXECUTION_PROMPT_TEMPLATE`

O launcher inicia uma task; não repete a especificação.

```text
TASK: <EXACT_ITEM_ID>
BASELINE: latest main
PREPARE: <backend|frontend|worker|docs|database|...>
READ:
- root + nearest AGENTS.md
- <exact shard>
LOCKS: <IDs ou NONE>
OWNER: <boundary exato>
MIGRATION: <NONE ou arquivo exato>
VALIDATE: <comandos estruturais ou owner de teste liberado>
RESULT_MD: <path exato>
```

## Limites

- alvo: até 12 linhas não vazias;
- máximo: 20 linhas e 2.000 caracteres;
- sem `TYPE`, `STATE`, matrizes de cenário, história de PR ou segunda especificação;
- sem alias/gate condicional;
- um ITEM, owner e resultado exatos;
- migration `NONE` na maioria dos launchers;
- packs possuem no máximo cinco launchers e um migration owner.
- launchers liberados permanecem neutros de provedor; o dispatcher usa Flash para implementação
  comum e só seleciona Pro com `--pro-reason` fechado mais `PRIMA_DEEPSEEK_PRO_APPROVED=1` temporário;
- o prompt do worker lista owner e arquivos exatos, evita busca web/leitura ampla e nunca concede
  autoaceite ao executor externo.

Valide com:

```text
python3 scripts/orchestration/validate_prompt.py <arquivo> --mode launcher
python3 scripts/orchestration/validate_prompt.py <pack> --mode pack
```
