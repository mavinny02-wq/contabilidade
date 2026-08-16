# Bootstrap de chats

**Classificação:** `CANONICAL_CHAT_CONTEXT_ENTRYPOINT`

## Novo chat

Copie exatamente `CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt`. Não acrescente SHA, PR, onda preparada,
migration frontier ou prompts antigos. Esses fatos são recuperados do GitHub/checkpoint.

## Ressincronização

Use `CONTABILIDADE_EXISTING_CHAT_RESYNC.txt` uma vez em chat que pode conter pressupostos antigos.
Resync corrige semântica, mas não remove histórico já retido pelo provedor. Em chat muito longo,
leve o resultado compacto para um novo chat.

## Validação

```text
python3 scripts/orchestration/validate_prompt.py docs/ai/CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt --mode bootstrap
python3 scripts/orchestration/validate_prompt.py docs/ai/CONTABILIDADE_EXISTING_CHAT_RESYNC.txt --mode resync
```

A resposta correta contém apenas os campos solicitados, sem repetir políticas ou ondas.
