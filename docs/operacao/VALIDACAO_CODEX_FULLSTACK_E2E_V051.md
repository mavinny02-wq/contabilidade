# Validação full-stack E2E no Codex Cloud — v0.5.1

## Identificação e baseline

- Item: `VAL-CLOUD-FULLSTACK-E2E-V051-001` (slot 4/5).
- Executor: Codex Cloud Linux, em 11/08/2026.
- Versão confirmada em `VERSION`: `0.5.1`.
- SHA inicial: `d960da515d39355378789769bac7b6334b56c421`.
- SHA final da árvore validada: registrado pelo commit/PR desta entrega (o documento não se
  autorreferencia).
- Branch: `validation/cloud-fullstack-e2e-v051`.
- O checkout Cloud não continha remoto configurado. A baseline local já continha os merges #45
  (histórico de workers), #46 (preflight), #47 (metadados documentais), #48 (reconciliação) e #49
  (readiness), confirmando as entregas anteriores disponíveis antes deste slot.
- `contabilidade-maintenance` não existe neste executor; `contabilidade-prepare e2e` foi executado.

## Orquestração local e segurança

O script permanente `scripts/codex/fullstack-e2e.sh` recusou portas ocupadas, validou estritamente
host `127.0.0.1`, usuário `contabilidade`, database `contabilidade_codex_e2e` e ambiente
`CODEX_CLOUD` antes de recriar a base. PostgreSQL 16, backend, worker e Vite foram executados sem
Docker e presos à interface local. A execução verde usou PIDs temporários `19415` (backend), `19505`
(worker) e `19602` (frontend); PostgreSQL foi o cluster local controlado pelo script.

Os processos foram mantidos até o fim das provas e encerrados pelos traps. Eles **não permanecem
acessíveis** depois da tarefa: o executor é efêmero. Logs/PIDs foram mantidos em diretório `mktemp`
apenas durante a execução, sem imprimir tokens. Providers apontaram apenas para uma porta local
fechada e nenhuma aquisição fiscal foi enfileirada. O navegador bloqueou qualquer host diferente de
`127.0.0.1`, `localhost` e `data:`.

## URLs e API smoke

| Prova | Resultado |
|---|---|
| `http://127.0.0.1:8080/actuator/health/liveness` | HTTP 200 |
| `http://127.0.0.1:8080/actuator/health/readiness` | HTTP 200 |
| `http://127.0.0.1:3001/health` | HTTP 200 |
| `http://127.0.0.1:5173/` | HTTP 200 |
| `http://127.0.0.1:5173/api/info` (proxy Vite) | HTTP 200 |
| Flyway | 12 migrations, última `12:true` |
| heartbeat | registro presente em `worker_heartbeats` |
| HTTP 500 no cenário final | zero |

## Browser smoke permanente

O Playwright criou empresa fictícia com prefixo `CODEX-E2E-`, CNPJ matematicamente válido gerado em
runtime e documento de texto mínimo sintético. Foram cobertos dashboard, Empresas, criação, Empresa
360, responsáveis por módulo, documentos/upload, centro e agenda de certidões, execuções,
intervenções, notificações, integrações, histórico de providers, reconciliação de faturas, auditoria,
backups, configuração segura, preflight, console técnico e histórico de workers. Também houve refresh
direto de Empresa 360 e captura local em `/tmp/contabilidade-codex-e2e.png`.

O cenário final informou 19 jornadas aprovadas, sem erro não tratado no console, HTTP 500, falha de
rede local relevante ou chamada externa. Cancelamentos `net::ERR_ABORTED` causados exclusivamente por
navegação entre rotas SPA são ignorados pelo coletor; demais falhas locais continuam fatais. Não
houve preview/download porque o formato sintético `text/plain` não oferece preview na UI; upload e
listagem foram comprovados sem usar documento fiscal.

## Defeitos reproduzidos e correções

1. Lease do worker enviava `Instant` diretamente ao JDBC e causava HTTP 500; agora converte para
   `Timestamp`, com regressão unitária.
2. Busca vazia de empresas era inferida como `bytea` pelo PostgreSQL; o termo vazio agora permanece
   texto, com regressão unitária.
3. O graph detalhado tentava buscar duas listas aninhadas no mesmo SQL e causava
   `MultipleBagFetchException`; o graph foi estreitado, com regressão de contrato.
4. Histórico de providers também enviava `Instant` diretamente ao JDBC; os limites usam
   `Timestamp`, com regressão unitária.
5. Worker e Chromium não eram executáveis de modo estritamente local/root no Cloud; host e sandbox
   passaram a ser configuráveis e o perfil E2E desliga sandbox somente nesta execução local.
6. A origem `127.0.0.1:5173` não estava no CORS local; o script a habilita somente para o processo.
7. A prova de heartbeat referia o nome singular inexistente; foi corrigida para
   `worker_heartbeats`.

## Validações finais

- `mvn -B clean verify`: 4 testes, zero falhas.
- frontend: locale (22 catálogos, 56 arquivos, 86 entradas dinâmicas), typecheck, testes disponíveis
  e build aprovados; Vite manteve apenas warning não bloqueante de chunk acima de 500 kB.
- worker: typecheck, testes disponíveis e build aprovados.
- `scripts/codex/fullstack-e2e.sh`: startup, API smoke, Flyway, heartbeat e Playwright aprovados.
- Screenshot local inspecionável: `/tmp/contabilidade-codex-e2e.png`.

## Resultado

**VERDE** — os quatro processos ficaram saudáveis durante a prova, API e browser smoke passaram,
a suíte local-only permanente foi adicionada, todas as chamadas permaneceram locais e a entrega segue
para PR aberta sem merge.
