# ARQUIVADO — SEC-AUT-001

> Não executar novamente. O usuário autorizou a implementação direta antes do fechamento de
> `GATE-VAL-001`.

- **ITEM:** `SEC-AUT-001`
- **STATUS:** `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
- **BASELINE DA IMPLEMENTAÇÃO:** `4b4716d0edac248d35c7a678bdce8c33ee384e13`
- **BRANCH:** `feat/sec-aut-001-anti-replay-session-ticket`
- **MIGRATION:** `V8__interactive_session_ticket_replay.sql`
- **EVIDÊNCIA:** `docs/implementacao/SEC_AUT_001_ANTI_REPLAY_SESSAO.md`

## Resultado implementado

- cada `jti` é consumido atomicamente uma única vez no PostgreSQL;
- intervenção, execução, sessão, operador, status e expiração são revalidados no backend;
- o ticket HMAC aparece somente no primeiro `GET /info`;
- o worker troca o ticket por um grant opaco e mantém no máximo um grant ativo por sessão;
- o grant é entregue em cookie `HttpOnly`, `SameSite=Strict`, com escopo da sessão e `Secure` em HTTPS;
- eventos e comandos não reutilizam o ticket;
- restart do worker remove o grant local, mas não reabilita o `jti` persistido;
- nenhum ticket, grant ou segredo bruto é registrado em logs;
- nenhum bypass ou resolução automática de CAPTCHA foi introduzido.

## Estado de validação

A implementação requer prova runtime manual no ambiente-alvo:

- Flyway V8 aplicada;
- primeira troca com cookie HttpOnly;
- replay respondendo `409 / TICKET_REUTILIZADO`;
- eventos/input funcionando com grant;
- reinício do worker sem reabilitar o ticket;
- logs Nginx sem query string do ticket.

O item não fecha `GATE-VAL-001` e não promove os demais previews.
