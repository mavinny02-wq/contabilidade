# BUG-CI-REQUIRED-WORKFLOW-YAML-PARSER-PORTABILITY-001 — resultado

- **Status:** `IMPLEMENTED_STRUCTURAL_GREEN`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `67f7b6571ce704129bc400b239863df6928a4037`

## Causa e correção

O verificador Python do contrato `Required CI` declarava não depender de pacotes Python externos,
mas delegava toda leitura YAML ao executável Ruby. Em um checkout Windows sem Ruby, os onze testes
falhavam com `FileNotFoundError` antes de validar qualquer regra do workflow.

O loader agora usa somente a biblioteca padrão do Python. JSON continua aceito como subconjunto
válido de YAML para fixtures mutantes; o workflow canônico é lido por um parser estrito e limitado
às estruturas usadas por GitHub Actions. Tabs, chaves duplicadas, indentação inválida, sequências
inline incompletas e recursos YAML fora desse contrato falham de forma explícita. A fixture mutante
também deixa de reabrir um `NamedTemporaryFile` ainda aberto, preservando execução Windows.

## Owners e locks

- `scripts/ci/validate_required_ci.py`;
- `scripts/ci/test_validate_required_ci.py`;
- este `RESULT_MD`;
- `LOCK-GIT-001`, `LOCK-TEST-001` e `LOCK-EVID-001` preservados;
- workflow, produto, dependências, startup, Docker e Pester permaneceram inalterados.

## Evidência

- reprodução anterior: `python -m unittest discover -s scripts/ci -p 'test_*.py'` — `ERROR`, 11 de
  11 testes bloqueados por `FileNotFoundError: ruby`;
- `python -m unittest discover -s scripts/ci -p 'test_*.py' -v` — `PASS`, 13 testes;
- as duas regressões novas provam leitura do workflow sem subprocesso/parser externo e rejeição de
  sequência YAML malformada;
- `python scripts/ci/validate_required_ci.py` — `PASS`, contrato canônico válido;
- `python -m py_compile scripts/ci/validate_required_ci.py scripts/ci/test_validate_required_ci.py`
  — `PASS`;
- `git diff --check` — `PASS`.

## Limitações

Esta correção prova apenas o contrato local do workflow e a portabilidade do loader. Não prova a
execução remota do GitHub Actions, Docker/Testcontainers, Pester, startup Windows nem runtime da
aplicação. O gate P0 externo permanece bloqueado pela ausência do provider NuGet/Pester 5+ e do
Docker Desktop autorizado.
