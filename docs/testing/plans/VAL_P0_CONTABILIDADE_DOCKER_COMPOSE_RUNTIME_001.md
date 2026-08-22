# VAL-P0-CONTABILIDADE-DOCKER-COMPOSE-RUNTIME-001

**Classificação:** `CANONICAL_RELEASED_VALIDATION_SHARD`
**Status:** `RELEASED_FOR_EXECUTION`
**Baseline mínimo:** `codex/bootstrap-deepseek-runner@4098068daa809b547944e9d47f010000356da7e8`
**Owner:** `DOCKER_COMPOSE_CLOUD_RUNTIME_VALIDATION_SERIAL`
**Limite:** `CODEX100-ON`, no máximo uma hora, zero LLM externo

## Objetivo

Validar em um host Cloud com Docker Engine e Docker Compose v2 o runtime de desenvolvimento do
Contabilidade. A mesma stack deve iniciar duas vezes, sem cleanup entre as tentativas, permanecer
saudável e reutilizar PostgreSQL. A prova Cloud não substitui a prova Windows/Docker Desktop exigida
por `LOCK-STARTUP-001`.

## Contexto HOT

Leia somente:

1. `AGENTS.md` e `docs/testing/AGENTS.md`;
2. este shard;
3. `docs/orquestracao/STARTUP_RELIABILITY_GATE.md`;
4. `LOCK-STARTUP-001`, `LOCK-ENV-001`, `LOCK-DATA-001`, `LOCK-EXT-001`, `LOCK-EVID-001`,
   `LOCK-TEST-001` e `LOCK-GIT-001` em `docs/decisoes/CONTABILIDADE_LOCKS_OPERACIONAIS.md`.

Não leia board, histórico, roadmap amplo ou resultados antigos sem um blocker source-proven.

## Boundary e segurança

- O owner executável é validação runtime/evidência; produção, scripts, testes, Compose, migrations e
  dependências ficam read-only.
- Use somente o checkout limpo do baseline ou descendente revisado no mesmo branch; registre o SHA
  exato antes de executar.
- Não instale Docker, Compose, PowerShell, Pester, NuGet ou dependência global. Falta de requisito é
  `ENVIRONMENT_LIMITATION`.
- São proibidos `prune`, `docker compose down -v`, `down --volumes`, reset, remoção de volumes,
  cleanup global, troca automática de contexto Docker e exclusão de dados.
- Não faça deploy externo, pull de imagem privada, chamada de provider fiscal, E2E externo ou
  operação em repositório PRIMA/cliente.
- Não leia, imprima, copie ou versione segredos, `.env`, tokens, certificados, payload fiscal ou
  PII. Evidência contém somente metadados redigidos.
- Pare cedo quando a stack estiver comprovadamente saudável ou quando houver blocker. Nunca exceda
  uma hora.

## Execução e gates

1. Preflight read-only: confirme SHA/branch limpos, PowerShell disponível, Docker CLI/daemon,
   Compose v2, contexto ativo preservado, arquivos Compose válidos e as três imagens runtime.
2. Rode parser/guards e testes estruturais focados de startup/Docker. Falha estrutural bloqueia o
   runtime e não autoriza mudança de produção.
3. Execute `scripts/start-compose-sequential.ps1 -Mode dev -NoExit` com o PowerShell disponível no
   host, usando o ambiente Cloud já provisionado. Não crie outro contrato Compose.
4. Comprove estado `healthy` e HTTP 200 reais para backend liveness/readiness, worker `/health`,
   frontend `/healthz` e proxy `/api/info`; confirme Flyway V12, Keycloak/bootstrap ausentes em dev
   e probe final ausente.
5. Registre IDs do container e volume PostgreSQL. Repita exatamente o passo 3 sem stop/down/reset e
   repita todos os checks do passo 4.
6. A segunda inicialização só passa se PostgreSQL/volume forem reutilizados, todos os healthchecks
   permanecerem verdes, não houver probe órfão e os comandos tiverem exit code zero.
7. Deixe a stack saudável em execução; não faça cleanup destrutivo. Registre versões, contexto,
   SHA, durações, exit codes, IDs redigidos e paths de logs no RESULT.

## Falhas e regressão

Classifique cada falha como `PRODUCT_REGRESSION`, `TEST_CONTRACT_DRIFT`, `DATA_OR_FIXTURE_DEFECT`,
`ENVIRONMENT_LIMITATION` ou `BASELINE_DRIFT`. Esta campanha não corrige produção. Cada bug real gera
um successor bounded com teste de regressão direto; somente depois da correção integrada é permitido
rerodar o gate afetado. Nunca mude produto para fazer evidência antiga passar.

## Resultado e status honestos

O único owner persistente desta execução é
`docs/implementacao/VAL_P0_CONTABILIDADE_DOCKER_COMPOSE_RUNTIME_001_RESULT.md`. Use apenas:

- `PASS_CLOUD_RUNTIME_WINDOWS_PENDING`: ambas as inicializações e todos os checks Cloud passaram;
- `ENVIRONMENT_LIMITATION`: requisito do host ausente ou runtime inacessível;
- `FAIL_PRODUCT_REGRESSION` ou `FAIL_TEST_CONTRACT_DRIFT`: falha classificada com evidência;
- `BLOCKED`: autoridade adicional indispensável.

O host que liberou este launcher não possui Docker CLI; portanto, este documento não reivindica
startup, health, readiness, idempotência ou deploy executados.
