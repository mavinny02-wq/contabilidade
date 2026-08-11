@echo off
setlocal EnableExtensions EnableDelayedExpansion

for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"
set "MODE=%~1"
if not defined MODE set "MODE=dev"
set "ENV_FILE=%PROJECT_DIR%\.env"
set "COMPOSE_BASE=%PROJECT_DIR%\compose.yaml"
set "COMPOSE_OVERRIDE=%PROJECT_DIR%\.docker-local\artifact-build\compose.local-artifacts.yaml"
set "PROBE_CONTAINER=contabilidade-startup-probe"
if /i "%MODE%"=="dev" (
  set "COMPOSE_MODE=%PROJECT_DIR%\compose.dev.yaml"
) else (
  set "COMPOSE_MODE=%PROJECT_DIR%\compose.onpremise.yaml"
)

cd /d "%PROJECT_DIR%"
docker rm -f "%PROBE_CONTAINER%" >nul 2>&1

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" config --quiet
if errorlevel 1 goto :startup_failed

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" down
if errorlevel 1 goto :startup_failed

call :start_and_wait_postgres
if errorlevel 1 goto :startup_failed
call :start_and_wait_postgres_bootstrap
if errorlevel 1 goto :startup_failed
call :start_and_wait_keycloak
if errorlevel 1 goto :startup_failed
call :start_probe
if errorlevel 1 goto :startup_failed
call :start_and_wait_backend
if errorlevel 1 goto :startup_failed
call :cleanup_probe
call :validate_database_schemas
if errorlevel 1 goto :startup_failed
call :start_and_wait_worker
if errorlevel 1 goto :startup_failed
call :start_and_wait_frontend
if errorlevel 1 goto :startup_failed

call :cleanup_probe
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps -a
exit /b 0

:startup_failed
call :cleanup_probe
exit /b 1

:start_and_wait_postgres
echo.
echo [START 1/6] PostgreSQL...
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" up --no-build -d postgres
if errorlevel 1 echo [AVISO] up postgres retornou erro; aguardando recuperacao.
set /a ATTEMPT=0
:wait_postgres
set /a ATTEMPT+=1
set "CID="
set "STATUS=missing"
for /f "delims=" %%C in ('docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps -q postgres') do set "CID=%%C"
if defined CID for /f "delims=" %%H in ('docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}" "!CID!" 2^>nul') do set "STATUS=%%H"
echo PostgreSQL: !STATUS! - !ATTEMPT!/60
if /i "!STATUS!"=="healthy" exit /b 0
if !ATTEMPT! GEQ 60 (
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 200 postgres
  exit /b 1
)
timeout /t 3 /nobreak >nul
goto :wait_postgres

:start_and_wait_postgres_bootstrap
echo.
echo [START 2/6] Bootstrap do banco Keycloak...
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" up --no-build -d postgres-bootstrap
if errorlevel 1 echo [AVISO] up postgres-bootstrap retornou erro; verificando resultado.
set /a ATTEMPT=0
:wait_postgres_bootstrap
set /a ATTEMPT+=1
set "CID="
set "STATUS=missing"
set "EXIT_CODE="
for /f "delims=" %%C in ('docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps -a -q postgres-bootstrap') do set "CID=%%C"
if defined CID (
  for /f "delims=" %%S in ('docker inspect --format "{{.State.Status}}" "!CID!" 2^>nul') do set "STATUS=%%S"
  for /f "delims=" %%E in ('docker inspect --format "{{.State.ExitCode}}" "!CID!" 2^>nul') do set "EXIT_CODE=%%E"
)
echo PostgreSQL bootstrap: !STATUS! - exit=!EXIT_CODE! - !ATTEMPT!/40
if /i "!STATUS!"=="exited" (
  if "!EXIT_CODE!"=="0" exit /b 0
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 200 postgres-bootstrap
  exit /b 1
)
if !ATTEMPT! GEQ 40 (
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 200 postgres-bootstrap
  exit /b 1
)
timeout /t 3 /nobreak >nul
goto :wait_postgres_bootstrap

:start_and_wait_keycloak
echo.
echo [START 3/6] Keycloak...
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" up --no-build -d keycloak
if errorlevel 1 echo [AVISO] up keycloak retornou erro; aguardando healthcheck.
set /a ATTEMPT=0
:wait_keycloak
set /a ATTEMPT+=1
set "CID="
set "STATUS=missing"
set "HEALTH=none"
for /f "delims=" %%C in ('docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps -a -q keycloak') do set "CID=%%C"
if defined CID (
  for /f "delims=" %%S in ('docker inspect --format "{{.State.Status}}" "!CID!" 2^>nul') do set "STATUS=%%S"
  for /f "delims=" %%H in ('docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" "!CID!" 2^>nul') do set "HEALTH=%%H"
)
echo Keycloak: status=!STATUS! health=!HEALTH! - !ATTEMPT!/60
if /i "!STATUS!"=="running" if /i "!HEALTH!"=="healthy" exit /b 0
if !ATTEMPT! GEQ 60 (
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 200 keycloak
  exit /b 1
)
timeout /t 3 /nobreak >nul
goto :wait_keycloak

