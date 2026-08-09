# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- baseline integrada: v0.1;
- pacote candidato: v0.2.0;
- gate serial atual: integração e validação local da v0.2.0;
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
