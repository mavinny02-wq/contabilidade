# FIX-TECHNICAL-CONSOLE-500-001 — resultado

**ITEM:** `FIX-TECHNICAL-CONSOLE-500-001`  
**Baseline:** `main@7066ae34b1199584109e8c2cd611ee768b3421b3`  
**Status:** `BLOCKED_BASELINE_DRIFT`

## Resultado

A correção solicitada não pode ser implementada com segurança neste baseline. O arquivo canônico
informado, `frontend/src/features/technical-console/services/technicalConsoleApi.ts`, e o subtree
`frontend/src/features/technical-console/` não existem nem no checkout recebido nem na `main`
remota verificada. Portanto, não existe neste baseline uma lista de chamadas dessa tela que possa
ser reproduzida ou mapeada aos controllers correspondentes.

O frontend presente possui uma Console Técnica diferente, em português, cuja carga automática faz
somente `GET /api/console-tecnica/resumo`; a reconciliação opcional dispara
`GET /api/console-tecnica/storage/reconciliacao`. O backend deste baseline expõe esses contratos sob
`/api/console-tecnica`. Ele não contém mappings para os endpoints relatados
`/api/system/release`, `/api/technical/health`, `/api/technical/metrics/http/requests` ou
`/api/technical/postgres/**`.

Criar aliases, respostas vazias ou uma nova API com base apenas nos nomes observados mascararia o
desalinhamento de baseline e violaria a exigência de obter a exception real antes de corrigir a
causa raiz. Nenhum controller, tratamento de exceção, regra de autorização, mock ou dado fake foi
adicionado.

## Root cause

`BASELINE_DRIFT`: o código que origina as chamadas HTTP 500 descritas não está presente na
`main@7066ae3` disponibilizada pelo repositório remoto. Sem os clientes, controllers e serviços
correspondentes, e sem um runtime que exponha esses endpoints, não há stack trace real nem causa
raiz de produto que possa ser determinada neste checkout.

## Endpoints afetados

Relatados, mas ausentes deste baseline:

- `GET /api/system/release`;
- `GET /api/technical/health`;
- `GET /api/technical/metrics/http/requests`;
- `GET /api/technical/postgres/**`;
- demais endpoints que seriam enumerados por
  `frontend/src/features/technical-console/services/technicalConsoleApi.ts` e
  `frontend/src/features/technical-console/**`, ambos ausentes.

Endpoints reais da Console Técnica neste baseline:

- `GET /api/console-tecnica/resumo`;
- `GET /api/console-tecnica/storage/reconciliacao` (acionado explicitamente pela UI).

## Owners alterados

- Somente este `RESULT_MD`; nenhum arquivo executável foi alterado.

## Locks e invariantes preservados

- nenhuma exception foi engolida e nenhum erro foi convertido em HTTP 200;
- nenhuma regra `hasRole`, `ROLE_ADMIN`, `isAdmin()` ou bypass administrativo foi introduzida;
- nenhuma migration, dependência, configuração, mock ou dado fake foi criado;
- nenhuma alegação de runtime, autenticação ou stack trace foi feita sem evidência.

## Validação

| Comando | Resultado |
|---|---|
| `git fetch https://github.com/mavinny02-wq/contabilidade.git main` | `PASS` — `FETCH_HEAD` permaneceu em `7066ae3` |
| `git ls-tree -r --name-only FETCH_HEAD \| rg 'technicalConsoleApi\|technical-console'` | `PASS` — nenhum arquivo correspondente |
| `find frontend/src/features -maxdepth 3 -type f` | `PASS` — subtree solicitado ausente |
| `rg -n 'technical-console\|technicalConsoleApi\|/api/technical\|/api/system/release' .` | `PASS` — nenhum contrato executável correspondente |
| inspeção de `frontend/src/pages/ConsoleTecnicaPage.tsx` | `PASS` — somente os dois endpoints `/console-tecnica/**` acima |
| inspeção dos mappings em `backend/src/main/java/br/com/contabilidade/common/technical/` | `PASS` — API existente usa `/api/console-tecnica` |
| reprodução autenticada dos endpoints relatados | `BLOCKED_BASELINE_DRIFT` — endpoints e aplicação solicitados inexistentes neste baseline |
| captura de stack trace dos HTTP 500 relatados | `BLOCKED_BASELINE_DRIFT` — nenhum código/runtime deste baseline serve essas rotas |
| `git diff --check` | `PASS` |

## Limitação e desbloqueio necessário

É necessário fornecer ou publicar a branch/commit que contém
`frontend/src/features/technical-console/services/technicalConsoleApi.ts` e seus controllers de
backend, além da configuração local de autenticação sem credenciais reais. A investigação deve ser
retomada nesse baseline para reproduzir cada chamada com as permissions/groups do admin, capturar
os stack traces e então corrigir e testar a causa compartilhada.

## Commit e PR

- Commit: commit deste `RESULT_MD` na branch atual.
- PR: `NOT_CREATED_ENVIRONMENT_LIMITATION` — o servidor `make_pr` foi chamado após o commit, mas
  não inicia porque o ambiente MCP instalado não fornece `mcp.server.fastmcp`.
