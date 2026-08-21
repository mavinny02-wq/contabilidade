# Roteamento opcional de executor LLM externo

**Classificação:** `CANONICAL_OPTIONAL_EXTERNAL_WORKER_RULE`
**Status:** `ATIVO`
**Escopo:** dispatch de workers Codex gerenciado pelo repositório

## Contrato

O Codex/OpenAI primário permanece como autoridade de orquestração, revisão e aceite. Um executor
limitado pode usar DeepSeek por `scripts/ai/contabilidade_llm_worker.py` quando
`DEEPSEEK_API_KEY` estiver disponível para o processo ou usuário atual.

- com chave: o worker usa o tier DeepSeek escolhido pela Responses API;
- sem chave: os mesmos argumentos seguem para a configuração Codex atual, sem override de modelo
  ou provedor;
- chave inválida ou provedor indisponível: o erro é devolvido, sem fallback silencioso;
- a chave nunca pode ir para Git, argumentos, logs, prompts gerados ou RESULT_MD.

Contribuidores sem conta DeepSeek continuam usando o fluxo Codex existente.

## Autoridade e seleção de tier

O orquestrador primário retém decisões de produto, classificação de segurança/privacidade,
resolução de conflitos, aceite estrutural, commit, push e deploy. A saída do worker é evidência para
revisão, nunca aceite autônomo.

- `flash`: testes, triagem, trabalho mecânico, implementação comum, inventário, lint e bugs simples;
- `pro`: somente `cross-stack`, `migration`, `concurrency`, `security` ou `architecture`;
- Codex/OpenAI atual: orquestração, intenção ambígua, decisão autoritativa e revisão final.

O roteamento por atividade é obrigatório por padrão. `test`, `triage`, `mechanical` e
`implementation` selecionam Flash. `architecture` pode selecionar Pro, mas não concede autoridade.
Toda rota DeepSeek Pro exige simultaneamente um `--pro-reason` fechado e
`PRIMA_DEEPSEEK_PRO_APPROVED=1`; sem ambos, o runner termina antes de construir a rota ou chamar o
provedor. `--pro-reason` com Flash também falha, inclusive quando não há chave.

## Uso

```text
python scripts/ai/contabilidade_llm_worker.py --tier flash -- exec --ephemeral --sandbox workspace-write -C . "<launcher compacto>"
python scripts/ai/contabilidade_llm_worker.py --tier flash --route-only
```

Pro autorizado somente para uma invocação PowerShell:

```text
$env:PRIMA_DEEPSEEK_PRO_APPROVED="1"
python scripts/ai/contabilidade_llm_worker.py --tier pro --pro-reason architecture -- exec --ephemeral --sandbox workspace-write -C . "<launcher complexo>"
Remove-Item Env:PRIMA_DEEPSEEK_PRO_APPROVED
```

Os valores aceitos por `--pro-reason` são `cross-stack`, `migration`, `concurrency`, `security` e
`architecture`. O runner consome a autorização e não a encaminha ao processo filho.

O router emite um registro seguro `CONTABILIDADE_LLM_ROUTE` no stderr. Overrides de
modelo/provedor fornecidos pelo chamador são rejeitados.

No Windows, o router também consulta `DEEPSEEK_API_KEY` do usuário quando o processo Codex foi
aberto antes da variável. A chave é passada somente no ambiente do filho e excluída de shells
iniciados pelo modelo. DeepSeek usa `CODEX_HOME` isolado: o caminho configurado em
`CONTABILIDADE_DEEPSEEK_CODEX_HOME`, `~/.codex-deepseek` quando já existir, ou
`~/.cache/contabilidade/codex-deepseek`. O fallback sem chave não altera `CODEX_HOME`.

## Limite de dados e medição

Ter a chave é opt-in técnico, não autorização para revelar fonte, segredo, credencial ou dado
pessoal. O launcher deve listar arquivos e owner exatos e limitar a resposta.

Comparações exigem o mesmo launcher, baseline, boundary e gate. Registre somente uso informado
pelo provedor, duração, exit code e blockers de revisão. Não trate estimativa local como token real
nem compare tarefas diferentes.

`CONTABILIDADE_OPTIONAL_EXTERNAL_LLM_WORKER_ROUTING_ACTIVE`
