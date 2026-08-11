# SEC-AUT-001 — Anti-replay de tickets da sessão interativa

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`

Implementação autorizada diretamente pelo usuário enquanto `GATE-VAL-001` permanece aberto. O item
não fecha o gate e não promove os demais previews.

## Problema

O backend emitia um ticket HMAC com `jti`, mas o worker apenas validava assinatura e expiração. O
mesmo ticket aparecia nas URLs de `info`, `events` e `input` e podia ser reutilizado até expirar.

## Solução

O ticket passou a funcionar como credencial de troca de uso único:

1. o backend coloca o ticket somente em `infoUrl`;
2. o worker aceita troca de ticket somente em `GET /info`;
3. o worker valida tamanho, Base64URL, assinatura, payload, UUIDs, sessão e expiração;
4. o worker envia somente os claims ao endpoint interno autenticado;
5. o backend bloqueia a intervenção e valida sessão, intervenção, execução, operador, estado e prazo;
6. a migration V8 registra o `jti` com chave primária;
7. `INSERT ... ON CONFLICT DO NOTHING` garante consumo atômico e detecta replay;
8. o worker gera um grant aleatório de 256 bits e guarda apenas seu SHA-256 em memória;
9. existe no máximo um grant ativo por sessão; uma nova troca revoga o anterior;
10. o grant é entregue em cookie `HttpOnly`, `SameSite=Strict`, restrito ao caminho da sessão e com
    `Secure` quando o proxy informa HTTPS;
11. `eventsUrl` e `inputUrl` não carregam mais o ticket;
12. registros expirados do ledger são removidos oportunisticamente no próximo consumo.

## Arquivos de produção

- `backend/src/main/java/br/com/contabilidade/common/intervention/SessaoInterativaTicketService.java`;
- `backend/src/main/java/br/com/contabilidade/common/intervention/SessaoInterativaTicketConsumoController.java`;
- `backend/src/main/java/br/com/contabilidade/common/intervention/SessaoInterativaTicketConsumoService.java`;
- `backend/src/main/java/br/com/contabilidade/common/intervention/SolicitacaoIntervencaoRepository.java`;
- `backend/src/main/resources/db/migration/V8__interactive_session_ticket_replay.sql`;
- `backend/src/main/resources/messages_pt_BR.properties`;
- `automation-worker/src/BackendClient.ts`;
- `automation-worker/src/SessionTicket.ts`;
- `automation-worker/src/server.ts`;
- `automation-worker/src/index.ts`;
- `scripts/validate-database-state.bat`.

## Comportamento preservado

- HMAC-SHA256 e segredo existente;
- expiração máxima do ticket;
- vínculo com sessão, intervenção, execução e operador;
- fluxo `GET info` → SSE → comandos interativos;
- frontend sem alteração;
- nenhum bypass ou resolução automática de CAPTCHA;
- nenhum ticket, grant ou segredo em logs;
- retomada da automação e lease existentes.

## Concorrência, rotação e reinício

O consumo fica no PostgreSQL, portanto duas tentativas concorrentes ou workers distintos não podem
consumir o mesmo `jti`. Um novo ticket válido rotaciona o grant ativo da sessão. Reiniciar o worker
remove grants locais, mas não reabilita o ticket já consumido. O operador deve solicitar um ticket
novo ao reabrir a sessão.

## Validações realizadas durante a implementação

- compilação isolada de `SessionTicket.ts` com TypeScript strict/ES2022: verde;
- compilação sintática isolada dos novos serviços/controller/repository Java 21 com contratos stub:
  verde;
- revisão da V8, chaves estrangeiras, índices e `ON CONFLICT`: verde;
- revisão do fluxo do frontend existente: `fetch(infoUrl)` ocorre antes do `EventSource`, permitindo
  a troca por cookie sem mudança de JSX;
- revisão de segurança: ticket somente em info, grant bruto não persistido, um grant por sessão e
  replay explícito como HTTP 409.

Essas provas não substituem os builds completos Maven/npm nem o runtime Docker do ambiente-alvo.

## Validações ainda necessárias

### Build completo

- backend Maven Java 21;
- typecheck/build do worker com o lockfile real;
- build frontend sem regressão;
- `git diff --check`.

### Runtime local manual

- Flyway aplica V8 e `validate-database-state.bat` confirma V1–V8;
- primeira chamada de `infoUrl` responde 200 e define cookie HttpOnly;
- ticket enviado em `events` ou `input` é recusado;
- segunda chamada com o mesmo ticket e sem grant responde `409 / TICKET_REUTILIZADO`;
- `eventsUrl` e `inputUrl` funcionam apenas com o grant;
- nova troca revoga o grant anterior da mesma sessão;
- reinício do worker invalida o grant, mas o mesmo ticket continua bloqueado pelo PostgreSQL;
- HTTPS adiciona `Secure`; HTTP local não adiciona;
- nenhum query string com ticket aparece no access log Nginx.

## Fora de escopo

- mudanças de frontend;
- CAPTCHA real;
- providers fiscais;
- múltiplos workers com roteamento da mesma sessão Playwright;
- testes automatizados permanentes nesta task de implementação;
- fechamento de `GATE-VAL-001`.
