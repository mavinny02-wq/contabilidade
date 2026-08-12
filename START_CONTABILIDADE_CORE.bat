@echo off
setlocal EnableExtensions EnableDelayedExpansion

title Contabilidade - Build local e startup sequencial

REM ============================================================
REM REVISAO: COMPACT-SEQUENTIAL-2026-08-10-05
REM Maven/npm rodam no Windows. Docker recebe artefatos prontos.
REM ============================================================

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"
set "WORKER_DIR=%PROJECT_DIR%\automation-worker"
set "MODE=%~1"
if not defined MODE set "MODE=dev"

if defined CONTABILIDADE_JAVA_HOME (
  set "JAVA_HOME=%CONTABILIDADE_JAVA_HOME%"
) else (
  set "JAVA_HOME=C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64"
)
set "PATH=%JAVA_HOME%\bin;%PATH%"

set "LOCAL_ROOT=%PROJECT_DIR%\.docker-local\artifact-build"
set "BACKEND_CONTEXT=%LOCAL_ROOT%\backend-context"
set "FRONTEND_CONTEXT=%LOCAL_ROOT%\frontend-context"
set "WORKER_CONTEXT=%LOCAL_ROOT%\worker-context"
set "WORKER_PROD=%LOCAL_ROOT%\worker-production"
set "COMPOSE_OVERRIDE=%LOCAL_ROOT%\compose.local-artifacts.yaml"
set "FATAL_MESSAGE="

call :preflight
if errorlevel 1 goto :fatal
call :build_backend
if errorlevel 1 goto :fatal
call :build_frontend
if errorlevel 1 goto :fatal
call :build_worker
if errorlevel 1 goto :fatal
call :prepare_contexts
if errorlevel 1 goto :fatal
call :build_images
if errorlevel 1 goto :fatal

call "%PROJECT_DIR%\scripts\start-compose-sequential.bat" "%MODE%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Startup sequencial dos containers falhou."
  goto :fatal
)

echo.
echo ============================================================
echo SUCESSO - Contabilidade %VERSION%
echo http://localhost:8088
echo ============================================================
start "" "http://localhost:8088"
pause
exit /b 0

:preflight
echo ============================================================
echo CONTABILIDADE - BUILD LOCAL E STARTUP SEQUENCIAL
echo REVISAO: COMPACT-SEQUENTIAL-2026-08-10-05
echo ============================================================
echo Projeto: %PROJECT_DIR%
echo Modo:    %MODE%
echo.

cd /d "%PROJECT_DIR%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Nao foi possivel acessar o projeto."
  exit /b 1
)

if /i not "%MODE%"=="dev" if /i not "%MODE%"=="onpremise" (
  set "FATAL_MESSAGE=Modo invalido. Use dev ou onpremise."
  exit /b 1
)

for %%F in (
  "VERSION"
  ".env.example"
  "backend\pom.xml"
  "frontend\package.json"
  "frontend\package-lock.json"
  "frontend\nginx.conf"
  "frontend\docker-entrypoint.d\40-runtime-config.sh"
  "automation-worker\package.json"
  "automation-worker\package-lock.json"
  "compose.yaml"
  "compose.dev.yaml"
  "compose.onpremise.yaml"
  "scripts\start-compose-sequential.bat"
) do if not exist %%F (
  set "FATAL_MESSAGE=Arquivo obrigatorio ausente: %%~F"
  exit /b 1
)

set /p VERSION=<"VERSION"
if not defined VERSION (
  set "FATAL_MESSAGE=Arquivo VERSION vazio."
  exit /b 1
)
set "BACKEND_IMAGE=contabilidade-backend:%VERSION%"
set "FRONTEND_IMAGE=contabilidade-frontend:%VERSION%"
set "WORKER_IMAGE=contabilidade-automation-worker:%VERSION%"

if not exist "%JAVA_HOME%\bin\java.exe" (
  set "FATAL_MESSAGE=JDK 21 nao encontrado em %JAVA_HOME%."
  exit /b 1
)
if not exist "%JAVA_HOME%\bin\javac.exe" (
  set "FATAL_MESSAGE=JAVA_HOME nao aponta para um JDK completo."
  exit /b 1
)

for %%C in (mvn node npm docker powershell robocopy) do (
  where %%C >nul 2>&1
  if errorlevel 1 (
    set "FATAL_MESSAGE=Comando nao encontrado no PATH: %%C"
    exit /b 1
  )
)

docker info >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=Docker Desktop nao esta em execucao."
  exit /b 1
)
docker compose version >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=Docker Compose v2 nao encontrado."
  exit /b 1
)

