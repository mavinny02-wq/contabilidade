# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- baseline requerida: v0.3.0;
- pacote candidato: v0.4.0;
- gate serial atual: integração, build e prova autorizada dos portais estaduais de São Paulo;
- onda oficial seguinte: não selecionada;
- testes: task separada.

## Regras

- exatamente cinco slots oficiais;
- mesmo commit base;
- sem dependência na mesma onda;
- sem overlap crítico;
- migration exclusiva por slot;
- reconciliação serial;
- extras urgentes fora dos cinco;
- sem sucessor automático.

## Provas pendentes

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

## Provas específicas das versões 0.3.0 e 0.4.0

- `FEDERAL_PORTAL_RUNTIME_PENDING`;
- `FEDERAL_CAPTCHA_RUNTIME_PENDING`;
- `FEDERAL_CND_PDF_SAMPLE_PENDING`;
- `FEDERAL_CPEND_PDF_SAMPLE_PENDING`;
- `INTERACTIVE_SESSION_SECURITY_REVIEW_PENDING`;
- `PLAYWRIGHT_E2E_PENDING`.

- `SEFAZ_SP_PORTAL_RUNTIME_PENDING`;
- `SEFAZ_SP_CAPTCHA_RUNTIME_PENDING`;
- `SEFAZ_SP_PDF_SAMPLE_PENDING`;
- `PGE_SP_PORTAL_RUNTIME_PENDING`;
- `PGE_SP_CAPTCHA_RUNTIME_PENDING`;
- `PGE_SP_PDF_SAMPLE_PENDING`;
- `PGE_SP_CPEN_ADMINISTRATIVE_FLOW_PENDING`.
