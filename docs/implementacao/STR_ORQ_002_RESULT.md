# STR-ORQ-002 — Governança do registro de migrações

## Resultado

Foi criado um registro autoritativo do inventário Flyway de V1 a V12, incluindo nome e checksum
SHA-256 de cada arquivo. Nenhuma migração SQL foi alterada.

O guard de orquestração valida:

- convenção de nome `V<versão>__<descrição>.sql`;
- unicidade e ordem crescente das versões;
- correspondência integral entre diretório e registro;
- imutabilidade de nome e conteúdo por checksum;
- rejeição de migração não registrada e de inclusão retrógrada.

O workflow de pull request executa tanto a validação do inventário real quanto os testes isolados
dos cenários válido, duplicado e retrógrado.

## Comportamento preservado

- Flyway continua como mecanismo exclusivo de evolução do schema.
- Os arquivos SQL V1–V12 e seu conteúdo permanecem inalterados.
- Os jobs preexistentes de backend, frontend e automation worker continuam independentes.

## Validações

- `node scripts/orchestration/validate-migration-registry.mjs`
- `node --test scripts/orchestration/tests/validate-migration-registry.test.mjs`
- `git diff --check`

## Pendências

Não há pendências para o escopo desta task. Toda migração futura deverá ser adicionada ao registro
na mesma alteração.
