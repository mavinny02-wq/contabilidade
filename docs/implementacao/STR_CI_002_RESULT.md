# STR-CI-002 — resultado

- **ITEM:** `STR-CI-002`
- **WAVE_ID:** `CONTABILIDADE_HARDENING_WAVE_006`
- **DISPATCH_KEY:** `637a4ff2255908913d33d005b70d0bf1431ea273302816583a2bce736bcae4cd`
- **Baseline executado:** `0c4d42bb8e9600351e510269cc677264952ca10e` (checkout fornecido, merge da Wave 006 sobre o baseline de dispatch `a3344a15a0581fd7f76f78766c6432b46f9a361e`)
- **Status:** `IMPLEMENTED_REMOTE_EVIDENCE_BLOCKED`

## Owners alterados

- `.github/workflows/required-ci.yml`
- `scripts/ci/validate_required_ci.py`
- `scripts/ci/test_validate_required_ci.py`
- este `RESULT_MD`

## Implementação

O workflow `Required CI` preserva o job final `required-ci` e, portanto, o check futuro
`Required CI / required-ci`. O gate agora aceita `pull_request`, `push` em `main` e
`workflow_dispatch`, sem filtros de caminho. Diagnóstico limitado a evento, ref, SHA e conclusões
das lanes evita dump de ambiente, payload ou secrets.

As lanes incorporam coverage dos três componentes e o contrato do ratchet, snapshot/compatibilidade
OpenAPI e mapa de uso, catálogo de fixtures sintéticas, budgets de artefato, secret/PII, migrations,
versão, manifests de wave e dependency policy. O fan-in mantém `if: always()`, depende de todas as
lanes obrigatórias e só aceita conclusão `success`, sem `continue-on-error` ou condição de skip nas
lanes.

## Locks preservados

- `LOCK-GIT-001`: nenhuma alteração ou push direto em `main`; integração depende de PR.
- `LOCK-EVID-001`: validações focadas reutilizam os guards e fixtures versionados.
- `LOCK-TEST-001`: nenhuma falha de produto foi observada ou mascarada; ausência de prova remota foi
  classificada como limitação externa, não como PASS.

## Validação local

| Comando | Resultado |
|---|---|
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_HARDENING_WAVE_006 --item STR-CI-002 --baseline a3344a15a0581fd7f76f78766c6432b46f9a361e --key 637a4ff2255908913d33d005b70d0bf1431ea273302816583a2bce736bcae4cd --github-aware --register` | `DISPATCH_ALLOWED`; auditoria remota indisponível por ausência de configuração GitHub |
| `python3 scripts/ci/test_validate_required_ci.py` | PASS, 11 testes de gate, triggers, controles, logging e fan-in |
| `python3 scripts/ci/validate_required_ci.py` | PASS, contrato canônico válido |
| `ruby -e "require 'yaml'; YAML.safe_load(File.read('.github/workflows/required-ci.yml'), aliases: true); puts 'YAML_OK'"` | PASS, `YAML_OK` |
| `git diff --check` | PASS |

## Evidência remota e limitação

Classificação: `GITHUB_ACTIONS_SETTINGS_OR_PERMISSION_BLOCKER`. O checkout não possui remote Git e
não recebeu `GITHUB_REPOSITORY` ou `GITHUB_TOKEN`; portanto não existem run ID ou URL consultáveis e
nenhum PASS remoto é alegado.

Checklist externo exato após publicar a PR:

1. confirmar que GitHub Actions está habilitado no repositório;
2. confirmar permissão de leitura de contents para o workflow;
3. abrir a aba Actions e localizar a run `Required CI` do SHA da PR;
4. confirmar que todas as lanes obrigatórias concluíram em `success`;
5. confirmar o check final exatamente como `Required CI / required-ci`;
6. executar `workflow_dispatch` e confirmar uma segunda run bem-sucedida;
7. após merge, confirmar a run disparada por `push` em `main`;
8. só então configurar branch protection para exigir o check, sem alterá-la nesta task.

## Provas pendentes

A execução hospedada (PostgreSQL 17/Testcontainers, Chromium, builds e budgets completos) e os
triggers remotos permanecem pendentes até a publicação da branch e disponibilidade do GitHub.
Nenhuma chamada fiscal, credencial ou dado real foi usada.

## Commit/PR

Commit local e PR são registrados pelo handoff da execução; a URL remota não estava disponível ao
produzir esta evidência.
