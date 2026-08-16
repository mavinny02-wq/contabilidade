# BUG-RUN-001 — resultado

**ITEM:** `BUG-RUN-001`  
**Baseline:** `1288ed9a5f081fec03f5d869db7c622f4cd38f81` (`Merge PR #69: release Contabilidade Stabilization Wave 003`)  
**Status:** `IMPLEMENTED_AWAITING_LOCAL_WINDOWS_MANUAL`

## Owners alterados

- coletor e wrapper PowerShell de evidência Windows;
- schema JSON fechado e fixtures válidas/inválidas;
- testes Pester focados e validador estrutural das fixtures.

## Resultado

O coletor agora cobre `dev` e `onpremise`, registra ferramentas, revisão/dirty state, hash SHA-256
do Compose efetivo sem persistir seu conteúdo, estado dos serviços/containers, probes HTTP técnicos,
Flyway, Liquibase/Keycloak quando aplicável e comparação opcional do container PostgreSQL antes e
depois. A saída inclui JSON fechado pelo schema e resumo Markdown, com códigos distintos para
argumentos, escrita, coleta e evidência parcial.

## Locks preservados

- `LOCK-EXT-001`: nenhuma chamada a provider fiscal foi adicionada;
- `LOCK-DATA-001`: Compose efetivo é somente hasheado e redaction cobre credenciais, tokens,
  certificados e paths pessoais;
- `LOCK-ENV-001`: os testes Cloud usam mocks e não são declarados como prova Windows/Docker
  Desktop;
- `LOCK-TEST-001`: a limitação de ambiente permanece classificada como `ENVIRONMENT_LIMITATION`,
  sem alteração de produção.

## Comandos e resultados

- parser de PowerShell sobre módulo, wrapper e testes: `PASS`;
- Pester 6.1.0, comandos Docker/HTTP simulados: `PASS` (9 testes);
- `node scripts/orchestration/tests/validate-schema-fixtures.mjs`: `PASS`;
- `python -m json.tool scripts/orchestration/schemas/windows-evidence.schema.json`: `PASS`;
- `git diff --check`: `PASS` (avisos informativos de normalização LF/CRLF).

## Limitações e provas pendentes

A execução ocorreu em Cloud/Linux. A subida real, Docker Desktop, endpoints, bancos e comparação de
reuso do PostgreSQL continuam `LOCAL_WINDOWS_MANUAL`; este resultado não afirma essa prova.

## Commit/PR

Commit criado no branch de trabalho. Metadados de PR preparados após o commit.
