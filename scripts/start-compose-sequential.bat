@echo off
setlocal EnableExtensions

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

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-compose-sequential.ps1" -Mode "%MODE%"
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" (
  echo.
  echo ---- ESTADO FINAL DOS CONTAINERS ----
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps -a
  echo.
  echo ---- LOGS DE STARTUP ----
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 250 postgres postgres-bootstrap keycloak backend automation-worker frontend
)

exit /b %RC%
