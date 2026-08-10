@echo off
setlocal EnableExtensions EnableDelayedExpansion

for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"
set "MODE=%~1"
if not defined MODE set "MODE=dev"

set "ENV_FILE=%PROJECT_DIR%\.env"
set "COMPOSE_BASE=%PROJECT_DIR%\compose.yaml"
set "COMPOSE_OVERRIDE=%PROJECT_DIR%\.docker-local\artifact-build\compose.local-artifacts.yaml"
if /i "%MODE%"=="dev" (
  set "COMPOSE_MODE=%PROJECT_DIR%\compose.dev.yaml"
) else (
  set "COMPOSE_MODE=%PROJECT_DIR%\compose.onpremise.yaml"
)

set "POSTGRES_USER=contabilidade"
set "POSTGRES_DB=contabilidade"
set "KEYCLOAK_DB=keycloak"

if not exist "%ENV_FILE%" (
  echo [DB-VALIDATION] Arquivo .env ausente: %ENV_FILE%
  exit /b 1
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
  if /i "%%A"=="POSTGRES_USER" set "POSTGRES_USER=%%B"
  if /i "%%A"=="POSTGRES_DB" set "POSTGRES_DB=%%B"
  if /i "%%A"=="KEYCLOAK_DB" set "KEYCLOAK_DB=%%B"
)

cd /d "%PROJECT_DIR%"
if errorlevel 1 exit /b 1

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" config --quiet
if errorlevel 1 (
  echo [DB-VALIDATION] Configuracao Compose invalida.
  exit /b 1
)

echo.
echo [DB-VALIDATION 1/2] Validando schema do Keycloak em !KEYCLOAK_DB!...
set "KEYCLOAK_SCHEMA_STATUS="
for /f "usebackq delims=" %%R in (`docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T postgres psql -U "!POSTGRES_USER!" -d "!KEYCLOAK_DB!" -Atc "SELECT CASE WHEN to_regclass('public.databasechangelog') IS NOT NULL AND to_regclass('public.databasechangeloglock') IS NOT NULL THEN 'OK' ELSE 'MISSING' END;" 2^>nul`) do set "KEYCLOAK_SCHEMA_STATUS=%%R"

if /i not "!KEYCLOAK_SCHEMA_STATUS!"=="OK" (
  echo [DB-VALIDATION] Schema do Keycloak incompleto.
  echo Tabelas encontradas:
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T postgres psql -U "!POSTGRES_USER!" -d "!KEYCLOAK_DB!" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('databasechangelog', 'databasechangeloglock', 'migration_model') ORDER BY tablename;"
  exit /b 1
)

set "MIGRATION_MODEL_STATUS="
for /f "usebackq delims=" %%R in (`docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T postgres psql -U "!POSTGRES_USER!" -d "!KEYCLOAK_DB!" -Atc "SELECT CASE WHEN to_regclass('public.migration_model') IS NOT NULL THEN 'PRESENT' ELSE 'ABSENT' END;" 2^>nul`) do set "MIGRATION_MODEL_STATUS=%%R"

echo [OK] Liquibase do Keycloak inicializado. MIGRATION_MODEL=!MIGRATION_MODEL_STATUS!

echo.
echo [DB-VALIDATION 2/2] Validando Flyway em !POSTGRES_DB!...
set "FLYWAY_TABLE_STATUS="
for /f "usebackq delims=" %%R in (`docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T postgres psql -U "!POSTGRES_USER!" -d "!POSTGRES_DB!" -Atc "SELECT CASE WHEN to_regclass('public.flyway_schema_history') IS NOT NULL THEN 'PRESENT' ELSE 'ABSENT' END;" 2^>nul`) do set "FLYWAY_TABLE_STATUS=%%R"

if /i not "!FLYWAY_TABLE_STATUS!"=="PRESENT" (
  echo [DB-VALIDATION] A tabela flyway_schema_history nao existe.
  exit /b 1
)

set "FLYWAY_SCHEMA_STATUS="
for /f "usebackq delims=" %%R in (`docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T postgres psql -U "!POSTGRES_USER!" -d "!POSTGRES_DB!" -Atc "SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE success = FALSE) AND (SELECT COUNT(*) FROM flyway_schema_history WHERE success = TRUE AND version IN ('1','2','3','4','5','6','7')) = 7 THEN 'OK' ELSE 'INVALID' END;" 2^>nul`) do set "FLYWAY_SCHEMA_STATUS=%%R"

if /i not "!FLYWAY_SCHEMA_STATUS!"=="OK" (
  echo [DB-VALIDATION] Historico Flyway incompleto ou com falha.
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T postgres psql -U "!POSTGRES_USER!" -d "!POSTGRES_DB!" -c "SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
  exit /b 1
)

echo [OK] Flyway V1-V7 aplicado sem registro de falha.
echo.
echo [DB-VALIDATION] Schemas PostgreSQL validados.
exit /b 0
