# Roadmap do produto

## Checkpoint

- baseline integrada: `0.5.1`;
- análise canônica: `docs/analise/ANALISE_COMPLETA_BASELINE_V050.md`;
- evidência runtime cloud: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- PR `#9` integrou a correção de tipagem do PDF.js e comprovou lockfiles, frontend e worker no Codex Cloud;
- classificação atual do gate: `VALIDACAO_CLOUD_PARCIAL_WINDOWS_PENDENTE`;
- Maven, Docker, PostgreSQL/Flyway, Keycloak, endpoints e interface ainda exigem prova no Windows;
- a próxima onda permanece condicionada à validação local verde.

## Gate imediato

1. atualizar `main` no workspace Windows;
2. confirmar JDK 21, Node 22.12+ e Docker Desktop;
3. executar `START_CONTABILIDADE.bat dev`;
4. executar `scripts/validate-database-state.bat dev`;
5. confirmar `postgres` saudável e `postgres-bootstrap` finalizado com código `0`;
6. confirmar Keycloak/Liquibase e Flyway V1–V7;
7. validar endpoints técnicos e smoke da interface;
8. validar parser com PDF sintético local, sem documento fiscal real;
9. anexar a evidência Windows ao relatório runtime;
10. reconciliar o gate e promover os cinco previews somente após classificação `VERDE`.

## Onda candidata após gate verde

- anti-replay da sessão interativa;
- escalabilidade das consultas de certidões;
- backup verificável;
- observabilidade de heartbeat do worker;
- integridade de documentos no download.

Nenhum provider externo deve ser acionado durante o gate ou durante essas implementações.
