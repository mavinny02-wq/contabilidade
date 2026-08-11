# Roadmap do produto

## Checkpoint

- baseline integrada: `0.5.1`;
- análise canônica: `docs/analise/ANALISE_COMPLETA_BASELINE_V050.md`;
- validação Cloud canônica: `docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md`;
- validação runtime histórica/parcial: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- PR `#12` comprovou frontend, worker, startup controlado e extração de PDF sintético no Codex Cloud;
- Compose, Dockerfiles, scripts e migrations V1–V7 foram revisados estaticamente no Cloud;
- classificação Cloud atual: `CLOUD_AMARELO`;
- Maven permaneceu bloqueado por HTTP 403 do registry no Cloud;
- `SEC-AUT-001` foi implementado por autorização direta e aguarda prova runtime com a migration V8;
- Docker, PostgreSQL/Flyway, Keycloak/Liquibase, endpoints e interface ainda exigem prova no ambiente-alvo;
- a próxima onda permanece condicionada à validação runtime local verde.

## Implementação antecipada

`SEC-AUT-001` não faz mais parte da onda candidata. A solução integrada na branch de implementação:

- consome o `jti` uma única vez no PostgreSQL;
- revalida intervenção, execução, sessão, operador, estado e expiração;
- usa `V8__interactive_session_ticket_replay.sql`;
- entrega o ticket somente no primeiro `GET /info`;
- troca o ticket por um único grant ativo por sessão em cookie HttpOnly;
- mantém o replay bloqueado após restart do worker;
- não resolve ou contorna CAPTCHA.

O item permanece `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME` e não fecha o gate.

## Gate imediato — execução humana local

1. atualizar `main` no workspace Windows;
2. confirmar JDK 21, Node 22.12+ e Docker Desktop;
3. executar `mvn -B clean verify` em ambiente com acesso funcional ao repositório Maven;
4. executar `START_CONTABILIDADE.bat dev`;
5. confirmar as três imagens artifact-only reais;
6. executar `scripts/validate-database-state.bat dev`;
7. confirmar `postgres` saudável e `postgres-bootstrap` finalizado com código `0`;
8. confirmar Keycloak/Liquibase e Flyway V1–V8;
9. validar endpoints técnicos, proxies e smoke da interface;
10. validar troca do ticket, replay 409, cookie HttpOnly e restart do worker;
11. anexar a evidência local ao relatório runtime;
12. executar uma task Cloud apenas para reconciliar o commit de evidência;
13. promover os quatro previews remanescentes e selecionar uma quinta vaga somente após classificação `VERDE`.

Não criar outra task Codex com executor Windows: o usuário executa a prova local, e o Codex Cloud
reconcilia o resultado posteriormente.

A extração com PDF sintético já foi comprovada no Linux Cloud. A prova pendente relacionada ao worker
é a execução da imagem artifact-only construída pelo BAT no Docker real, não a repetição formal do
mesmo PDF no Windows.

## Candidatos remanescentes após gate verde

- escalabilidade das consultas de certidões;
- backup verificável;
- observabilidade de heartbeat do worker;
- integridade de documentos no download;
- uma quinta vaga ainda a selecionar.

Nenhum provider externo deve ser acionado durante o gate ou durante essas implementações.
