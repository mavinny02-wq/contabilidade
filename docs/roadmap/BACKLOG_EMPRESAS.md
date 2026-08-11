# Backlog Empresas

## Candidato v0.2.0

- Empresa;
- matriz;
- filiais;
- CNPJ;
- situação;
- regime;
- CNAE;
- endereço;
- IE/IM;
- responsável;
- listagem/busca;
- criação/edição;
- inativação da empresa;
- Empresa 360.

## Implementado após v0.5.1 — aguardando runtime

- `EMP-FIL-001`: edição e inativação individual de filial, CNPJ imutável, auditoria e sincronização
  não destrutiva dos acompanhamentos de certidões; evidência em
  `docs/implementacao/EMP_FIL_001_EDICAO_FILIAL.md`;
- `EMP-IMP-001`: importação CSV UTF-8 com modelo, validação sem gravação, processamento por linha,
  limites configuráveis e resultado detalhado; evidência em
  `docs/implementacao/EMP_IMP_001_IMPORTACAO_CSV.md`;
- `EMP-HIS-001`: histórico cadastral da empresa e dos estabelecimentos baseado na auditoria,
  paginado e sem exposição de `detalhes_json`; evidência em
  `docs/implementacao/EMP_HIS_001_HISTORICO_CADASTRAL.md`;
- `EMP-GRP-001`: grupo opcional, até vinte tags, busca integrada e edição separada do cadastro
  fiscal; evidência em `docs/implementacao/EMP_GRP_001_GRUPOS_TAGS.md`.

## Pendências

- importação Excel nativa;
- enriquecimento oficial;
- validação específica de IE/IM;
- responsáveis por módulo.
