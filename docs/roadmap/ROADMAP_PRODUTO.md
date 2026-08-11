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
- Docker, PostgreSQL/Flyway, Keycloak/Liquibase, endpoints e interface ainda exigem prova no ambiente-alvo;
- a próxima onda permanece condicionada à validação runtime local verde.

## Gate imediato

1. atualizar `main` no workspace Windows;
2. confirmar JDK 21, Node 22.12+ e Docker Desktop;
3. executar `mvn -B clean verify` em ambiente com acesso funcional ao repositório Maven;
4. executar `START_CONTABILIDADE.bat dev`;
5. confirmar as três imagens artifact-only reais;
6. executar `scripts/validate-database-state.bat dev`;
7. confirmar `postgres` saudável e `postgres-bootstrap` finalizado com código `0`;
8. confirmar Keycloak/Liquibase e Flyway V1–V7;
9. validar endpoints técnicos, proxies e smoke da interface;
10. anexar a evidência local ao relatório runtime;
11. reconciliar o gate e promover os cinco previews somente após classificação `VERDE`.

A extração com PDF sintético já foi comprovada no Linux Cloud. A prova pendente relacionada ao worker
é a execução da imagem artifact-only construída pelo BAT no Docker real, não a repetição formal do
mesmo PDF no Windows.

## Onda candidata após gate verde

- anti-replay da sessão interativa;
- escalabilidade das consultas de certidões;
- backup verificável;
- observabilidade de heartbeat do worker;
- integridade de documentos no download.

Nenhum provider externo deve ser acionado durante o gate ou durante essas implementações.