if not exist ".env" (
  if /i "%MODE%"=="onpremise" (
    set "FATAL_MESSAGE=.env ausente para modo onpremise."
    exit /b 1
  )
  copy /y ".env.example" ".env" >nul
  if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel criar .env."
    exit /b 1
  )
)

if /i "%MODE%"=="onpremise" (
  findstr /i /c:"altere-esta-senha" /c:"altere-este-token" /c:"altere-este-segredo" ".env" >nul
  if not errorlevel 1 (
    set "FATAL_MESSAGE=On-premise recusado: .env ainda contem segredos de exemplo."
    exit /b 1
  )
)

if not exist "%LOCAL_ROOT%" mkdir "%LOCAL_ROOT%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Nao foi possivel criar %LOCAL_ROOT%."
  exit /b 1
)

echo Java:
"%JAVA_HOME%\bin\java.exe" -version
if errorlevel 1 exit /b 1
echo.
echo Maven:
call mvn --version
if errorlevel 1 exit /b 1
echo.
echo Node/npm:
node --version
call npm --version
if errorlevel 1 exit /b 1
echo.
echo Preflight OK.
exit /b 0

:build_backend
echo.
echo [1/6] Building backend locally...
cd /d "%BACKEND_DIR%"
call mvn -B clean package -DskipTests
if errorlevel 1 (
  set "FATAL_MESSAGE=Build Maven local falhou."
  exit /b 1
)
if not exist "target\contabilidade-backend.jar" (
  set "FATAL_MESSAGE=JAR do backend nao foi gerado."
  exit /b 1
)
exit /b 0

:build_frontend
echo.
echo [2/6] Building frontend locally...
cd /d "%FRONTEND_DIR%"
call npm ci --prefer-offline --no-audit --no-fund
if errorlevel 1 (
  set "FATAL_MESSAGE=npm ci do frontend falhou."
  exit /b 1
)
call npm run locale:validate
if errorlevel 1 exit /b 1
call npm run typecheck
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 (
  set "FATAL_MESSAGE=Build do frontend falhou."
  exit /b 1
)
if not exist "dist\index.html" (
  set "FATAL_MESSAGE=dist do frontend nao foi gerado."
  exit /b 1
)
exit /b 0

:build_worker
echo.
echo [3/6] Building automation worker locally...
cd /d "%WORKER_DIR%"
set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1"
call npm ci --prefer-offline --no-audit --no-fund
if errorlevel 1 (
  set "FATAL_MESSAGE=npm ci do worker falhou."
  exit /b 1
)
call npm run typecheck
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 (
  set "FATAL_MESSAGE=Build do worker falhou."
  exit /b 1
)
if not exist "dist\index.js" (
  set "FATAL_MESSAGE=dist do worker nao foi gerado."
  exit /b 1
)

if exist "%WORKER_PROD%" rd /s /q "%WORKER_PROD%"
mkdir "%WORKER_PROD%"
copy /y "package.json" "%WORKER_PROD%\package.json" >nul
copy /y "package-lock.json" "%WORKER_PROD%\package-lock.json" >nul
pushd "%WORKER_PROD%"
call npm ci --omit=dev --ignore-scripts --prefer-offline --no-audit --no-fund
set "NPM_PROD_RC=!ERRORLEVEL!"
popd
if not "!NPM_PROD_RC!"=="0" (
  set "FATAL_MESSAGE=Dependencias de producao do worker falharam."
  exit /b 1
)
exit /b 0

:prepare_contexts
echo.
echo [4/6] Preparing runtime-only contexts...
for %%D in ("%BACKEND_CONTEXT%" "%FRONTEND_CONTEXT%" "%WORKER_CONTEXT%") do if exist %%D rd /s /q %%D
mkdir "%BACKEND_CONTEXT%"
mkdir "%FRONTEND_CONTEXT%\dist"
mkdir "%FRONTEND_CONTEXT%\docker-entrypoint.d"
mkdir "%WORKER_CONTEXT%\dist"
mkdir "%WORKER_CONTEXT%\node_modules"

