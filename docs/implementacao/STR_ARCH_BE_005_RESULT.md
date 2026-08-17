# STR-ARCH-BE-005 — resultado

**ITEM:** `STR-ARCH-BE-005`  
**WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_011`  
**BASELINE:** `eca3cd61f9ea11770ca5c31bf985906dec0954bb` (`latest main` disponibilizada no checkout)  
**STATUS:** `PASS`

## Owners alterados

- porta mínima de consulta de Empresa pertencente a `common/document`;
- adapter da feature Empresa;
- `DocumentoService`;
- testes focados do serviço e do adapter;
- baseline e allowlist do architecture guard.

## Resultado

- `DocumentoService` deixou de importar `EmpresaRepository` e consulta somente a porta
  `EmpresaDocumentoConsulta.existePorId`.
- `EmpresaDocumentoAdapter` preserva a autoridade de persistência e delega a existência por ID ao
  repository existente.
- Empresa inexistente continua produzindo `EMPRESA_NAO_ENCONTRADA`; os demais fluxos documentais
  não foram alterados.
- O inventário determinístico passou de 600 para 601 arestas devido à nova porta e caiu de um para
  zero findings; a allowlist ficou vazia e nenhum finding novo foi criado.
- Não houve alteração de endpoint, payload, permissão, POM, migration, schema ou dependência.

## Locks preservados

- `LOCK-EVID-001`: foram executadas somente as provas focadas liberadas e o inventário foi repetido
  apenas para comprovar determinismo.
- `LOCK-TEST-001`: os testes focados passaram sem falha de produto. Uma invocação de Maven feita na
  raiz, sem `pom.xml`, foi identificada como erro operacional de diretório antes do rerun correto em
  `backend`; nenhuma produção foi alterada em resposta.

## Comandos e resultados

- `java -version`: `PASS`, OpenJDK 21.0.2.
- `cd backend && mvn -B -Dtest=DocumentoServiceTest,EmpresaDocumentoAdapterTest test`: `PASS`
  (3 testes, 0 falhas/erros).
- `cd backend && mvn -B -DskipTests test-compile`: `PASS`.
- `python3 scripts/architecture/architecture_guard.py inventory --output scripts/architecture/baseline.json`:
  `PASS`, 601 arestas e 0 findings; segunda geração produziu SHA-256 idêntico.
- `python3 scripts/architecture/architecture_guard.py check`: `PASS` (601 arestas, 0 findings
  permitidos).
- `git diff --check`: `PASS`.
- `mvn -B -DskipTests test-compile` na raiz: invocação inválida por ausência de `pom.xml`; corrigida
  pelo comando canônico dentro de `backend`, que passou.

## Limitações e provas pendentes

- Validação limitada ao contrato liberado: testes focados, test-compile e guard arquitetural. Não
  constitui prova de runtime, PostgreSQL real, browser, provider ou suíte integral.

## Commit/PR

- Commit: criado na branch da task após finalizar este resultado.
- PR: `NOT_CREATED_TOOL_UNAVAILABLE` — a ferramenta `make_pr` não está disponível neste ambiente.