:start_probe
echo.
echo [PROBE] Iniciando sonda de readiness na rede Compose...
docker rm -f "%PROBE_CONTAINER%" >nul 2>&1
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" run --no-deps -d --name "%PROBE_CONTAINER%" --entrypoint /bin/sh frontend -c "while :; do sleep 3600; done" >nul
if errorlevel 1 (
  echo [PROBE] Nao foi possivel iniciar a sonda de readiness.
  exit /b 1
)
set "PROBE_STATUS="
for /f "delims=" %%S in ('docker inspect --format "{{.State.Status}}" "%PROBE_CONTAINER%" 2^>nul') do set "PROBE_STATUS=%%S"
if /i not "!PROBE_STATUS!"=="running" (
  echo [PROBE] A sonda nao permaneceu em execucao. Status=!PROBE_STATUS!
  docker logs "%PROBE_CONTAINER%" 2>nul
  exit /b 1
)
echo [PROBE] Sonda pronta: %PROBE_CONTAINER%
exit /b 0

:probe_url
docker exec "%PROBE_CONTAINER%" wget -q -T 5 -O - "%~1" >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0

:cleanup_probe
docker rm -f "%PROBE_CONTAINER%" >nul 2>&1
exit /b 0

:start_and_wait_backend
echo.
echo [START 4/6] Backend...
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" up --no-build -d backend
if errorlevel 1 echo [AVISO] up backend retornou erro; o comando sera repetido se o container ainda nao existir.
set /a ATTEMPT=0
:wait_backend
set /a ATTEMPT+=1
set "CID="
set "STATUS=missing"
for /f "delims=" %%C in ('docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps -a -q backend') do set "CID=%%C"
if not defined CID (
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" up --no-build -d backend >nul 2>&1
) else (
  for /f "delims=" %%S in ('docker inspect --format "{{.State.Status}}" "!CID!" 2^>nul') do set "STATUS=%%S"
)
call :probe_url "http://backend:8080/actuator/health/readiness"
if not errorlevel 1 exit /b 0
echo Backend: !STATUS! - !ATTEMPT!/60
if !ATTEMPT! GEQ 60 (
  echo.
  echo ---- BACKEND CONTAINER ----
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps -a backend
  echo.
  echo ---- BACKEND LOGS ----
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 250 backend
  exit /b 1
)
timeout /t 3 /nobreak >nul
goto :wait_backend

:validate_database_schemas
echo.
echo [VALIDATE] Schemas Keycloak e Flyway...
call "%PROJECT_DIR%\scripts\validate-database-state.bat" "%MODE%"
if errorlevel 1 (
  echo.
  echo ---- DATABASE STARTUP LOGS ----
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 200 postgres postgres-bootstrap keycloak backend
  exit /b 1
)
exit /b 0

:start_and_wait_worker
echo.
echo [START 5/6] Automation worker...
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" up --no-build -d automation-worker
if errorlevel 1 echo [AVISO] up worker retornou erro; aguardando health.
set /a ATTEMPT=0
:wait_worker
set /a ATTEMPT+=1
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T automation-worker node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >nul 2>&1
if not errorlevel 1 exit /b 0
if !ATTEMPT! GEQ 40 (
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 200 automation-worker
  exit /b 1
)
echo Worker inicializando - !ATTEMPT!/40
timeout /t 3 /nobreak >nul
goto :wait_worker

:start_and_wait_frontend
echo.
echo [START 6/6] Frontend...
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" up --no-build -d frontend
if errorlevel 1 echo [AVISO] up frontend retornou erro; aguardando healthz.
set /a ATTEMPT=0
:wait_frontend
set /a ATTEMPT+=1
powershell -NoProfile -ExecutionPolicy Bypass -Command "try{$r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 'http://localhost:8088/healthz';if($r.StatusCode -eq 200){exit 0}}catch{};exit 1" >nul 2>&1
if not errorlevel 1 goto :frontend_ready
if !ATTEMPT! GEQ 40 (
  echo.
  echo ---- FRONTEND CONTAINER ----
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps -a frontend
  echo.
  echo ---- FRONTEND LOGS ----
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 200 frontend
  exit /b 1
)
echo Frontend inicializando - !ATTEMPT!/40
timeout /t 3 /nobreak >nul
goto :wait_frontend

:frontend_ready
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T frontend nginx -t
if errorlevel 1 (
  docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 200 frontend
  exit /b 1
)
exit /b 0
