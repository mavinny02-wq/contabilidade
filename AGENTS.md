# Contrato de agentes do repositório Contabilidade

## Escopo e autoridade

- Este arquivo governa todo o repositório. Um `AGENTS.md` mais próximo especializa seu próprio
  subtree sem repetir todas estas regras.
- Leia o `AGENTS.md` da raiz e o mais próximo do owner antes de editar.
- GitHub define o que foi integrado. Código/configuração executável atual define o comportamento
  existente, salvo quando uma decisão bloqueada aplicável define o comportamento aceito.
- Decisões bloqueadas ficam em `docs/decisoes/CONTABILIDADE_LOCKS_OPERACIONAIS.md` e devem ser
  lidas apenas quando mapeadas ao owner tocado.
- Estado transitório, SHA, PR, frontier de migration, falhas atuais e próxima onda pertencem a
  `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`, nunca a este arquivo.

## Roteamento de contexto

Siga `docs/ai/CONTEXTO_E_ORCAMENTO.md`.

Para um executor comum, o contexto HOT é somente:

1. este arquivo e o `AGENTS.md` mais próximo;
2. o launcher exato;
3. o shard canônico da task;
4. os locks mapeados, quando aplicáveis.

Não pré-carregue índice global, estado atual, board, histórico, relatórios amplos, todos os backlogs
ou todo o ledger de testes quando o launcher já informa o owner exato. Orquestração e reconciliação
leem o índice, o checkpoint, o delta Git/GitHub e somente os resultados afetados.

## Baseline e limite da task

- Comece da `main` mais recente, salvo baseline imutável explicitamente informado.
- Nunca faça push direto na `main`; use branch e PR.
- Mantenha a alteração bounded e preserve comportamento fora do objetivo.
- Não faça limpeza, refactor ou atualização de dependências não autorizada.
- PRs abertas, owners em execução e owners reservados não podem receber uma task paralela
  sobreposta.
- Toda task significativa mantém um único `RESULT_MD`, inclusive quando bloqueada, sem diff ou
  com limitação de ambiente.

## Invariantes do produto

- Backend calcula regras fiscais, estados, permissões, prazos, custos e disponibilidade de comandos.
- Frontend apresenta contratos prontos e não recria autoridade fiscal.
- PostgreSQL é a fonte autoritativa persistente. Busca, cache e índices são derivados.
- Flyway é o único mecanismo de schema. Nunca edite migration aplicada.
- Documentos usam abstração de storage; conteúdo binário não vira uma segunda fonte de verdade no
  banco.
- Execução técnica é distinta do resultado de negócio.
- Falha, ausência ou indisponibilidade de fonte externa não significa regularidade nem
  irregularidade fiscal.
- Registros rastreáveis são inativados/arquivados, não apagados fisicamente sem decisão explícita.

## Segurança e operações externas

- Segredos, certificados, tokens, documentos fiscais, CNPJ associado a pessoas e dados pessoais são
  sensíveis.
- Nunca registre segredo, credencial, cookie, payload fiscal completo ou PII desnecessária em log,
  fixture, resultado ou prompt.
- Chamadas a provider fiscal real são negadas por padrão.
- Chamadas pagas exigem autorização explícita, owner e limite de custo.
- Credenciais e dados reais são proibidos em tarefas automatizadas e CI.
- Não burle CAPTCHA, MFA, anti-bot ou intervenção humana.
- IA não executa ação fiscal autoritativa sem contrato e confirmação humana aplicáveis.
- O executor Cloud não pode alegar prova do Windows, Docker Desktop ou localhost do usuário.

## Orquestração de ondas

- Uma onda tem capacidade de **até cinco** owners executáveis e pode ter menos; nunca crie filler.
- Todos os owners partem do mesmo baseline verificado.
- Não há dependência entre slots da mesma onda.
- Owners oficiais e extras contam juntos para o limite.
- Existe no máximo um owner de migration por onda.
- Shared hotspots são serializados conforme
  `docs/orquestracao/CONTABILIDADE_EXECUTION_OWNER_MATRIX.md`.
- Ciclo de vida: `CANDIDATE -> PREPARED_NOT_RELEASED -> RELEASED_FOR_EXECUTION ->
  RESULTS_INTEGRATED -> CONSUMED`, com saídas `BLOCKED`, `SUPERSEDED` e `NO_SUCCESSOR`.
- Uma onda preparada não contém launchers executáveis.
- Documentação-only de análise, decisão, intake, reconciliação e seleção é trabalho do orquestrador
  e não consome slot.
- Não selecione sucessor condicional para o executor redescobrir um gate já conhecido.

## Validação

Ondas comuns de implementação/correção usam **validação estrutural somente**:

- backend: compile/test-compile sem executar suíte, mais checks proporcionais;
- frontend: locale, typecheck e build;
- worker: typecheck e build;
- configuração/documentação: parser/guard aplicável;
- sempre `git diff --check` quando houver checkout Git.

Testes unitários, integração, PostgreSQL real, browser, E2E, coverage, performance, segurança dinâmica
e runtime Windows exigem campanha ou owner de validação explicitamente liberado. Compile/build não
é prova de runtime, banco, navegador, acessibilidade ou provider.

Falhas devem ser classificadas antes de qualquer correção:
`PRODUCT_REGRESSION`, `TEST_CONTRACT_DRIFT`, `DATA_OR_FIXTURE_DEFECT`,
`ENVIRONMENT_LIMITATION` ou `BASELINE_DRIFT`.

## Dependências e licenças

- Não introduza GPL-3.0, AGPL, código/assets copyleft incompatíveis ou licença desconhecida.
- Toda dependência nova/atualizada exige justificativa, licença e owner.
- Lockfiles e BOMs não são editados manualmente apenas para obter diff verde.

## Resultado e handoff

O `RESULT_MD` registra ITEM, baseline, status, owners alterados, locks preservados, comandos e
resultados, limitações, provas pendentes e commit/PR. O console permanece curto:

```text
ITEM: <id>
STATUS: <status>
RESULT_MD: <path>
COMMIT/PR: <valor ou NOT_CREATED_NO_DIFF>
```
