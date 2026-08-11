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
2. o worker valida assinatura, payload, UUIDs, sessão e expiração;
3. o worker envia somente os claims ao endpoint interno autenticado;
4. o backend bloqueia a intervenção e valida sessão, intervenção, execução, operador, estado e prazo;
5. a migration V8 registra o `jti` com chave primária;
6. `INSERT ... ON CONFLICT DO NOTHING` garante consumo atômico e detecta replay;
7. o worker gera um grant aleatório de 256 bits e guarda apenas seu SHA-256 em memória;
8. o grant é entregue em cookie `HttpOnly`, `SameSite=Strict`, restrito ao caminho da sessão e com
   `Secure` quando o proxy informa HTTPS;
9. `eventsUrl` e `inputUrl` não carregam mais o ticket;
10. registros expirados do ledger são removidos oportunisticamente no próximo consumo.

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
- `automation-worker/src/index.ts`.

## Comportamento preservado

- HMAC-SHA256 e segredo existente;
- expiração máxima do ticket;
- vínculo com sessão, intervenção, execução e operador;
- fluxo `GET info` → SSE → comandos interativos;
- frontend sem alteração;
- nenhum bypass ou resolução automática de CAPTCHA;
- nenhum ticket, grant ou segredo em logs;
- retomada da automação e lease existentes.

## Concorrência e reinício

O consumo fica no PostgreSQL, portanto duas tentativas concorrentes ou workers distintos não podem
consumir o mesmo `jti`. Reiniciar o worker remove grants locais, mas não reabilita o ticket já
consumido. O operador deve solicitar um ticket novo ao reabrir a sessão.

## Validações necessárias

### Codex Cloud

- compilação/typecheck do worker;
- revisão estática Java/SQL;
- confirmação de que o ticket aparece apenas em `infoUrl`;
- confirmação de que uma resposta `409` do backend vira `TICKET_REUTILIZADO`;
- `git diff --check`.

### Runtime local manual

- Flyway aplica V8;
- primeira chamada de `infoUrl` responde 200 e define cookie HttpOnly;
- segunda chamada com o mesmo ticket e sem cookie responde `TICKET_REUTILIZADO`;
- `eventsUrl` e `inputUrl` funcionam apenas com o grant;
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