copy /y "%BACKEND_DIR%\target\contabilidade-backend.jar" "%BACKEND_CONTEXT%\app.jar" >nul
if errorlevel 1 exit /b 1
call :copy_tree "%FRONTEND_DIR%\dist" "%FRONTEND_CONTEXT%\dist"
if errorlevel 1 exit /b 1
copy /y "%FRONTEND_DIR%\nginx.conf" "%FRONTEND_CONTEXT%\nginx.conf" >nul
copy /y "%FRONTEND_DIR%\docker-entrypoint.d\40-runtime-config.sh" "%FRONTEND_CONTEXT%\docker-entrypoint.d\40-runtime-config.sh" >nul
call :copy_tree "%WORKER_DIR%\dist" "%WORKER_CONTEXT%\dist"
if errorlevel 1 exit /b 1
call :copy_tree "%WORKER_PROD%\node_modules" "%WORKER_CONTEXT%\node_modules"
if errorlevel 1 exit /b 1
copy /y "%WORKER_DIR%\package.json" "%WORKER_CONTEXT%\package.json" >nul

(
  echo FROM eclipse-temurin:21-jre
  echo LABEL contabilidade.local.artifact-only="true"
  echo WORKDIR /app
  echo COPY app.jar /app/app.jar
  echo EXPOSE 8080
  echo USER 10001
  echo ENTRYPOINT ["java","-XX:MaxRAMPercentage=75.0","-jar","/app/app.jar"]
)>"%BACKEND_CONTEXT%\Dockerfile"

(
  echo FROM nginx:1.27-alpine
  echo LABEL contabilidade.local.artifact-only="true"
  echo COPY nginx.conf /etc/nginx/conf.d/default.conf
  echo COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
  echo RUN sed -i 's/\r$//' /docker-entrypoint.d/40-runtime-config.sh ^&^& chmod +x /docker-entrypoint.d/40-runtime-config.sh
  echo COPY dist/ /usr/share/nginx/html/
  echo EXPOSE 8080
)>"%FRONTEND_CONTEXT%\Dockerfile"

(
  echo FROM mcr.microsoft.com/playwright:v1.60.0-noble
  echo LABEL contabilidade.local.artifact-only="true"
  echo WORKDIR /app
  echo COPY --chown=pwuser:pwuser package.json /app/package.json
  echo COPY --chown=pwuser:pwuser dist/ /app/dist/
  echo COPY --chown=pwuser:pwuser node_modules/ /app/node_modules/
  echo ENV NODE_ENV=production
  echo EXPOSE 3001
  echo USER pwuser
  echo ENTRYPOINT ["node","dist/index.js"]
)>"%WORKER_CONTEXT%\Dockerfile"

(
  echo services:
  echo   backend:
  echo     image: %BACKEND_IMAGE%
  echo     build: null
  echo     healthcheck:
  echo       test: ["CMD-SHELL", "test -f /app/app.jar"]
  echo       interval: 5s
  echo       timeout: 3s
  echo       retries: 20
  echo   frontend:
  echo     image: %FRONTEND_IMAGE%
  echo     build: null
  echo   automation-worker:
  echo     image: %WORKER_IMAGE%
  echo     build: null
)>"%COMPOSE_OVERRIDE%"
exit /b 0

:copy_tree
robocopy "%~1" "%~2" /E /NFL /NDL /NJH /NJS /NP >nul
set "ROBOCOPY_RC=!ERRORLEVEL!"
if !ROBOCOPY_RC! GEQ 8 (
  set "FATAL_MESSAGE=Falha ao copiar %~1."
  exit /b 1
)
exit /b 0

:build_images
echo.
echo [5/6] Building runtime-only images...
docker build --pull=false --network=none --progress=plain -t "%BACKEND_IMAGE%" "%BACKEND_CONTEXT%"
if errorlevel 1 exit /b 1
docker build --pull=false --network=none --progress=plain -t "%FRONTEND_IMAGE%" "%FRONTEND_CONTEXT%"
if errorlevel 1 exit /b 1
docker build --pull=false --network=none --progress=plain -t "%WORKER_IMAGE%" "%WORKER_CONTEXT%"
if errorlevel 1 exit /b 1

echo [6/6] Verifying runtime images...
docker run --rm --entrypoint /bin/sh "%BACKEND_IMAGE%" -c "test -f /app/app.jar"
if errorlevel 1 exit /b 1
docker run --rm --entrypoint /bin/sh "%FRONTEND_IMAGE%" -c "test -x /usr/sbin/nginx && test -f /usr/share/nginx/html/index.html"
if errorlevel 1 exit /b 1
docker run --rm --entrypoint /bin/sh "%WORKER_IMAGE%" -c "test -f /app/dist/index.js && test -d /app/node_modules/playwright"
if errorlevel 1 exit /b 1
exit /b 0

:fatal
echo.
echo ============================================================
echo FALHA
if defined FATAL_MESSAGE echo %FATAL_MESSAGE%
echo ============================================================
echo A janela permanecera aberta.
pause
exit /b 1
