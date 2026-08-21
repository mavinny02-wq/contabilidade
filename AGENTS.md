# Contrato de agentes do repositório Contabilidade

## Autoridade e escopo

- Este arquivo governa o repositório. O `AGENTS.md` mais próximo apenas especializa seu subtree.
- Leia a raiz e o `AGENTS.md` mais próximo do owner; não carregue todos os agentes do projeto.
- GitHub define integração. Código/configuração executável define o comportamento atual, salvo lock aplicável.
- Decisões bloqueadas ficam em `docs/decisoes/CONTABILIDADE_LOCKS_OPERACIONAIS.md`.
- Estado transitório, SHA, PR, frontier e próxima seleção pertencem a
  `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`.

## Contexto e orçamento

Siga `docs/ai/CONTEXTO_E_ORCAMENTO.md`.

Workers opcionais seguem `docs/ai/CONTABILIDADE_OPTIONAL_EXTERNAL_LLM_WORKER_ROUTING.md`. Sem
chave de provedor, o runner preserva o Codex atual. Com DeepSeek, trabalho rotineiro e implementação
comum usam Flash. Pro é fail-closed: exige motivo aprovado e autoridade temporária
`PRIMA_DEEPSEEK_PRO_APPROVED=1`. O worker nunca assume decisão ou aceite; mantenha prompt bounded e
revisão final na task primária.

Contexto HOT de uma task comum:

1. este arquivo e o `AGENTS.md` mais próximo;
2. launcher exato;
3. shard canônico;
4. locks explicitamente mapeados.

Não pré-carregue índice global, checkpoint, board, histórico, todos os backlogs, todo o ledger ou
relatórios amplos quando o launcher identifica o owner. Use recuperação progressiva HOT/WARM/COLD.

Quando uma alteração tocar `AGENTS.md`, roteamento de contexto, bootstrap, índice, checkpoint,
manifest ou launcher, execute:

```text
python3 scripts/ai/context_governance_guard.py --repo-root . --base <base>
python3 -m unittest discover -s scripts/ai/tests -p "test_*.py"
```

Erros bloqueiam merge. Warnings exigem compactação ou justificativa no resultado. Estimativa local de
tokens nunca é apresentada como consumo real do provedor; use `context_token_profiler.py`.

## Baseline e owner

- Comece da `main` mais recente, salvo baseline imutável explícito.
- Nunca faça push direto na `main`; use branch e PR.
- Mantenha o diff bounded; não faça limpeza, refactor ou update de dependência não autorizado.
- PR/owner/hotspot ativo não recebe task paralela sobreposta.
- Toda task executável mantém um único `RESULT_MD`, inclusive bloqueio ou limitação de ambiente.
- Documentação-only que o orquestrador consegue atualizar diretamente não vira task ou slot Codex.

## Invariantes do produto

- Backend decide regra fiscal, estado, permissão, prazo, custo, idempotência e comando disponível.
- Frontend apresenta contratos e não recria autoridade do backend.
- PostgreSQL é a fonte persistente; cache, busca e índices são derivados.
- Flyway é o único mecanismo de schema; migration aplicada é imutável.
- Documento usa abstração de storage; binário não cria segunda fonte de verdade no banco.
- Execução técnica não é resultado de negócio.
- Fonte externa indisponível não significa regularidade nem irregularidade.
- Registro rastreável é inativado/arquivado, salvo decisão explícita de descarte.

## Segurança e operações externas

- Segredos, certificados, tokens, cookies, documentos fiscais e dados pessoais são sensíveis.
- Não registre segredo, payload fiscal completo ou PII desnecessária em log, fixture, resultado ou prompt.
- Provider fiscal real é negado por padrão; chamada paga exige autorização, owner e limite de custo.
- Credenciais e dados reais são proibidos em automação e CI.
- Não burle CAPTCHA, MFA, anti-bot ou intervenção humana.
- IA não executa ação fiscal autoritativa sem contrato e confirmação humana.
- Cloud/Linux não comprova Windows, Docker Desktop ou localhost do usuário.

## Orquestração de waves

- Wave possui até cinco owners, pode ter menos e nunca usa filler.
- Todos partem do mesmo baseline; não há dependência entre slots da mesma wave.
- No máximo um owner de migration.
- Hotspots são serializados pela matriz de owners.
- Lifecycle: `CANDIDATE -> PREPARED_NOT_RELEASED -> RELEASED_FOR_EXECUTION -> RESULTS_INTEGRATED -> CONSUMED`,
  com saídas `BLOCKED`, `SUPERSEDED` e `NO_SUCCESSOR`.
- Wave preparada não contém launcher executável.
- Não selecione successor condicional para o executor redescobrir gate já conhecido.
- Durante gate P0 de startup, nenhuma wave funcional comum pode ser liberada.

## Validação

Task comum usa validação proporcional e estrutural:

- backend: `mvn -B -DskipTests test-compile`;
- frontend: `npm ci`, i18n, typecheck e build;
- worker: `npm ci`, typecheck e build;
- configuração/documentação: parser e guard aplicável;
- sempre `git diff --check` quando houver checkout.

Testes, PostgreSQL real, browser, E2E, coverage, performance, segurança dinâmica e runtime Windows
exigem owner de validação liberado. Compile/build não prova runtime.

Classifique antes de corrigir: `PRODUCT_REGRESSION`, `TEST_CONTRACT_DRIFT`,
`DATA_OR_FIXTURE_DEFECT`, `ENVIRONMENT_LIMITATION` ou `BASELINE_DRIFT`.

## Dependências e resultado

- Não introduza GPL-3.0, AGPL, copyleft incompatível ou licença desconhecida.
- Dependência nova/atualizada exige justificativa, licença e owner; não edite lockfile manualmente.
- `RESULT_MD` registra item, baseline, owners, locks, comandos, resultados, limitações e PR.
- Console curto:

```text
ITEM: <id>
STATUS: <status>
RESULT_MD: <path>
COMMIT/PR: <valor>
```
