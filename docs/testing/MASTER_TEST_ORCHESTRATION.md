# Master Test Orchestration

**Classificação:** `CANONICAL_ACTIVE_TEST_LEDGER`  
**Reconciliado em:** `2026-08-17`  
**HEAD observado:** `a34afbe0c7a7876ea231c3a9a1c913dbe39928ae`

## Hold P0

A seleção de waves funcionais/estruturais comuns está bloqueada por
`CONTABILIDADE_STARTUP_RELIABILITY_GATE_P0_001`. Somente a wave serial de recuperação
`CONTABILIDADE_STARTUP_RECOVERY_WAVE_013` está liberada. A stack oficial Windows/Compose ainda não
completou nem o primeiro startup.

## Evidência válida preservada

| ID | Prova | Disposição |
|---|---|---|
| `FIX-TECH-AUTH-001` | 403 seguro; 401/500 preservados | `REUSE_PASS` |
| `STR-ARCH-BE-005` | 601 arestas, zero findings | `REUSE_PASS_STRUCTURAL` |
| `STR-SEC-003` | lifecycle de segredos sem valores | `REUSE_PASS_STRUCTURAL` |
| `STR-REL-003` | promoção/rollback offline | `REUSE_PASS_STRUCTURAL` |
| `STR-OPS-002` | recovery plan não destrutivo | `REUSE_PASS_STRUCTURAL` |
| `VAL-W011-FULLSTACK-012` | builds, PostgreSQL/Flyway, health, upload, 19 jornadas e a11y em Linux | `REUSE_PASS_PARTIAL_TEST_CONTRACT_DRIFT` |

`VAL-W011-FULLSTACK-012` não provou Nginx `/healthz`, Docker Desktop, BAT/PowerShell, probe lifecycle
ou Compose Windows. Ele não pode ser usado como prova do startup oficial.

## Falha atual do startup

| Etapa | Resultado |
|---|---|
| builds locais | `PASS_USER_EVIDENCE` |
| três imagens runtime criadas | `PASS_USER_EVIDENCE` |
| entrada no startup sequencial | `FAIL` |
| cleanup de probe ausente | `NativeCommandError` |
| serviços Compose iniciados | `NO` |
| `docker compose ps` | vazio após a falha |

Nesta sessão Windows, PowerShell 5.1 está disponível e Docker CLI está ausente do `PATH`. Essa
observação é `ENVIRONMENT_LIMITATION` desta sessão e exige preflight `DOCKER_CLI_UNAVAILABLE`; a
regressão de produto reportada no host do usuário permanece a classificação primária.

### Classificação

```text
PRIMARY: PRODUCT_REGRESSION_IN_STARTUP_SCRIPT
MECHANISM: NATIVE_STDERR_ESCAPES_EXIT_CODE_CLASSIFICATION
EXPECTED_STATE: PROBE_ABSENT_IDEMPOTENT
DISPOSITION: FIX_PRODUCT_AND_ADD_INTEGRATED_TESTS
```

## Lacuna dos testes existentes

Os testes atuais cobrem executor nativo, contexto Docker, DNS, daemon/buildx/Compose e parser. Eles
não cobrem:

- lifecycle de `contabilidade-startup-probe`;
- ausência/stopped/running/race;
- primeiro e segundo startup;
- verificação real de imagens seguida de startup;
- cleanup em sucesso e falha;
- reuso do PostgreSQL;
- Compose dev real no Windows.

Por isso, os guards anteriores puderam ficar verdes enquanto o fluxo oficial permanecia quebrado.

## Matriz P0 obrigatória

| Camada | Executor | Critério |
|---|---|---|
| parser | Windows PowerShell 5.1 | todos `.ps1`/`.psm1` sem erro |
| native process | Windows PowerShell 5.1 | stderr não aborta antes do exit code |
| Pester probe | mocks estruturados | 14 cenários incluindo race/falha real |
| preflight Docker | antes de builds | CLI ausente distinta de daemon indisponível |
| Docker lifecycle | Docker Desktop | absent/stopped/running/concurrent/ownership |
| Compose E2E 1 | projeto efêmero | stack dev ready e probe ausente |
| Compose E2E 2 | mesmo projeto | PostgreSQL/marker preservados |
| official startup 1 | checkout real | `START_CONTABILIDADE.bat dev` exit 0 |
| official startup 2 | checkout real | reuso e idempotência comprovados |
| evidence | coletor v2 | JSON/Markdown redigidos e pinados ao SHA |

## Resultados permitidos

```text
PASS
PRODUCT_REGRESSION
TEST_CONTRACT_DRIFT
ENVIRONMENT_LIMITATION
BASELINE_DRIFT
PROBE_OWNERSHIP_CONFLICT
DOCKER_DAEMON_UNAVAILABLE
```

Ausência de Docker ou PowerShell não autoriza `PASS` estrutural como encerramento do P0.

## Regras de implementação

- todo Docker do startup usa o executor nativo central;
- `No such container` só é benigno em cleanup idempotente;
- daemon indisponível e falha real permanecem vermelhos;
- `finally` não apaga a exception principal;
- nenhum segredo ou `.env` em logs;
- nenhum cleanup global;
- nenhuma alteração de Compose/banco para mascarar o problema;
- nenhuma wave funcional/estrutural comum até a prova final;
- a Wave 013 contém somente o owner de correção + harness; a validação final é posterior ao merge.

## Provas externas ainda pendentes

- backend/Testcontainers;
- on-premise/Keycloak;
- Required CI remoto e branch protection;
- restore e promoção reais;
- providers reais/pagos.

`MASTER_TEST_ORCHESTRATION_STARTUP_RECOVERY_WAVE_013_RELEASED`
