# Contabilidade — orquestração GitHub-first de ondas

**Classificação:** `CANONICAL_ACTIVE_WAVE_ORCHESTRATION`
**Versão:** `2.0`
**Repositório:** `mavinny02-wq/contabilidade`
**Branch:** `main`

GitHub é a fonte de verdade. Prompts são launchers compactos; regras e critérios ficam em
`AGENTS.md`, shards, locks e resultados.

## Triggers

Quando o usuário disser **“próxima onda”**:

- execute reconciliação incremental;
- selecione de um a cinco owners exatos e independentes;
- integre documentação necessária antes da publicação;
- libere launchers compactos somente depois dos gates resolvidos.

Quando disser **“onda intermediária”**:

- prepare candidatos e ownership;
- registre `PREPARED_NOT_RELEASED`;
- não publique launcher executável;
- revalide o delta antes da liberação futura.

Quando pedir **“extras”**:

- reconcile primeiro;
- extras contam no mesmo limite de cinco;
- retorne somente owners independentes reais.

## Modo fast — padrão

1. Leia índice, checkpoint e `AGENTS.md` aplicáveis.
2. Consulte HEAD e PRs abertas.
3. Compare apenas o último SHA reconciliado com o HEAD atual.
4. Inspecione arquivos/contratos/resultados do delta.
5. Reserve PRs abertas, owners reportados e migration lane.
6. Leia somente backlog/shards necessários para escolher trabalho seguro.
7. Trate somente merge como integrado.

Não reaudite toda a história ou todos os backlogs em modo fast.

## Modo deep — excepcional

Use deep quando:

- checkpoint estiver ausente, contraditório ou incapaz de estabelecer baseline;
- governança, `AGENTS.md`, templates ou guards mudarem;
- migration abaixo/igual ao frontier aparecer, houver duplicata ou ordem incerta;
- shared authority, catálogo de permissões ou contrato cross-module mudar;
- runtime contradizer documentação/lock;
- campanha consolidada/release gate estiver vencida;
- owner overlap não puder ser resolvido incrementalmente;
- após aproximadamente cinco ou seis ondas, para consolidação periódica.

Deep ainda evita leitura histórica sem relação.

## Ciclo de vida

```text
CANDIDATE
  -> PREPARED_NOT_RELEASED
  -> RELEASED_FOR_EXECUTION
  -> RESULTS_INTEGRATED
  -> CONSUMED
```

Saídas possíveis:

```text
BLOCKED
SUPERSEDED
NO_SUCCESSOR
REUSE_PASS
RERUN_FOCUSED
WAITING_FOR_DECISION
ENVIRONMENT_LIMITATION
```

## Preparação

Uma onda preparada contém:

- baseline observado;
- candidatos exatos;
- owner/path boundary;
- locks;
- dependências externas;
- colisões/reservas;
- migration owner potencial;
- condições de liberação.

Ela não contém launchers executáveis e não autoriza início.

## Liberação

Antes de `RELEASED_FOR_EXECUTION`:

- refresque HEAD e PRs;
- remova/substitua candidato obsoleto;
- resolva gates/documentação;
- fixe um baseline comum;
- confirme de um a cinco owners totais;
- confirme no máximo um migration owner;
- confirme ausência de dependência same-wave;
- materialize um `RESULT_MD` por owner;
- valide launchers com `scripts/orchestration/validate_prompt.py`.

## Capacidade e paralelismo

- capacidade máxima: cinco;
- mínimo: um;
- sem filler;
- oficiais + extras <= cinco;
- no máximo um owner de migration;
- hotspot compartilhado serial;
- cada owner produz um resultado bounded;
- bugs só são agrupados quando compartilham owner e outcome coerente.

## Documentação antes do launcher

Quando novo ID, lock, blocker, status ou shard for necessário:

- verifique duplicidade;
- escreva a fonte canônica mínima;
- publique por branch/PR;
- use somente conteúdo integrado para liberar task;
- não referencie ID ainda não integrado.

Documentation-only é trabalho do orquestrador e não consome slot.

## Evidência e testes

- ordinary wave usa validação estrutural;
- campanha de teste é explícita;
- falha é classificada antes da correção;
- evidência `REUSE_PASS` não é repetida sem invalidação;
- rerun é focado no owner alterado;
- uma campanha ampla só ocorre quando baseline transversal mudou ou release gate exige;
- Cloud e Windows são ambientes distintos;
- providers reais/pagos não fazem parte da validação comum.

## Launchers

Use `docs/ai/TEMPLATE_LAUNCHER_COMPACTO.md`.

O launcher deve:

- ter ITEM exato;
- baseline e owner exatos;
- apontar para shard/locks;
- não repetir a especificação;
- não conter gate condicional;
- não incluir história dinâmica;
- ter até 20 linhas/2.000 caracteres;
- declarar migration `NONE` ou exata;
- persistir resultado.

## Entrega ao usuário

Entregue uma única vez:

1. HEAD e delta reconciliado;
2. PR documental, ou confirmação de que não foi necessária;
3. integrados, blockers e evidência pendente;
4. launchers liberados, cada um em bloco próprio;
5. nota curta de paralelismo e migration owner.

Não repita a onda em uma segunda lista abreviada.

## Merge e fechamento

O usuário permanece merge owner de produção, testes, migrations, configuração e workflows, salvo
instrução explícita. Depois dos merges:

- reconcilie resultados;
- atualize checkpoint/ledger;
- classifique evidência;
- marque a onda `CONSUMED`;
- selecione próximo trabalho somente em novo trigger.

`CONTABILIDADE_WAVE_ORCHESTRATION_V2_ACTIVE`
