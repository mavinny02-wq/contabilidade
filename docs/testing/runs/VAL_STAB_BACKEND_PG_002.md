# VAL-STAB-BACKEND-PG-002 — validação do backend com PostgreSQL

## Identificação

- **Task:** `VAL-STAB-BACKEND-PG-002`.
- **Preparação:** `backend-postgresql`.
- **Baseline disponível:** commit `4c07f16a8a66abb76983c9203c8e694c748f0af0` na branch
  `work`. O repositório não possui branch `main` nem remoto configurado, portanto não foi possível
  atualizar ou comparar esse commit com uma referência `main` mais recente.
- **Data da execução (UTC):** 2026-08-16.
- **Escopo:** `backend/**` somente leitura; apenas este registro de resultado foi criado.
- **Migração de código ou schema:** nenhuma. As migrações Flyway existentes foram apenas aplicadas
  ao banco sintético descartável.
- **Locks declarados:** `LOCK-EXT-001`, `LOCK-DATA-001`, `LOCK-TEST-001`, `LOCK-EVID-001`.

## Arquivos lidos

- `AGENTS.md`.
- `backend/AGENTS.md`: ausente no baseline disponível.
- `docs/testing/plans/VAL_STAB_BACKEND_PG_002.md`: ausente no baseline disponível.
- `backend/pom.xml`.
- `backend/src/main/resources/application.yml`.
- `backend/src/main/resources/application-local.yml`.
- `backend/src/test/java/br/com/contabilidade/infraestrutura/BancoPostgresqlIntegracaoTest.java`.
- `docs/testing/runs/VAL_STAB_BACKEND_001.md`, consultado como histórico da execução anterior.

## Ambiente sintético

- PostgreSQL `16.14` provisionado localmente em `127.0.0.1:5432`.
- Role descartável `contabilidade`, sem dados reais.
- Banco descartável `contabilidade`, selecionado pela variável já presente no ambiente
  `SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/contabilidade`.
- Credenciais usadas: valores sintéticos locais esperados pelo backend; nenhum segredo ou payload
  fiscal foi registrado.

Durante a preparação, um primeiro banco foi criado com o nome padrão interno do teste,
`contabilidade_codex_backend`. A primeira tentativa confirmou que a variável de ambiente herdada
tem precedência e selecionava `contabilidade`; ela terminou antes da execução da asserção de
integração porque esse banco ainda não existia. O provisionamento foi então alinhado ao ambiente e
o comando completo foi repetido. Somente a repetição bem-sucedida abaixo constitui o resultado
definitivo.

## Validação executada

```bash
cd backend && mvn -B clean verify
```

## Resultado definitivo

- **Estado:** aprovado.
- **Código de saída:** `0`.
- **Build:** `BUILD SUCCESS`.
- **Total de testes:** `5`.
- **Falhas:** `0`.
- **Erros:** `0`.
- **Ignorados:** `0`.
- **Tempo informado pelo Maven:** `28.773 s`.
- O teste `BancoPostgresqlIntegracaoTest` iniciou o contexto Spring com o perfil `local`, conectou
  ao PostgreSQL sintético e foi aprovado.
- O Flyway validou e aplicou com sucesso as 12 migrações existentes, de `V1` a `V12`, sobre schema
  vazio, encerrando na versão `v12`.
- A validação JPA/Hibernate concluiu a inicialização do `EntityManagerFactory` contra PostgreSQL
  `16.14`.
- O artefato executável `target/contabilidade-backend.jar` foi empacotado com sucesso como saída
  ignorada do build.

## Avisos observados

- A JVM informou que o Mockito fez carregamento dinâmico do agente Byte Buddy e que esse mecanismo
  deixará de ser permitido por padrão em uma versão futura do JDK. O aviso não afetou o resultado
  dos testes.
- A ausência do plano solicitado e de `backend/AGENTS.md` limita a confirmação de critérios
  adicionais que poderiam estar definidos nesses arquivos, mas não impediu a execução literal da
  validação informada na task.

## Comportamento preservado

- Nenhum arquivo em `backend/**` foi alterado.
- Nenhuma migração foi criada, editada ou removida.
- Nenhum dado real foi utilizado.
- A distinção entre indisponibilidade de infraestrutura e resultado de negócio foi preservada: a
  tentativa de preparação incompatível não foi tratada como falha funcional, e o resultado final
  registra separadamente a execução completa sobre a dependência disponível.

## Limpeza

- O cluster PostgreSQL sintético foi parado e removido após a validação.
- Os dois bancos e a role descartáveis foram eliminados juntamente com o cluster.
- Os logs temporários externos ao repositório foram removidos.
- `pg_lsclusters` não listou clusters remanescentes após a limpeza.
- `backend/target/` permaneceu apenas como saída ignorada gerada pelo comando obrigatório de build;
  não integra a alteração versionada.

## Pendências

- Restaurar ou fornecer `backend/AGENTS.md` e
  `docs/testing/plans/VAL_STAB_BACKEND_PG_002.md`, caso sejam artefatos obrigatórios da baseline
  pretendida.
- Fornecer uma referência local ou remota de `main` para permitir comprovar que o commit validado
  corresponde ao `latest main` solicitado.

## Arquivos alterados

- `docs/testing/runs/VAL_STAB_BACKEND_PG_002.md` (criado).
