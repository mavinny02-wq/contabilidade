# Validação Codex Cloud — backend e banco — v0.5.1

## Identificação

- Item: `VAL-CLOUD-BE-DB-V051-001` (slot 1/5).
- Versão confirmada em `VERSION`: `0.5.1`.
- Branch: `validation/cloud-backend-db-v051`.
- SHA inicial (`main`/`origin/main`): `d960da56991c4819564e3f1661ff95a4176a1b53`.
- SHA final da implementação validada, anterior somente a este registro de evidência:
  `468c13d732cfdd2cfc3146714235000e8b124b15`.
- Executor: Codex Cloud Linux, banco dedicado `contabilidade_codex_backend` em
  `127.0.0.1` e usuário `contabilidade`.

## Preparação e ferramentas

`contabilidade-maintenance` não estava instalado no ambiente e terminou com código `127`. O
comando `contabilidade-prepare backend database` terminou com código `0`, instalou/inicializou o
PostgreSQL e preparou as dependências. A criação do banco pelo usuário da aplicação inicialmente
falhou com código `1` porque esse papel, corretamente, não possui `CREATEDB`; depois das verificações
de host, usuário, nome e ambiente, o banco dedicado foi criado pelo administrador local e recebeu
como proprietário o papel `contabilidade`. O banco padrão `contabilidade` não foi removido.

Versões usadas na validação:

- OpenJDK e `javac`: `21.0.11` (Ubuntu);
- Maven efetivamente selecionado pelo shell: `3.9.10`;
- PostgreSQL/`psql`: `16.14`;
- Maven settings: padrão (`DEFAULT_MAVEN_SETTINGS`), sem mirror ou proxy específico do projeto e
  sem registrar valores sensíveis.

O prepare anunciou Maven `3.9.16`, mas o `PATH` não interativo manteve o Maven `3.9.10`; ambos são
compatíveis com o projeto e a versão efetivamente usada acima está registrada para
reprodutibilidade.

## Teste permanente acrescentado

Foi acrescentado `BancoPostgresqlIntegracaoTest`, um teste Spring/JUnit que:

1. sobe o contexto web local com segurança desabilitada apenas pela configuração local prevista;
2. deixa o Flyway aplicar as migrações no PostgreSQL real preparado para a task;
3. compara os scripts SQL disponíveis no classpath com as linhas bem-sucedidas do histórico;
4. exige zero migração com `success = false`;
5. comprova a tabela e os dois índices introduzidos pela V12;
6. comprova que a `EntityManagerFactory` ficou aberta após o `ddl-auto=validate`.

O teste usa apenas o PostgreSQL local, não usa Docker/Testcontainers e não chama a rede externa.
Na primeira execução do novo teste, `WebEnvironment.NONE` reproduziu uma falha do próprio arranjo
de teste: sem stack servlet não existe `HttpSecurity` para `SecurityConfig`. A correção mínima foi
usar `WebEnvironment.MOCK`, que carrega o contrato web real sem abrir porta. Nenhum código de
produção ou regra de autorização foi alterado.

## Comandos e resultados

| Comando/validação | Código | Resultado |
| --- | ---: | --- |
| `contabilidade-maintenance` | 127 | ferramenta ausente no executor |
| `contabilidade-prepare backend database` | 0 | ambiente preparado |
| `java -version`, `javac -version`, `mvn --version`, `psql --version` | 0 | versões registradas acima |
| criação inicial com `createdb` como papel da aplicação | 1 | ausência esperada de privilégio `CREATEDB` |
| recriação segura via administrador local, com owner `contabilidade` | 0 | banco dedicado vazio criado |
| primeira execução do novo teste com contexto não web | 1 | defeito no arranjo do teste identificado e corrigido |
| `mvn -B clean verify` em banco recriado e vazio | 0 | 1 teste, 0 falhas, 0 erros; build bem-sucedido |
| `mvn -B -DskipTests package` | 0 | JAR executável gerado |
| primeira inicialização do JAR e duas sondas | 0 | liveness `200`, readiness `200`, ambas `UP` |
| segunda inicialização do mesmo JAR e duas sondas | 0 | liveness `200`, readiness `200`, ambas `UP` |
| consulta de histórico e estruturas com `psql` | 0 | 12/12 migrações, zero falhas e estruturas V12 presentes |
| `git diff --check` | 0 | nenhuma inconsistência de whitespace |

As execuções Maven receberam explicitamente o datasource local dedicado e o perfil `local`. As
inicializações também receberam `APP_ENVIRONMENT=CODEX_CLOUD` e os valores locais obrigatórios para
worker e assinatura de sessão; os valores não são reproduzidos neste relatório.

## Flyway, schema e idempotência

Partindo de schema vazio, foram aplicados com sucesso, em ordem:

1. `V1__baseline_common.sql`;
2. `V2__seed_provedores.sql`;
3. `V3__common_operacional.sql`;
4. `V4__centro_certidoes.sql`;
5. `V5__portal_federal_assistido.sql`;
6. `V6__portais_estaduais_sp.sql`;
7. `V7__serpro_consulta_cnd.sql`;
8. `V8__interactive_session_ticket_replay.sql`;
9. `V9__empresa_grupos_tags.sql`;
10. `V10__empresa_responsaveis_modulo.sql`;
11. `V11__faturas_provedor.sql`;
12. `V12__worker_heartbeat_historico.sql`.

O histórico retornou 12 linhas SQL com `success = true` e contagem zero para `success = false`.
Foram encontrados `worker_heartbeat_historico`,
`idx_worker_heartbeat_historico_worker_data` e `idx_worker_heartbeat_historico_data`. O startup
concluiu depois da validação Hibernate, portanto `ddl-auto=validate` passou.

Nas duas inicializações empacotadas, o Flyway registrou versão atual `12` e informou que o schema
estava atualizado, sem migração necessária. Isso comprova a idempotência e que nenhuma migração foi
reaplicada.

## Segurança, escopo e comportamento preservado

- Nenhum provider externo foi chamado e nenhum dado fiscal, CNPJ real, certificado ou credencial
  real foi usado.
- Não houve `flyway repair`, alteração de migração existente, relaxamento de autorização nem
  alteração de código de produção.
- Frontend, worker, scripts de inicialização e arquivos de orquestração permaneceram intactos.
- O teste mantém distintos os papéis de Flyway (schema), Hibernate (validação) e PostgreSQL (fonte
  autoritativa).

## Pendências e classificação

Não restou defeito determinístico de backend ou banco. A indisponibilidade de
`contabilidade-maintenance` é uma limitação da imagem, mas não impediu preparação, compilação,
teste, migração ou startup. O executor também não forneceu autenticação GitHub: o `git push`
terminou com código `128` (`could not read Username`) e `gh auth status` confirmou que não há sessão
autenticada. Consequentemente, a publicação da branch e a abertura do PR ficaram bloqueadas pelo
ambiente, embora os commits locais estejam prontos.

**Classificação final: `BLOQUEADO_POR_AMBIENTE`.** A validação técnica seria `VERDE`; falta somente
a publicação/autenticação exigida para satisfazer o aceite de PR aberto e não mesclado.
