# STR-QA-BE-001 — resultado

- **ITEM:** `STR-QA-BE-001`
- **WAVE_ID:** `CONTABILIDADE_FAST_LANE_WAVE_008`
- **CONTRACT:** `2.0`
- **DISPATCH_KEY:** `620e49f09111d07764735c3161b8326c0d94639092a13fa93f6a40d4129bef85`
- **Baseline do launcher:** `77141fae2f04a430bc2cb51264886c083977a3ce`
- **Baseline do checkout:** `c5f414061161eaf0e131cf8ceea64cf73f95e32c`
- **Status:** `BLOCKED_ENVIRONMENT_LIMITATION`

## Owner alterado

- `backend/src/test/java/br/com/contabilidade/common/execution/**`;
- este resultado exato.

Produção, `pom.xml`, migrations e baseline global de coverage permaneceram sem alteração.

## Entrega

Foi criada uma suíte focada que usa PostgreSQL 17 real via Testcontainers, apenas dados sintéticos,
timeout global e barreiras concorrentes limitadas. Ela cobre:

- idempotência de criação e conflito semântico da chave;
- aquisição simultânea sem dupla entrega;
- prioridade, desempate temporal e progresso por `skip locked` sob lock real;
- rejeição de token ausente/divergente e lease expirado em renovação/conclusão;
- recuperação de lease com retry abaixo do limite, falha no limite e limpeza do ownership;
- máximo de tentativas, backoff, custo acumulado e imutabilidade da moeda;
- idempotência persistente do fallback terminal.

O suporte de fallback é sintético e limitado à suíte; locking, concorrência, transações e
persistência não foram substituídos por mocks.

## Locks preservados

- `LOCK-DB-001`: a prova aponta para PostgreSQL real e não altera Flyway/migrations;
- `LOCK-DATA-001`: chaves, payloads, workers e provider são integralmente sintéticos;
- `LOCK-EVID-001`: o rerun solicitado está restrito à nova suíte crítica;
- `LOCK-TEST-001`: produção não foi modificada sem classificação e prova runtime.

## Comandos e resultados

| Comando | Resultado |
| --- | --- |
| `python3 scripts/orchestration/dispatch_guard.py --wave CONTABILIDADE_FAST_LANE_WAVE_008 --item STR-QA-BE-001 --baseline 77141fae2f04a430bc2cb51264886c083977a3ce --key 620e49f09111d07764735c3161b8326c0d94639092a13fa93f6a40d4129bef85 --github-aware --register` | `DISPATCH_ALLOWED`; auditoria GitHub indisponível porque `GITHUB_REPOSITORY`/`GITHUB_TOKEN` não existem no ambiente. |
| `java -version` | PASS: OpenJDK `21.0.2`. |
| `docker version --format '{{.Server.Version}}'` | `ENVIRONMENT_LIMITATION`: executável `docker` ausente. |
| `cd backend && mvn -B -DskipTests test-compile` | PASS (`BUILD SUCCESS`). |
| `cd backend && mvn -B -Dtest=ExecucaoFilaPostgresqlTest test` (execução 1) | `ENVIRONMENT_LIMITATION`: `BUILD FAILURE`, Testcontainers não encontrou ambiente Docker válido. |
| `cd backend && mvn -B -Dtest=ExecucaoFilaPostgresqlTest test` (execução 2) | `ENVIRONMENT_LIMITATION`: falha reproduzida; Testcontainers não encontrou ambiente Docker válido. |
| `git diff --check` | PASS. |

## Limitações e provas pendentes

O container não possui cliente/runtime Docker; por isso não é possível iniciar o PostgreSQL do
Testcontainers. A suíte foi compilada, mas não há alegação de prova runtime, concorrência,
persistência ou duas execuções verdes. A classificação é `ENVIRONMENT_LIMITATION`, e não
`PRODUCT_REGRESSION`, pois o contrato exige observar a falha na execução autorizada antes de mudar
produção ou abrir successor corretivo.

Prova pendente em executor com Java 21 e Docker disponível:

```bash
cd backend
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
mvn -B -Dtest=ExecucaoFilaPostgresqlTest test
```

## Commit e PR

- **Commit:** registrado no histórico Git desta branch.
- **PR:** criação pendente da disponibilidade de remote/GitHub no ambiente.
