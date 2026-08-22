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

if not exist "%PROJECT_DIR%\VERSION" (
  echo [RUNTIME-IMAGE][FAIL] Arquivo VERSION ausente.
  exit /b 1
)
set /p VERSION=<"%PROJECT_DIR%\VERSION"
if not defined VERSION (
  echo [RUNTIME-IMAGE][FAIL] Arquivo VERSION vazio.
  exit /b 1
)

set "BACKEND_IMAGE=contabilidade-backend:%VERSION%"
set "FRONTEND_IMAGE=contabilidade-frontend:%VERSION%"
set "WORKER_IMAGE=contabilidade-automation-worker:%VERSION%"

echo.
echo [RUNTIME-IMAGE] Verificacao estruturada antes da transicao Compose...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-runtime-images.ps1" ^
  -BackendImage "%BACKEND_IMAGE%" ^
  -FrontendImage "%FRONTEND_IMAGE%" ^
  -WorkerImage "%WORKER_IMAGE%"
set "VERIFY_RC=%ERRORLEVEL%"
if not "%VERIFY_RC%"=="0" (
  echo [RUNTIME-IMAGE][FAIL] Verificacao estruturada falhou com exit code %VERIFY_RC%.
  exit /b %VERIFY_RC%
)

echo [TRANSITION] Imagens verificadas. Subindo a stack completa pelo Docker Compose no modelo PRIMA...
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
