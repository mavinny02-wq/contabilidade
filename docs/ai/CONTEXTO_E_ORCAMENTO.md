# Roteamento de contexto e orçamento

**Classificação:** `CANONICAL_CONTEXT_ECONOMY_RULE`

## Objetivo

Otimizar tokens por resultado bem-sucedido, preservando autoridade, owner, baseline, locks e causa
raiz.

## Fontes

- `AGENTS.md`: regras estáveis;
- current state: estado dinâmico do orquestrador;
- shard exato: objetivo/aceite;
- locks: decisões aceitas mapeadas;
- Git/GitHub: integração/diff;
- `RESULT_MD`: evidência;
- histórico: COLD.

Não copie o mesmo fato para várias fontes HOT.

## HOT / WARM / COLD

### HOT — executor comum

1. raiz + nearest `AGENTS.md`;
2. launcher;
3. shard;
4. locks mapeados.

### WARM — operação correspondente

- índice/current state: orquestração/reconciliação;
- governança: documentação;
- template/regras de tasks: geração de launcher;
- master test: validação;
- arquitetura: somente owner tocado.

### COLD

- ondas antigas;
- prompts preview;
- histórico;
- logs completos;
- resultados não relacionados;
- relatórios amplos quando basta um owner;
- lockfiles/build artifacts sem ownership direto.

## Recuperação progressiva

```text
request
-> ITEM/owner
-> AGENTS
-> shard/locks
-> busca por símbolo/path
-> menor snippet/diff
-> callers adicionais somente quando necessário
```

## Orçamento sugerido

Para janela `C`:

- regras: <= 12%;
- estado: <= 8%;
- conversa: <= 10%;
- docs recuperados: <= 15%;
- código/diffs: <= 35%;
- tool results: <= 10%;
- prompt do usuário: <= 5%;
- buffer livre: >= 15%.

Nunca trunque lock, contrato exato ou causa raiz silenciosamente.

## Compactação

Preserve decisões atuais, branch, blockers, restrições e referências. Converta história longa em
handoff estruturado e mantenha, por padrão, no máximo as seis mensagens recentes relevantes.

## Handoff

```text
TASK_RESULT
status:
summary:
decisions:
files_changed:
checks:
risks:
remaining_work:
references:
```

## Operações determinísticas

Use código para diff/inventário, versões Flyway, JSON/YAML, contagem de tokens, duplicatas, budget e
sumarização primitiva. Use modelo para interpretação e decisão.

## Telemetria

Uso real do provedor só pode vir de `input_tokens`, `output_tokens`, cached/reasoning/total fornecidos
pelo provedor. Estimativa local deve ser rotulada como heurística.

Métricas:

- tokens/task bem-sucedida;
- tokens/PR;
- tokens/bug;
- tokens/onda;
- mediana e p95 por operação;
- alerta de crescimento >25% em workflow equivalente.

Alertas sugeridos:

- contexto >60% da janela; crítico >80%;
- conversa >10%;
- bloco normalizado duplicado;
- arquivo >10%;
- tool result >10% sem drill-down;
- launcher >20 linhas ou 2.000 caracteres.
