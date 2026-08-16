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

## Atualização

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
