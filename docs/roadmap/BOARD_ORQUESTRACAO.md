# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- baseline requerida: `0.4.0`;
- pacote candidato: `0.5.0`;
- gate serial: integração, build e prova autorizada do provider Serpro;
- onda oficial seguinte: não selecionada;
- testes permanentes: task separada.

## Regras

- exatamente cinco slots oficiais;
- mesmo commit base;
- sem dependência na mesma onda;
- sem overlap crítico;
- migration exclusiva por slot;
- reconciliação serial;
- extras urgentes fora dos cinco;
- sem sucessor automático.

## Provas gerais pendentes

- `MAVEN_REAL_PENDING`;
- `NPM_LOCKFILES_PENDING`;
- `FRONTEND_REAL_BUILD_PENDING`;
- `WORKER_REAL_BUILD_PENDING`;
- `DOCKER_COMPOSE_PENDING`;
- `POSTGRESQL_FLYWAY_PENDING`;
- `KEYCLOAK_RUNTIME_PENDING`;
- `BACKEND_TESTES_PENDENTES`;
- `CONCORRENCIA_RETEST_REQUIRED`;
- `PLAYWRIGHT_TESTES_PENDENTES`;
- `E2E_PENDENTE`;
- `BACKUP_RESTORE_PENDENTE`.

## Provas específicas Serpro

- `SERPRO_CONTRACT_AND_CREDENTIALS_PENDING`;
- `SERPRO_TOKEN_RUNTIME_PENDING`;
- `SERPRO_CND_RUNTIME_PENDING`;
- `SERPRO_CPEND_RUNTIME_PENDING`;
- `SERPRO_STATUS7_RUNTIME_PENDING`;
- `SERPRO_REAL_PDF_SAMPLE_PENDING`;
- `SERPRO_BILLING_RECONCILIATION_PENDING`;
- `SERPRO_401_REFRESH_RUNTIME_PENDING`.

## Provas dos portais assistidos ainda abertas

- `FEDERAL_PORTAL_RUNTIME_PENDING`;
- `SEFAZ_SP_PORTAL_RUNTIME_PENDING`;
- `PGE_SP_PORTAL_RUNTIME_PENDING`;
- `INTERACTIVE_SESSION_SECURITY_REVIEW_PENDING`;
- `PLAYWRIGHT_E2E_PENDING`.
