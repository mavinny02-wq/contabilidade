# Bootstrap de conversas

Use somente um bootstrap estável e recupere estado dinâmico do repositório.

## Nova conversa

Cole `docs/ai/CONTABILIDADE_NEW_CHAT_BOOTSTRAP.txt`. Depois o agente consulta:

1. `AGENTS.md` da raiz;
2. `docs/INDICE_DOCUMENTACAO_ATIVA.md` para roteamento;
3. `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md` para estado atual;
4. apenas o owner/shard necessário.

## Conversa existente

Cole `docs/ai/CONTABILIDADE_EXISTING_CHAT_RESYNC.txt`. O resync relê somente checkpoint, delta
Git/GitHub e resultados afetados; não recarrega toda a documentação.

## Safeguards

- bootstrap não contém SHA, PR, data ou lista de waves;
- índice é roteador, não pacote obrigatório;
- launcher é validado pelo guard de contexto e pelo validador de prompts existente;
- saída de ferramenta é resumida antes de entrar no histórico;
- uso real do provedor e estimativa local permanecem separados.

```text
python3 scripts/ai/context_governance_guard.py --repo-root .
```
