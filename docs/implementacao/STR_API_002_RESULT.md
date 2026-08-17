# STR-API-002 — resultado

- **ITEM:** `STR-API-002`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_007`
- **baseline:** `9d5561e` (`main` mais recente no checkout)
- **status:** `PASS`
- **owners alterados:** `scripts/contracts/**`, artefatos consumidores em `contracts/openapi/**` e este `RESULT_MD`
- **owners somente leitura preservados:** `frontend/**`, `backend/**`
- **migration:** nenhuma

## Entrega

Foi criado um inventário estável dos call sites de `api` e `baixarArquivo` do frontend. O guard
resolve templates e alternativas estáticas, normaliza método/path, registra presença de body e modo
de consumo da resposta, e compara o inventário com o usage map e o snapshot OpenAPI. O alinhamento
valida cobertura bidirecional, `operationId`, método/path, parâmetros de path, body obrigatório e
status de sucesso consumidos. Nenhum client ou endpoint foi gerado ou alterado.

Fixtures isoladas cobrem alteração aditiva compatível e falhas por call site novo, call site
removido, rename de operação, método divergente, parâmetro obrigatório, body obrigatório e resposta
removida. A geração repetida foi comparada byte a byte.

## Locks preservados

- `LOCK-DATA-001`: somente fixtures sintéticas; nenhuma credencial, dado real ou chamada de rede.
- `LOCK-EVID-001`: validações focadas no owner e no contrato alterado.
- `LOCK-TEST-001`: nenhuma falha de baseline foi usada para alterar produção; frontend/backend
  permaneceram read-only.

## Comandos e resultados

- `python3 scripts/orchestration/dispatch_guard.py ... --github-aware --register`: dispatch permitido;
  auditoria remota indisponível por ausência de `GITHUB_REPOSITORY`/`GITHUB_TOKEN`; registro local
  transitório removido do diff.
- `python3 -m unittest discover -s scripts/contracts -p 'test_*guard.py'`: PASS, 13 testes.
- duas execuções de `consumer_contract_guard.py --frontend frontend/src --output <temp>` seguidas de
  `cmp`: PASS, artefatos byte-idênticos e iguais ao inventário versionado.
- `python3 scripts/contracts/consumer_contract_guard.py --frontend frontend/src --usage contracts/openapi/frontend-usage.json --openapi contracts/openapi/openapi.json`: PASS.
- `python3 scripts/contracts/openapi_guard.py check --baseline contracts/openapi/openapi.json --candidate contracts/openapi/openapi.json --usage-map contracts/openapi/frontend-usage.json`: PASS.
- `git diff --check`: PASS.

## Limitações e provas pendentes

Validação estrutural somente, conforme o contrato da onda. Não há alegação de runtime, browser,
banco, E2E, provider ou ambiente Windows. Nenhuma prova adicional está pendente para o aceite
estrutural deste item.

## Commit/PR

Commit e PR são criados no handoff imediatamente após a finalização deste resultado.
