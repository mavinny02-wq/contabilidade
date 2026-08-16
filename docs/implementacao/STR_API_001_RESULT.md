# STR-API-001 — Resultado

## Identificação

- **ITEM:** `STR-API-001`
- **WAVE_ID:** `CONTABILIDADE_QUALITY_GATE_WAVE_005`
- **CONTRACT:** `2.0`
- **BASELINE de execução:** `c3c06e8cb5921f96ecdb9b1e397594d01dd4430f`
- **HEAD inicial (latest main disponível):** `f9559a5ecafd4fdbf2fed59c2736ab8c5303538d`
- **DISPATCH_KEY:** `fbc08b313e084b952fdd0a3501df93a76e536bc56d687aa63cef7402b7c1b996`
- **STATUS:** `PASS`

## Entrega

- Snapshot OpenAPI normalizado e determinístico, derivado do `/v3/api-docs` da aplicação sem banco,
  provider fiscal, credencial ou dado real.
- Gerador falha de forma fechada quando a aplicação não inicia ou o endpoint não responde com
  sucesso; servidores e metadados voláteis são removidos.
- Operações são classificadas explicitamente como `public` ou `internal` por
  `x-contabilidade-visibility`; endpoints `/api/interno/**` permanecem visíveis no contrato.
- Guard cobre remoções de path, método, `operationId`, response, schema e propriedade; mudanças
  incompatíveis de parâmetros, request body, tipos, formatos e enums; autorização relaxada; mapa
  frontend; e exceções temporárias com owner, motivo, versão de transição e expiração.
- Mapa declarativo registra as operações que os clients frontend atuais consomem, sem gerar client
  ou refatorar chamadas.

## Inventário do snapshot

- **Paths:** 62
- **Operações:** 66
- **Schemas:** 77
- **SHA-256:** `4231a881d058d3c7d259a7c94c8bf48fcb7b6b86daec519772a40cbf4c859f95`

## Owners alterados

- `contracts/openapi/**`
- `scripts/contracts/**`
- `docs/implementacao/STR_API_001_RESULT.md`

Nenhum controller, service, migration, manifesto, POM ou lockfile foi alterado.

## Locks preservados

- `LOCK-EVID-001`: geração duplicada e checks focados foram usados como evidência reutilizável.
- `LOCK-TEST-001`: nenhuma falha de produto foi mascarada; o primeiro experimento de geração sem
  dialect foi classificado como `ENVIRONMENT_LIMITATION` do harness e corrigido somente no script.
- `LOCK-DATA-001`: geração usa inicialização lazy sem conexão funcional com banco e sem dado,
  credencial ou provider real.

## Validação

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_QUALITY_GATE_WAVE_005 --item STR-API-001 --baseline c3c06e8cb5921f96ecdb9b1e397594d01dd4430f --key fbc08b313e084b952fdd0a3501df93a76e536bc56d687aa63cef7402b7c1b996 --github-aware --register` | `DISPATCH_ALLOWED`; auditoria remota indisponível sem variáveis GitHub |
| `python3 scripts/contracts/test_openapi_guard.py` | PASS, 8 testes |
| `scripts/contracts/generate_openapi.sh` (duas execuções) | PASS; bytes e SHA-256 idênticos |
| `python3 scripts/contracts/openapi_guard.py check --baseline contracts/openapi/openapi.json --candidate contracts/openapi/openapi.json --usage-map contracts/openapi/frontend-usage.json` | `OPENAPI_COMPATIBILITY_OK` |
| `cd backend && mvn -B -DskipTests test-compile` | PASS |
| `git diff --check` | PASS |

## Limitações e provas pendentes

- A geração comprova bootstrap estrutural suficiente para o Springdoc, não runtime com PostgreSQL,
  provider, navegador ou ambiente Windows.
- GitHub remoto não estava configurado no dispatch-preflight; isso não alterou a autorização local
  assinada pelo dispatch guard.

## Commit e PR

- Commit: produzido na branch da task após as validações.
- PR: não criado: a ferramenta obrigatória `make_pr` não está disponível neste ambiente.
