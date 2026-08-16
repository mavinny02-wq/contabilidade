# Governança da documentação

**Classificação:** `CANONICAL_ACTIVE_GOVERNANCE`

## Hierarquia de autoridade

1. decisão/lock aceito e aplicável;
2. GitHub para integração, branch, commit, PR e diff;
3. código/configuração executável atual para comportamento existente;
4. shard canônico da task para objetivo e critérios aceitos;
5. `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md` para estado dinâmico;
6. `docs/testing/MASTER_TEST_ORCHESTRATION.md` para evidência e disposição;
7. registros/backlogs de produto e estrutura;
8. histórico imutável como evidência fria.

Uma evidência de teste que contradiz lock ou contrato atual não autoriza regressão de produção.

## Donos canônicos

- índice/roteamento: `docs/INDICE_DOCUMENTACAO_ATIVA.md`;
- estado operacional: `docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`;
- orquestração de ondas: `docs/orquestracao/CONTABILIDADE_WAVE_ORCHESTRATION_V2.md`;
- intake do usuário: `docs/orquestracao/CONTABILIDADE_USER_REPORTED_INTAKE.md`;
- ownership/hotspots: `docs/orquestracao/CONTABILIDADE_EXECUTION_OWNER_MATRIX.md`;
- evidência/testes: `docs/testing/MASTER_TEST_ORCHESTRATION.md`;
- locks: `docs/decisoes/CONTABILIDADE_LOCKS_OPERACIONAIS.md`;
- IDs estruturais: `docs/roadmap/BACKLOG_ESTRUTURAL.md`;
- IDs de produto existentes: `docs/roadmap/REGISTRO_ITENS_ROADMAP.md`.

## Atualização direta pelo orquestrador

Aplique `LOCK-ORQ-DOC-001`.

Quando o orquestrador possui acesso de escrita ao GitHub e consegue criar ou atualizar uma
alteração documentation-only, ele executa diretamente a manutenção por branch/PR e não delega ao
Codex. Esse trabalho:

- não consome slot de onda;
- não recebe launcher;
- não cria branch Codex;
- não exige `RESULT_MD` artificial;
- não entra no backlog apenas para justificar a atualização;
- deve respeitar owners abertos, locks, histórico e fluxo GitHub-first.

São exemplos de manutenção direta:

- índice e roteamento;
- checkpoint e estado atual;
- ledger/classificação de evidência;
- backlog e registro de IDs;
- locks e decisões autorizadas;
- intake, reconciliação, seleção e manifests;
- análise e documentação canônica sem implementação associada.

O executor continua owner do `RESULT_MD` da própria task e de documentação inseparável de uma
mudança de código, configuração ou tooling. Uma delegação documental ao Codex só é aceitável quando
o orquestrador comprovar que não possui a capacidade necessária.

## Atualização por task executável

Uma task comum altera somente owners autorizados e seu `RESULT_MD`. Estado global, seleção, intake,
decisão, backlog e reconciliação documentation-only são responsabilidade do orquestrador e não
consomem slot executável.

Não duplique fatos dinâmicos. O board antigo é compatibilidade/roteamento; o checkpoint é o único
owner do estado operacional atual.

## Histórico e supersession

- Artefatos concluídos vão para `docs/historico/YYYY-MM/`.
- Histórico não é reescrito nem usado para selecionar trabalho.
- Documento substituído recebe referência clara ao sucessor.
- Git history preserva versões antigas de manifests e prompts; outputs legados não permanecem
  executáveis apenas porque ainda existem no repositório.

## Honestidade de evidência

`PASS` estrutural não é `PASS` runtime. Resultado parcial, limitação de ambiente, baseline diferente
e prova expirada são registrados explicitamente.
