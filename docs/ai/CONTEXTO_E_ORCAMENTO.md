# Roteamento de contexto e orçamento de tokens

**Classificação:** `CANONICAL_CONTEXT_ROUTING_CONTRACT`  
**Referência:** PRIMA `release/1.0.0`, adaptado ao Contabilidade  
**Guard:** `scripts/ai/context_governance_guard.py`  
**Profiler:** `scripts/ai/context_token_profiler.py`

## Objetivo

Impedir que o crescimento de documentação aumente silenciosamente o contexto de toda task. O
repositório pode crescer; o conjunto HOT de cada owner deve permanecer pequeno, determinístico e
sem duplicação.

## Camadas

### HOT — obrigatório e pequeno

- `AGENTS.md` da raiz;
- `AGENTS.md` mais próximo do owner;
- launcher exato;
- shard da task;
- locks explicitamente listados.

### WARM — recuperado quando o trabalho exige

- contrato de API, schema, runbook ou política diretamente afetada;
- resultado anterior reutilizado;
- código adjacente necessário para entender o boundary;
- checkpoint somente em orquestração/reconciliação.

### COLD — histórico, nunca bootstrap universal

- waves consumidas;
- relatórios amplos;
- board/histórico;
- benchmark e backlog completo;
- evidências antigas que não são predecessor direto.

A progressão é `HOT -> WARM sob demanda -> COLD por investigação`. Não existe grafo de leitura
universal.

## Limites determinísticos

| Artefato | Warning | Hard fail |
|---|---:|---:|
| `AGENTS.md` raiz | 6.000 chars | 7.000 chars |
| `AGENTS.md` filho | 2.500 | 3.500 |
| cadeia raiz→owner | 9.000 | 10.000 |
| índice ativo | 4.000 | 5.500 |
| current state | 6.500 | 8.500 |
| bootstrap/resync | 1.200 | 1.800 |
| launcher | 20 linhas | 2.000 chars |

Hard fail bloqueia merge. Warning exige compactação, canonicalização ou justificativa no resultado.
Duplicação de parágrafo HOT gera warning mesmo abaixo do limite.

## Regras de compactação

- mova explicação longa para um documento canônico e deixe link + decisão no HOT;
- não copie checklist, lock ou histórico entre raiz e filho;
- resultado antigo vira resumo estruturado, não transcrição integral;
- output de ferramenta deve registrar finding, path, exit code e evidência mínima;
- ao atingir um gate, gere handoff estruturado e descarte conversa redundante;
- não inclua SHA, PR ou data em bootstrap estável;
- launchers não carregam segunda especificação, histórico ou alternativas abertas.

## Orçamento recomendado do input

O profiler usa estas proporções como warning, nunca como falsa precisão:

| Categoria | Fração do limite |
|---|---:|
| regras de agentes | 12% |
| estado atual | 8% |
| histórico da conversa | 10% |
| documentos recuperados | 15% |
| código recuperado | 35% |
| resultados de ferramentas | 10% |
| prompt do usuário | 5% |
| reserva | 5% |

Uma task pode exceder uma categoria quando o trabalho exige, mas o excesso deve ser visível.

## Medição honesta

`context_token_profiler.py` aceita um manifest de blocos. Para cada bloco registra categoria, fonte,
caracteres, bytes, linhas, hash normalizado e tokens.

- `PROVIDER_REPORTED`: somente contadores retornados pelo provedor; são uso real.
- `LOCAL_ESTIMATE`: `tiktoken` quando disponível, senão `ceil(chars/4)`; nunca é uso real.
- blocos iguais são detectados por hash normalizado;
- custo por outcome só é calculado quando preço e uso real possuem fonte explícita;
- prompt, resposta completa, chain-of-thought, segredo e PII não são persistidos.

Exemplo:

```text
python3 scripts/ai/context_token_profiler.py manifest.json \
  --repo-root . --json-output profile.json --markdown-output profile.md
```

## Safeguards automáticos

O guard verifica:

- tamanho da raiz, filhos e cadeia de `AGENTS.md`;
- tamanho de índice, checkpoint e bootstraps;
- parágrafos HOT duplicados;
- bootstrap com SHA/PR/data transitória;
- instrução de leitura universal;
- launcher acima de 20 linhas/2.000 chars;
- campos ausentes ou duplicados;
- condição opcional não resolvida;
- SHA dinâmica fora de baseline imutável.

Executar quando mudar:

```text
AGENTS.md
**/AGENTS.md
docs/ai/**
docs/INDICE_DOCUMENTACAO_ATIVA.md
docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md
docs/orquestracao/waves/**
```

## Métricas de maturidade

Após cada 5–10 tasks comparáveis, revisar:

- tokens HOT por owner;
- tokens recuperados por categoria;
- duplicação normalizada;
- tool output por finding útil;
- reruns por falta/excesso de contexto;
- custo por `PASS`, quando houver uso real;
- crescimento maior que 25% no mesmo tipo de task.

O objetivo não é minimizar contexto a qualquer custo; é maximizar evidência útil por token sem perder
segurança, autoridade ou reprodutibilidade.

## Executor externo opcional

Tasks limitadas podem usar o router em
`docs/ai/CONTABILIDADE_OPTIONAL_EXTERNAL_LLM_WORKER_ROUTING.md`. O uso é opcional, mantém o Codex
atual quando não há `DEEPSEEK_API_KEY` e não transfere autoridade de aceite ao worker externo.
