# STR-FE-BUNDLE-001 — resultado

**ITEM:** `STR-FE-BUNDLE-001`  
**WAVE_ID:** `CONTABILIDADE_HARDENING_WAVE_006`  
**DISPATCH_KEY:** `5bb7c05a84f55b04849a905fcdae4447b71f77ce9527c18b039cef2b15b8a04e`  
**BASELINE do launcher:** `a3344a15a0581fd7f76f78766c6432b46f9a361e`  
**HEAD inicial:** `0c4d42b78cd996ac22f1940fed4c21dcc5d4405b`  
**STATUS:** `PASS`

## Implementação

- As páginas deixaram de ser imports estáticos do router e são carregadas por um boundary dinâmico
  compartilhado quando a primeira rota de página é renderizada.
- `ProtectedRoute`, `PermissionRoute`, redirects, rotas de erro e a hierarquia do router foram
  preservados.
- O boundary usa `Suspense` com o `LoadingScreen` acessível e as chaves existentes
  `app.carregando`, `comum.erroCarregamento` e `acoes.atualizar`.
- Uma rejeição do chunk é capturada por error boundary e oferece recarga controlada, em vez de tela
  vazia.
- Não houve dependência nova, alteração de endpoint, regra de permissão ou manifesto.

## Medição de artefato

Medição sobre `frontend/dist`, usando a mesma função `measure_frontend` do guard canônico:

| Métrica | Antes (baseline canônico) | Depois |
| --- | ---: | ---: |
| maior chunk JS bruto | 543.274 bytes | 412.562 bytes |
| maior chunk JS gzip | 157.660 bytes | 131.921 bytes |
| total | 567.372 bytes | 571.493 bytes |
| chunks JS | 2 | 3 |

Chunks JS produzidos: `index-B1l2E6dW.js` (412.562 bytes) e
`routePages-BI9st4jx.js` (134.830 bytes), além do script inline contabilizado pelo medidor como
chunk. O maior chunk caiu 130.712 bytes (24,1%) e ficou abaixo do aceite de 500 KiB. O total cresceu
4.121 bytes, dentro da tolerância vigente de 8.192 bytes; o limite de maior chunk continua sendo o
aceite estrito da task, sem elevação artificial do warning do Vite.

O guard global não foi usado como alegação de `PASS`: ele exige também backend e worker já
construídos e sua política histórica proíbe aumento na contagem de chunks, condição incompatível
com esta divisão autorizada. A validação focada reutilizou seu medidor e verificou por assertion o
limite de 500 KiB, a redução contra o baseline e o budget de bytes totais. Essa incompatibilidade de
contagem foi classificada como `TEST_CONTRACT_DRIFT` conforme `LOCK-TEST-001`; produção e política
read-only não foram alteradas para mascarar o resultado.

## Validações

Executadas com Node `v24.15.0`:

- `npm ci --no-audit --no-fund`: dependências instaladas a partir do lockfile, sem edição.
- `npm run locale:validate`: PASS (22 catálogos, 65 arquivos e 86 entradas dinâmicas).
- `npm run typecheck`: PASS.
- `npm test`: PASS (8 arquivos, 22 testes), incluindo fallback, falha de chunk e rotas/permissões.
- `npm run build`: PASS; 154 módulos transformados.
- medição focada com `measure_frontend` e assertions: PASS.
- `rg -n "^import .*pages/" frontend/src/app/router.tsx`: PASS, nenhum import estático residual.
- `git diff --check`: PASS.

## Locks, limitações e provas pendentes

- `LOCK-EVID-001`: baseline canônico de artefatos foi reutilizado; reruns foram focados no owner.
- `LOCK-TEST-001`: nenhuma produção foi mudada em resposta à incompatibilidade do guard global.
- A validação comprova build e tamanho de artefato, não runtime de navegador, acessibilidade
  dinâmica ou rede real.
- Prova pendente: nenhuma para o aceite estrutural. Runtime em browser permanece fora do escopo.

## Handoff Git

- Commit: criado na branch atual (SHA registrado no Git).
- PR: `NOT_CREATED_TOOL_UNAVAILABLE` — o ambiente não expôs o tool `make_pr` nem um remote Git.
