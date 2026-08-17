# STR-ARCH-BE-004 — resultado

**ITEM:** `STR-ARCH-BE-004`  
**WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_010`  
**BASELINE:** `507a09610700a16415860f5d966e3a9cda17b377` (`latest main` disponibilizada no checkout)  
**STATUS:** `PASS`

## Owners alterados

- porta/projeções de consulta de Empresa para Certidão;
- adapter da feature Empresa;
- consumidores `CertidaoService` e `CertidaoSchedulerBatchService`;
- testes focados do contrato e do serviço;
- baseline e allowlist do architecture guard.

## Resultado

- Certidão deixou de importar `EmpresaRepository` e `EstabelecimentoRepository`.
- A porta expõe somente os campos e as consultas necessários, preservando ordenação e paginação
  por cursor nos repositories do adapter.
- O inventário determinístico permanece com 600 arestas e caiu de quatro para um finding.
- O finding restante é `DocumentoService -> EmpresaRepository`.
- Não houve migration, alteração de schema, dependência nova ou chamada a provider.

## Locks preservados

- `LOCK-EVID-001`: validações foram focadas e a evidência estrutural existente foi reutilizada.
- `LOCK-TEST-001`: a primeira execução focada falhou por CNPJ inválido criado no teste; a falha foi
  classificada como `DATA_OR_FIXTURE_DEFECT` antes de corrigir exclusivamente a fixture.

## Comandos e resultados

- `java -version`: `PASS`, OpenJDK 21.0.2.
- `cd backend && mvn -B -DskipTests test-compile`: `PASS`.
- `cd backend && mvn -B -Dtest=CertidaoServiceTest,EmpresaCertidaoAdapterTest test`: primeira
  execução `DATA_OR_FIXTURE_DEFECT`; rerun `PASS` (3 testes, 0 falhas/erros).
- `python3 scripts/architecture/architecture_guard.py inventory --output scripts/architecture/baseline.json`:
  `PASS`, inventário revisado com 600 arestas e 1 finding.
- `python3 scripts/architecture/architecture_guard.py check`: `PASS` (600 arestas, 1 finding permitido).
- `python3 -m unittest scripts.architecture.tests.test_architecture_guard`: `PASS`.
- `git diff --check`: `PASS`.

## Limitações e provas pendentes

- Validação limitada ao contrato liberado: compile/test-compile, testes focados e guard
  arquitetural. Não constitui prova de runtime, PostgreSQL real, provider ou suíte integral.

## Commit/PR

- Commit: criado na branch da task após finalizar este resultado.
- PR: metadados criados com a ferramenta `make_pr` após o commit.
