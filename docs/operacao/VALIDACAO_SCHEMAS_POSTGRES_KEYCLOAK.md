# Validação dos schemas PostgreSQL, Keycloak e Flyway

## Mensagens observadas na primeira inicialização

As mensagens abaixo podem aparecer enquanto o Keycloak inicializa um banco vazio:

```text
relation "migration_model" does not exist
relation "public.databasechangelog" does not exist
relation "public.databasechangeloglock" does not exist
```

O Keycloak usa Liquibase e consulta as tabelas de controle antes de criá-las. Portanto, essas linhas
isoladas não devem ser tratadas como falha definitiva. O critério de sucesso é o Keycloak ficar
`healthy` e as tabelas de controle existirem ao final da inicialização.

A mensagem abaixo também é normal quando o volume PostgreSQL já existe:

```text
PostgreSQL Database directory appears to contain a database; Skipping initialization
```

Ela informa apenas que `/docker-entrypoint-initdb.d` não será executado novamente. O serviço
one-shot `postgres-bootstrap` continua garantindo o banco `keycloak` em todas as subidas.

## Validação automática

O script:

```text
scripts/validate-database-state.bat
```

é chamado pelo startup sequencial depois que Keycloak e backend ficam disponíveis. Ele comprova:

- presença de `databasechangelog` e `databasechangeloglock` no banco do Keycloak;
- presença informativa de `migration_model`;
- presença de `flyway_schema_history` no banco da aplicação;
- migrations V1 a V8 registradas com sucesso;
- ausência de registro Flyway com `success = false`;
- presença da tabela `tickets_sessao_interativa_consumidos`, criada pela V8 para impedir replay de
  tickets da sessão interativa.

Se a validação falhar, o startup imprime o estado das tabelas e os logs de PostgreSQL,
`postgres-bootstrap`, Keycloak e backend.

## Identificação das conexões nos logs

O PostgreSQL agora usa um `log_line_prefix` que inclui:

```text
db=<database>,user=<user>,app=<application>,client=<client>
```

As conexões do backend e do Keycloak recebem `ApplicationName`, e o bootstrap usa `PGAPPNAME`.
Isso permite distinguir uma consulta esperada do Keycloak de um erro real do backend.

## Execução manual

```powershell
.\scripts\validate-database-state.bat dev
```

A execução não altera dados nem schema. Ela faz somente consultas de diagnóstico.

## Segurança operacional

- não cria manualmente tabelas Liquibase;
- não executa `flyway repair` automaticamente;
- não remove volumes;
- não apaga dados;
- não executa chamadas fiscais externas ou pagas.
