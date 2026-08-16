# STR-DB-001 — resultado

## Identificação

- **ITEM:** `STR-DB-001`
- **Baseline:** `6f9f7a6` (`Merge PR #77: consume Wave 003 and release Maturity Wave 004`)
- **Branch:** `str-db-001-testcontainers-postgresql`
- **Status:** `ENVIRONMENT_LIMITATION`
- **Owner alterado:** dependências de teste do backend, teste de integração PostgreSQL e workflow dedicado.
- **Migration:** nenhuma; `backend/src/main/resources/db/migration/**` permaneceu somente leitura.

## Implementação

- Testcontainers foi adicionado exclusivamente com escopo `test`, nas versões gerenciadas pelo BOM
  do Spring Boot, para provisionar `postgres:17-alpine`. Testcontainers é Apache-2.0; a dependência
  é justificada pela prova PostgreSQL reproduzível e não alcança o runtime de produção.
- `BancoPostgresqlIntegracaoTest` agora cria e encerra o container descartável, compara os scripts
  V1–V12 com o histórico Flyway, rejeita migrations malsucedidas, verifica estruturas V12 e o
  `EntityManagerFactory` iniciado com `ddl-auto=validate`.
- Uma segunda inicialização completa do contexto usa o mesmo banco e comprova que a quantidade de
  migrations aplicadas não muda. Imagem e versão efetiva são registradas sem credenciais.
- Banco externo exige opt-in explícito `CONTABILIDADE_TEST_EXTERNAL_DATABASE=true` e as três
  variáveis de datasource; variáveis ambientes incidentais não desabilitam Testcontainers.
- O workflow dedicado verifica Docker e executa somente a prova PostgreSQL, configurado para falhar
  quando o teste especificado não for encontrado ou quando Docker estiver indisponível.

## Locks preservados

- `LOCK-DB-001`: PostgreSQL continua autoritativo, Flyway continua exclusivo e nenhuma migration
  aplicada foi alterada.
- `LOCK-MIG-001`: nenhuma migration foi criada e nenhum owner de migration foi assumido.
- `LOCK-EXT-001`: o teste não chama provider fiscal externo.
- `LOCK-TEST-001`: a impossibilidade de executar a prova foi classificada como
  `ENVIRONMENT_LIMITATION`; nenhum código de produção foi mudado para mascará-la.

## Validação e resultados

- `cd backend && mvn -B -DskipTests test-compile`: **PASS** (`BUILD SUCCESS`).
- `cd backend && mvn -B dependency:tree -Dscope=test
  '-Dincludes=org.testcontainers:*,org.springframework.boot:spring-boot-testcontainers'`: **PASS**;
  Spring Boot Testcontainers `3.5.16` e Testcontainers `1.21.4`, todos em escopo de teste.
- `docker info`: **ENVIRONMENT_LIMITATION**; o executável `docker` não existe neste executor.
- `cd backend && mvn -B clean verify`: **ENVIRONMENT_LIMITATION**; a execução alcançou a suíte,
  mas não havia daemon Docker. Uma primeira tentativa também encontrou variáveis de datasource
  incidentais do executor; o opt-in explícito foi então introduzido para impedir esse desvio.
- `cd backend && mvn -B -Dtest=BancoPostgresqlIntegracaoTest
  -Dsurefire.failIfNoSpecifiedTests=true test`: **ENVIRONMENT_LIMITATION**; Testcontainers `1.21.4`
  confirmou ausência de `/var/run/docker.sock` e o teste falhou, sem skip silencioso.
- `git diff --check`: **PASS**.

## Limitações e provas pendentes

- A prova runtime de Flyway V1–V12, idempotência, estruturas recentes, JPA e PostgreSQL 17 permanece
  pendente no workflow dedicado ou em executor com Docker. Este ambiente não permite alegar essa
  prova.
- **Commit/PR:** commit local desta entrega; PR depende de integração GitHub/remoto disponibilizada
  ao executor.
