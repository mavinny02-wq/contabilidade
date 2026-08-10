@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM CONTABILIDADE - Build local no mesmo modelo do PRIMA
REM
REM Maven e npm rodam no Windows.
REM Docker recebe somente artefatos ja compilados.
REM
REM Este arquivo NAO:
REM   - chama scripts\start-contabilidade.ps1;
REM   - interpreta java -version com PowerShell;
REM   - executa Maven ou npm dentro do Docker;
REM   - executa docker compose build;
REM   - executa docker compose up --build;
REM   - para containers antes de todos os builds terminarem.
REM ============================================================

set "PROJECT_DIR=D:\priv\priv\projeto\contabilidade"
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"
set "WORKER_DIR=%PROJECT_DIR%\automation-worker"

REM Mesmo JDK usado pelo BAT funcional do PRIMA.
set "JAVA_HOME=C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64"
set "PATH=%JAVA_HOME%\bin;%PATH%"

set "MODE=%~1"
if not defined MODE set "MODE=dev"

set "COMPOSE_BASE=%PROJECT_DIR%\compose.yaml"
set "COMPOSE_DEV=%PROJECT_DIR%\compose.dev.yaml"
set "COMPOSE_ONPREMISE=%PROJECT_DIR%\compose.onpremise.yaml"
set "ENV_FILE=%PROJECT_DIR%\.env"

set "LOCAL_ROOT=%PROJECT_DIR%\.docker-local\artifact-build"
set "BACKEND_CONTEXT=%LOCAL_ROOT%\backend-context"
set "FRONTEND_CONTEXT=%LOCAL_ROOT%\frontend-context"
set "WORKER_CONTEXT=%LOCAL_ROOT%\worker-context"
set "WORKER_PROD=%LOCAL_ROOT%\worker-production"
set "COMPOSE_OVERRIDE=%LOCAL_ROOT%\compose.local-artifacts.yaml"
set "FRONTEND_HASH_FILE=%LOCAL_ROOT%\frontend-deps.sha256"
set "WORKER_HASH_FILE=%LOCAL_ROOT%\worker-deps.sha256"

REM npm: force the official registry and use a clean project-local cache.
REM The corporate proxy below is used only as a fallback when the normal npm ping fails.
set "NPM_REGISTRY=https://registry.npmjs.org/"
set "NPM_CACHE=%LOCAL_ROOT%\npm-cache"
if not defined CONTABILIDADE_NPM_PROXY set "CONTABILIDADE_NPM_PROXY=http://HE242689.emea2.cds.t-internal.com:3128"
set "FRONTEND_NPM_PEER_FLAG="
set "WORKER_NPM_PEER_FLAG="

set "VERSION="
set "BACKEND_IMAGE="
set "FRONTEND_IMAGE="
set "WORKER_IMAGE="
set "FATAL_MESSAGE="

title Contabilidade - Build local no modelo do PRIMA

echo ============================================================
echo CONTABILIDADE - BUILD LOCAL NO MODELO DO PRIMA
echo ============================================================
echo Projeto: %PROJECT_DIR%
echo Modo:    %MODE%
echo.

call :preflight
if errorlevel 1 goto :fatal

call :build_backend_local
if errorlevel 1 goto :fatal

call :build_frontend_local
if errorlevel 1 goto :fatal

call :build_worker_local
if errorlevel 1 goto :fatal

call :prepare_runtime_contexts
if errorlevel 1 goto :fatal

call :build_runtime_images
if errorlevel 1 goto :fatal

call :restart_compose
if errorlevel 1 goto :fatal

echo.
echo ============================================================
echo SUCCESS
echo ============================================================
echo.
echo Backend image:  %BACKEND_IMAGE%
echo Frontend image: %FRONTEND_IMAGE%
echo Worker image:   %WORKER_IMAGE%
echo.
echo Maven usou o repositorio da maquina:
echo %USERPROFILE%\.m2\repository
echo.
echo Docker nao executou Maven ou npm.
echo Aplicacao: http://localhost:8088
echo.
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps
echo.
start "" "http://localhost:8088"
pause
exit /b 0


:preflight
echo [1/7] Preflight...

cd /d "%PROJECT_DIR%"
if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel acessar: %PROJECT_DIR%"
    exit /b 1
)

if /i not "%MODE%"=="dev" if /i not "%MODE%"=="onpremise" (
    set "FATAL_MESSAGE=Modo invalido: %MODE%. Use dev ou onpremise."
    exit /b 1
)

if /i "%MODE%"=="dev" (
    set "COMPOSE_MODE=%COMPOSE_DEV%"
) else (
    set "COMPOSE_MODE=%COMPOSE_ONPREMISE%"
)

if not exist "%PROJECT_DIR%\VERSION" (
    set "FATAL_MESSAGE=Arquivo VERSION ausente."
    exit /b 1
)

set /p VERSION=<"%PROJECT_DIR%\VERSION"
if not defined VERSION (
    set "FATAL_MESSAGE=Arquivo VERSION vazio."
    exit /b 1
)

set "BACKEND_IMAGE=contabilidade-backend:%VERSION%"
set "FRONTEND_IMAGE=contabilidade-frontend:%VERSION%"
set "WORKER_IMAGE=contabilidade-automation-worker:%VERSION%"

if not exist "%JAVA_HOME%\bin\java.exe" (
    set "FATAL_MESSAGE=Java 21 nao encontrado em: %JAVA_HOME%"
    exit /b 1
)

if not exist "%JAVA_HOME%\bin\javac.exe" (
    set "FATAL_MESSAGE=JDK completo nao encontrado em: %JAVA_HOME%"
    exit /b 1
)

where mvn >nul 2>&1
if errorlevel 1 (
    set "FATAL_MESSAGE=Maven nao encontrado no PATH."
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    set "FATAL_MESSAGE=Node.js nao encontrado no PATH."
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    set "FATAL_MESSAGE=npm nao encontrado no PATH."
    exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
    set "FATAL_MESSAGE=Docker CLI nao encontrado."
    exit /b 1
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

for %%F in (
    "%BACKEND_DIR%\pom.xml"
    "%FRONTEND_DIR%\package.json"
    "%FRONTEND_DIR%\nginx.conf"
    "%FRONTEND_DIR%\docker-entrypoint.d\40-runtime-config.sh"
    "%WORKER_DIR%\package.json"
    "%COMPOSE_BASE%"
    "%COMPOSE_MODE%"
    "%PROJECT_DIR%\infra\keycloak\realm-contabilidade-dev.json"
    "%PROJECT_DIR%\infra\keycloak\realm-contabilidade.json"
    "%PROJECT_DIR%\infra\playwright\seccomp_profile.json"
) do (
    if not exist %%F (
        set "FATAL_MESSAGE=Arquivo obrigatorio ausente: %%~F"
        exit /b 1
    )
)

if not exist "%ENV_FILE%" (
    if /i "%MODE%"=="onpremise" (
        set "FATAL_MESSAGE=.env ausente. Crie e revise o arquivo antes do modo onpremise."
        exit /b 1
    )
    if not exist "%PROJECT_DIR%\.env.example" (
        set "FATAL_MESSAGE=.env e .env.example ausentes."
        exit /b 1
    )
    echo Criando .env de desenvolvimento...
    copy /y "%PROJECT_DIR%\.env.example" "%ENV_FILE%" >nul
    if errorlevel 1 (
        set "FATAL_MESSAGE=Nao foi possivel criar .env."
        exit /b 1
    )
)

if /i "%MODE%"=="onpremise" (
    findstr /i /c:"altere-esta-senha" /c:"altere-este-token" /c:"altere-este-segredo" "%ENV_FILE%" >nul
    if not errorlevel 1 (
        set "FATAL_MESSAGE=On-premise recusado: .env ainda contem segredos de exemplo."
        exit /b 1
    )
)

if not exist "%LOCAL_ROOT%" mkdir "%LOCAL_ROOT%"
if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel criar: %LOCAL_ROOT%"
    exit /b 1
)

echo.
echo Java:
"%JAVA_HOME%\bin\java.exe" -version
if errorlevel 1 (
    set "FATAL_MESSAGE=Falha ao executar Java em: %JAVA_HOME%"
    exit /b 1
)

echo.
echo Maven:
call mvn --version
if errorlevel 1 (
    set "FATAL_MESSAGE=Falha ao executar Maven."
    exit /b 1
)

echo.
echo Node:
node --version
if errorlevel 1 (
    set "FATAL_MESSAGE=Falha ao executar Node.js."
    exit /b 1
)

echo npm:
call npm --version
if errorlevel 1 (
    set "FATAL_MESSAGE=Falha ao executar npm."
    exit /b 1
)

call :prepare_npm_network
if errorlevel 1 exit /b 1

echo.
echo Docker:
docker --version
docker compose version
echo.

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" config --quiet
if errorlevel 1 (
    set "FATAL_MESSAGE=Compose base do modo %MODE% invalido."
    exit /b 1
)

echo Preflight OK. Containers existentes ainda estao intactos.
exit /b 0


:build_backend_local
echo.
echo [2/7] Building backend LOCALLY...
echo Maven repository: %USERPROFILE%\.m2\repository
echo Docker nao executara Maven.
echo.

cd /d "%BACKEND_DIR%"

call mvn -B clean package -DskipTests
if errorlevel 1 (
    set "FATAL_MESSAGE=Build Maven LOCAL falhou."
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; " ^
  "$target='%BACKEND_DIR%\target'; " ^
  "$jars=Get-ChildItem -LiteralPath $target -File -Filter '*.jar' | " ^
  "Where-Object { $_.Name -notmatch '^(original-|.*-sources\.jar$|.*-javadoc\.jar$)' } | " ^
  "Sort-Object Length -Descending; " ^
  "if(-not $jars){throw 'No executable JAR found in backend target.'}; " ^
  "$selected=$jars[0]; " ^
  "Copy-Item -LiteralPath $selected.FullName -Destination (Join-Path $target 'contabilidade-local-backend.jar') -Force; " ^
  "Write-Host ('Selected JAR: '+$selected.FullName)"

if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel preparar o JAR do backend."
    exit /b 1
)

if not exist "%BACKEND_DIR%\target\contabilidade-local-backend.jar" (
    set "FATAL_MESSAGE=JAR preparado do backend nao foi encontrado."
    exit /b 1
)

echo Backend local build completed.
exit /b 0


:build_frontend_local
echo.
echo [3/7] Building frontend LOCALLY...
echo Docker nao executara npm.
echo.

cd /d "%FRONTEND_DIR%"

call :calculate_dependency_hash "%FRONTEND_DIR%" "%FRONTEND_HASH_FILE%"
if errorlevel 1 exit /b 1

set "INSTALL_FRONTEND_DEPS=NO"
if not exist "%FRONTEND_DIR%\node_modules" set "INSTALL_FRONTEND_DEPS=YES"
if /i not "!CURRENT_HASH!"=="!CACHED_HASH!" set "INSTALL_FRONTEND_DEPS=YES"

if /i "!INSTALL_FRONTEND_DEPS!"=="YES" (
    call :install_node_project "%FRONTEND_DIR%" "frontend"
    if errorlevel 1 exit /b 1

    call :calculate_dependency_hash "%FRONTEND_DIR%" "%FRONTEND_HASH_FILE%"
    if errorlevel 1 exit /b 1
    >"%FRONTEND_HASH_FILE%" echo !CURRENT_HASH!
) else (
    echo Reusing existing frontend node_modules.
)

call npm run locale:validate
if errorlevel 1 (
    set "FATAL_MESSAGE=Validacao i18n do frontend falhou."
    exit /b 1
)

call npm run typecheck
if errorlevel 1 (
    set "FATAL_MESSAGE=Typecheck LOCAL do frontend falhou."
    exit /b 1
)

call npm run build
if errorlevel 1 (
    set "FATAL_MESSAGE=Build LOCAL do frontend falhou."
    exit /b 1
)

if not exist "%FRONTEND_DIR%\dist\index.html" (
    set "FATAL_MESSAGE=Frontend dist nao foi gerado."
    exit /b 1
)

echo Frontend local build completed.
exit /b 0


:build_worker_local
echo.
echo [4/7] Building automation worker LOCALLY...
echo Docker nao executara npm.
echo.

cd /d "%WORKER_DIR%"

call :calculate_dependency_hash "%WORKER_DIR%" "%WORKER_HASH_FILE%"
if errorlevel 1 exit /b 1

set "INSTALL_WORKER_DEPS=NO"
if not exist "%WORKER_DIR%\node_modules" set "INSTALL_WORKER_DEPS=YES"
if /i not "!CURRENT_HASH!"=="!CACHED_HASH!" set "INSTALL_WORKER_DEPS=YES"

set "OLD_PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=%PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD%"
set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1"

if /i "!INSTALL_WORKER_DEPS!"=="YES" (
    call :install_node_project "%WORKER_DIR%" "worker"
    if errorlevel 1 (
        set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=%OLD_PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD%"
        exit /b 1
    )

    call :calculate_dependency_hash "%WORKER_DIR%" "%WORKER_HASH_FILE%"
    if errorlevel 1 exit /b 1
    >"%WORKER_HASH_FILE%" echo !CURRENT_HASH!
) else (
    echo Reusing existing worker node_modules.
)

call npm run typecheck
if errorlevel 1 (
    set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=%OLD_PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD%"
    set "FATAL_MESSAGE=Typecheck LOCAL do worker falhou."
    exit /b 1
)

call npm run build
if errorlevel 1 (
    set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=%OLD_PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD%"
    set "FATAL_MESSAGE=Build LOCAL do worker falhou."
    exit /b 1
)

if not exist "%WORKER_DIR%\dist\index.js" (
    set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=%OLD_PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD%"
    set "FATAL_MESSAGE=Worker dist nao foi gerado."
    exit /b 1
)

if exist "%WORKER_PROD%" rd /s /q "%WORKER_PROD%"
mkdir "%WORKER_PROD%"
if errorlevel 1 (
    set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=%OLD_PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD%"
    set "FATAL_MESSAGE=Nao foi possivel criar %WORKER_PROD%."
    exit /b 1
)

copy /y "%WORKER_DIR%\package.json" "%WORKER_PROD%\package.json" >nul
if errorlevel 1 (
    set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=%OLD_PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD%"
    set "FATAL_MESSAGE=Nao foi possivel copiar package.json do worker."
    exit /b 1
)

if exist "%WORKER_DIR%\package-lock.json" (
    copy /y "%WORKER_DIR%\package-lock.json" "%WORKER_PROD%\package-lock.json" >nul
    call npm ci --prefix "%WORKER_PROD%" --omit=dev --prefer-offline --ignore-scripts --no-audit --no-fund --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" !WORKER_NPM_PEER_FLAG!
) else (
    call npm install --prefix "%WORKER_PROD%" --omit=dev --prefer-offline --ignore-scripts --no-audit --no-fund --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" !WORKER_NPM_PEER_FLAG!
)

set "WORKER_PROD_NPM_EXIT=!ERRORLEVEL!"
set "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=%OLD_PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD%"

if not "!WORKER_PROD_NPM_EXIT!"=="0" (
    set "FATAL_MESSAGE=Preparacao LOCAL das dependencias de producao do worker falhou."
    exit /b 1
)

echo Worker local build completed.
exit /b 0


:prepare_npm_network
echo.
echo npm registry preflight...
echo Registry: %NPM_REGISTRY%
echo Cache:    %NPM_CACHE%

if not exist "%NPM_CACHE%" mkdir "%NPM_CACHE%"
if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel criar o cache npm local: %NPM_CACHE%"
    exit /b 1
)

REM Remove the obsolete/invalid npm "http-proxy" environment key only for this BAT process.
set "NPM_CONFIG_HTTP_PROXY="
set "npm_config_http_proxy="

REM Force the official public registry and an isolated cache for this project.
set "NPM_CONFIG_REGISTRY=%NPM_REGISTRY%"
set "npm_config_registry=%NPM_REGISTRY%"
set "NPM_CONFIG_CACHE=%NPM_CACHE%"
set "npm_config_cache=%NPM_CACHE%"

REM First try the existing host/system proxy configuration.
call npm ping --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" --fetch-retries=0 --fetch-timeout=20000 >nul 2>&1
if not errorlevel 1 goto :npm_registry_reachable

echo npm registry nao respondeu com a configuracao atual.
echo Tentando o proxy corporativo usado no ambiente PRIMA...

set "HTTP_PROXY=%CONTABILIDADE_NPM_PROXY%"
set "HTTPS_PROXY=%CONTABILIDADE_NPM_PROXY%"
set "http_proxy=%CONTABILIDADE_NPM_PROXY%"
set "https_proxy=%CONTABILIDADE_NPM_PROXY%"
set "NPM_CONFIG_PROXY=%CONTABILIDADE_NPM_PROXY%"
set "npm_config_proxy=%CONTABILIDADE_NPM_PROXY%"
set "NPM_CONFIG_HTTPS_PROXY=%CONTABILIDADE_NPM_PROXY%"
set "npm_config_https_proxy=%CONTABILIDADE_NPM_PROXY%"

call npm ping --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" --fetch-retries=0 --fetch-timeout=20000 >nul 2>&1
if errorlevel 1 (
    echo.
    echo npm nao conseguiu acessar %NPM_REGISTRY%.
    echo O Maven funciona, mas o npm nao esta conseguindo obter metadados do registry.
    echo Registry atual:
    call npm config get registry
    echo Proxy configurado apenas nesta execucao: %CONTABILIDADE_NPM_PROXY%
    set "FATAL_MESSAGE=Falha de acesso ao npm registry. Verifique VPN/proxy corporativo ou defina CONTABILIDADE_NPM_PROXY antes de executar o BAT."
    exit /b 1
)

:npm_registry_reachable
set "NPM_VITE_VERSION="
for /f "usebackq delims=" %%V in (`call npm view vite@7.3.6 version --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" --fetch-retries=1 --fetch-timeout=30000 2^>nul`) do set "NPM_VITE_VERSION=%%V"

if not "!NPM_VITE_VERSION!"=="7.3.6" (
    echo.
    echo O registry respondeu, mas nao devolveu os metadados esperados de vite@7.3.6.
    echo Valor recebido: !NPM_VITE_VERSION!
    set "FATAL_MESSAGE=Metadados npm incompletos. Nao e um conflito real entre Vite e plugin-react; o pacote Vite nao foi resolvido pelo registry/proxy."
    exit /b 1
)

echo npm registry OK. vite@7.3.6 foi resolvido corretamente.
exit /b 0


:install_node_project
set "NPM_PROJECT_DIR=%~1"
set "NPM_PROJECT_NAME=%~2"
set "NPM_PROJECT_PEER_FLAG="

cd /d "%NPM_PROJECT_DIR%"
if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel acessar o projeto npm: %NPM_PROJECT_DIR%"
    exit /b 1
)

if not exist "%NPM_PROJECT_DIR%\\package-lock.json" (
    echo package-lock.json ausente em %NPM_PROJECT_NAME%.
    echo Gerando primeiro um lockfile reproduzivel com cache limpo do projeto...

    if exist "%NPM_PROJECT_DIR%\\node_modules" (
        echo Removendo node_modules parcial da tentativa anterior...
        rd /s /q "%NPM_PROJECT_DIR%\\node_modules"
        if exist "%NPM_PROJECT_DIR%\\node_modules" (
            set "FATAL_MESSAGE=Nao foi possivel remover node_modules parcial de %NPM_PROJECT_NAME%."
            exit /b 1
        )
    )

    call npm install --package-lock-only --ignore-scripts --no-audit --no-fund --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" --fetch-retries=2 --fetch-timeout=120000
    if errorlevel 1 (
        echo.
        echo O resolver npm normal retornou erro. Como o peer range exibido aceita Vite 7,
        echo sera feita uma unica tentativa com --legacy-peer-deps para contornar o resolver.
        call npm install --package-lock-only --ignore-scripts --legacy-peer-deps --no-audit --no-fund --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" --fetch-retries=2 --fetch-timeout=120000
        if errorlevel 1 (
            set "FATAL_MESSAGE=Nao foi possivel gerar package-lock.json para %NPM_PROJECT_NAME%."
            exit /b 1
        )
        set "NPM_PROJECT_PEER_FLAG=--legacy-peer-deps"
    )
)

echo Installing %NPM_PROJECT_NAME% dependencies with npm ci...
call npm ci --prefer-offline --no-audit --no-fund --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" --fetch-retries=2 --fetch-timeout=120000 !NPM_PROJECT_PEER_FLAG!
if errorlevel 1 (
    if defined NPM_PROJECT_PEER_FLAG (
        set "FATAL_MESSAGE=npm ci falhou em %NPM_PROJECT_NAME%, inclusive com o mesmo modo usado para gerar o lockfile."
        exit /b 1
    )

    echo npm ci normal falhou. Tentando uma unica vez com --legacy-peer-deps...
    call npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund --registry="%NPM_REGISTRY%" --cache="%NPM_CACHE%" --fetch-retries=2 --fetch-timeout=120000
    if errorlevel 1 (
        set "FATAL_MESSAGE=npm ci falhou em %NPM_PROJECT_NAME%."
        exit /b 1
    )
    set "NPM_PROJECT_PEER_FLAG=--legacy-peer-deps"
)

if /i "%NPM_PROJECT_NAME%"=="frontend" set "FRONTEND_NPM_PEER_FLAG=!NPM_PROJECT_PEER_FLAG!"
if /i "%NPM_PROJECT_NAME%"=="worker" set "WORKER_NPM_PEER_FLAG=!NPM_PROJECT_PEER_FLAG!"

echo %NPM_PROJECT_NAME% dependencies installed successfully.
exit /b 0


:calculate_dependency_hash
set "CURRENT_HASH="
set "CACHED_HASH="

for /f "usebackq delims=" %%H in (`powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$files=@('%~1\package.json','%~1\package-lock.json') | Where-Object {Test-Path -LiteralPath $_}; " ^
  "$value=($files | ForEach-Object {(Get-FileHash -Algorithm SHA256 -LiteralPath $_).Hash}) -join '|'; " ^
  "$sha=[Security.Cryptography.SHA256]::Create(); " ^
  "$bytes=[Text.Encoding]::UTF8.GetBytes($value); " ^
  "([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()"`) do set "CURRENT_HASH=%%H"

if not defined CURRENT_HASH (
    set "FATAL_MESSAGE=Nao foi possivel calcular o hash das dependencias em %~1."
    exit /b 1
)

if exist "%~2" set /p CACHED_HASH=<"%~2"
exit /b 0


:prepare_runtime_contexts
echo.
echo [5/7] Preparing isolated runtime-only Docker contexts...

if exist "%BACKEND_CONTEXT%" rd /s /q "%BACKEND_CONTEXT%"
if exist "%FRONTEND_CONTEXT%" rd /s /q "%FRONTEND_CONTEXT%"
if exist "%WORKER_CONTEXT%" rd /s /q "%WORKER_CONTEXT%"

mkdir "%BACKEND_CONTEXT%"
mkdir "%FRONTEND_CONTEXT%\dist"
mkdir "%FRONTEND_CONTEXT%\docker-entrypoint.d"
mkdir "%WORKER_CONTEXT%\dist"
mkdir "%WORKER_CONTEXT%\node_modules"

if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel criar os contextos runtime."
    exit /b 1
)

copy /y "%BACKEND_DIR%\target\contabilidade-local-backend.jar" "%BACKEND_CONTEXT%\app.jar" >nul
if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel copiar o JAR para o contexto runtime."
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop'; " ^
  "Copy-Item -Path '%FRONTEND_DIR%\dist\*' -Destination '%FRONTEND_CONTEXT%\dist' -Recurse -Force; " ^
  "Copy-Item -LiteralPath '%FRONTEND_DIR%\nginx.conf' -Destination '%FRONTEND_CONTEXT%\nginx.conf' -Force; " ^
  "Copy-Item -LiteralPath '%FRONTEND_DIR%\docker-entrypoint.d\40-runtime-config.sh' -Destination '%FRONTEND_CONTEXT%\docker-entrypoint.d\40-runtime-config.sh' -Force; " ^
  "Copy-Item -Path '%WORKER_DIR%\dist\*' -Destination '%WORKER_CONTEXT%\dist' -Recurse -Force; " ^
  "Copy-Item -Path '%WORKER_PROD%\node_modules\*' -Destination '%WORKER_CONTEXT%\node_modules' -Recurse -Force; " ^
  "Copy-Item -LiteralPath '%WORKER_DIR%\package.json' -Destination '%WORKER_CONTEXT%\package.json' -Force"

if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel preparar os contextos runtime do frontend/worker."
    exit /b 1
)

(
  echo # syntax=docker/dockerfile:1.7
  echo FROM eclipse-temurin:21-jre
  echo LABEL contabilidade.local.artifact-only="true"
  echo WORKDIR /app
  echo COPY app.jar /app/app.jar
  echo EXPOSE 8080
  echo USER 10001
  echo ENTRYPOINT ["java","-XX:MaxRAMPercentage=75.0","-jar","/app/app.jar"]
) >"%BACKEND_CONTEXT%\Dockerfile"

(
  echo # syntax=docker/dockerfile:1.7
  echo FROM nginx:1.27-alpine
  echo LABEL contabilidade.local.artifact-only="true"
  echo COPY nginx.conf /etc/nginx/conf.d/default.conf
  echo COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
  echo RUN sed -i 's/\r$//' /docker-entrypoint.d/40-runtime-config.sh ^&^& chmod +x /docker-entrypoint.d/40-runtime-config.sh
  echo COPY dist/ /usr/share/nginx/html/
  echo EXPOSE 8080
) >"%FRONTEND_CONTEXT%\Dockerfile"

(
  echo # syntax=docker/dockerfile:1.7
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
) >"%WORKER_CONTEXT%\Dockerfile"

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
) >"%COMPOSE_OVERRIDE%"

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" config --quiet
if errorlevel 1 (
    set "FATAL_MESSAGE=Compose override local gerado e invalido."
    exit /b 1
)

echo Runtime-only contexts prepared.
exit /b 0


:build_runtime_context
set "BUILD_NAME=%~1"
set "BUILD_IMAGE=%~2"
set "BUILD_CONTEXT=%~3"
set "BUILD_LOG=%LOCAL_ROOT%\%BUILD_NAME%-runtime-image-build.log"

docker build --pull=false --network=none --progress=plain -t "%BUILD_IMAGE%" "%BUILD_CONTEXT%" >"%BUILD_LOG%" 2>&1
set "BUILD_EXIT=!ERRORLEVEL!"
type "%BUILD_LOG%"

if "!BUILD_EXIT!"=="0" exit /b 0

findstr /i /l /c:"failed to prepare extraction snapshot" /c:"parent snapshot" /c:"snapshot not found" "%BUILD_LOG%" >nul
if errorlevel 1 exit /b !BUILD_EXIT!

echo.
echo WARNING: BuildKit snapshot cache appears corrupted.
echo Removing only unused builder cache before one retry...
docker builder prune --force
if errorlevel 1 exit /b 1

docker build --pull=false --network=none --progress=plain -t "%BUILD_IMAGE%" "%BUILD_CONTEXT%"
exit /b !ERRORLEVEL!


:build_runtime_images
echo.
echo [6/7] Building runtime-only Docker images...
echo Dockerfiles abaixo nao possuem Maven nem npm.
echo.

call :build_runtime_context backend "%BACKEND_IMAGE%" "%BACKEND_CONTEXT%"
if errorlevel 1 (
    set "FATAL_MESSAGE=Backend runtime-only Docker build falhou."
    exit /b 1
)

call :build_runtime_context frontend "%FRONTEND_IMAGE%" "%FRONTEND_CONTEXT%"
if errorlevel 1 (
    set "FATAL_MESSAGE=Frontend runtime-only Docker build falhou."
    exit /b 1
)

call :build_runtime_context worker "%WORKER_IMAGE%" "%WORKER_CONTEXT%"
if errorlevel 1 (
    set "FATAL_MESSAGE=Worker runtime-only Docker build falhou."
    exit /b 1
)

for /f "delims=" %%L in ('docker image inspect "%BACKEND_IMAGE%" --format "{{ index .Config.Labels \"contabilidade.local.artifact-only\" }}"') do set "BACKEND_LABEL=%%L"
for /f "delims=" %%L in ('docker image inspect "%FRONTEND_IMAGE%" --format "{{ index .Config.Labels \"contabilidade.local.artifact-only\" }}"') do set "FRONTEND_LABEL=%%L"
for /f "delims=" %%L in ('docker image inspect "%WORKER_IMAGE%" --format "{{ index .Config.Labels \"contabilidade.local.artifact-only\" }}"') do set "WORKER_LABEL=%%L"

if /i not "!BACKEND_LABEL!"=="true" (
    set "FATAL_MESSAGE=Backend image nao possui label artifact-only."
    exit /b 1
)

if /i not "!FRONTEND_LABEL!"=="true" (
    set "FATAL_MESSAGE=Frontend image nao possui label artifact-only."
    exit /b 1
)

if /i not "!WORKER_LABEL!"=="true" (
    set "FATAL_MESSAGE=Worker image nao possui label artifact-only."
    exit /b 1
)

docker run --rm --entrypoint /bin/sh "%BACKEND_IMAGE%" -c "test -f /app/app.jar && test ! -f /app/pom.xml"
if errorlevel 1 (
    set "FATAL_MESSAGE=Backend runtime image invalida."
    exit /b 1
)

docker run --rm "%FRONTEND_IMAGE%" nginx -t
if errorlevel 1 (
    set "FATAL_MESSAGE=Frontend Nginx image invalida."
    exit /b 1
)

docker run --rm --entrypoint /bin/sh "%WORKER_IMAGE%" -c "test -f /app/dist/index.js && test -d /app/node_modules/playwright && test ! -d /app/src"
if errorlevel 1 (
    set "FATAL_MESSAGE=Worker runtime image invalida."
    exit /b 1
)

echo Runtime-only images verified.
exit /b 0


:restart_compose
echo.
echo [7/7] Restarting Compose only after all local builds succeeded...
echo.

cd /d "%PROJECT_DIR%"

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" down
if errorlevel 1 (
    set "FATAL_MESSAGE=Docker Compose down falhou."
    exit /b 1
)

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" up --no-build -d
if errorlevel 1 (
    docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 150
    set "FATAL_MESSAGE=Docker Compose up --no-build falhou."
    exit /b 1
)

echo Aguardando containers...
timeout /t 15 /nobreak >nul

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps

for %%S in (postgres keycloak backend automation-worker frontend) do (
    docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" ps --status running %%S | findstr /i "%%S" >nul
    if errorlevel 1 (
        echo.
        echo ---- LOGS %%S ----
        docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 120 %%S
        set "FATAL_MESSAGE=Servico %%S nao esta em execucao."
        exit /b 1
    )
)

docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T frontend nginx -t
if errorlevel 1 (
    set "FATAL_MESSAGE=Frontend Nginx validation failed."
    exit /b 1
)

set /a BACKEND_ATTEMPT=0
:wait_backend
set /a BACKEND_ATTEMPT+=1
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T frontend wget -qO- http://backend:8080/actuator/health/readiness >nul 2>&1
if not errorlevel 1 goto :backend_ready
if !BACKEND_ATTEMPT! GEQ 60 (
    docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 150 backend
    set "FATAL_MESSAGE=Backend readiness nao respondeu."
    exit /b 1
)
timeout /t 3 /nobreak >nul
goto :wait_backend

:backend_ready
echo Backend readiness OK.

set /a WORKER_ATTEMPT=0
:wait_worker
set /a WORKER_ATTEMPT+=1
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T automation-worker node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >nul 2>&1
if not errorlevel 1 goto :worker_ready
if !WORKER_ATTEMPT! GEQ 40 (
    docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 150 automation-worker
    set "FATAL_MESSAGE=Worker health endpoint nao respondeu."
    exit /b 1
)
timeout /t 3 /nobreak >nul
goto :wait_worker

:worker_ready
echo Worker health OK.

set /a KEYCLOAK_ATTEMPT=0
:wait_keycloak
set /a KEYCLOAK_ATTEMPT+=1
docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" exec -T frontend wget -qO- http://keycloak:8080/auth/realms/contabilidade/.well-known/openid-configuration >nul 2>&1
if not errorlevel 1 goto :keycloak_ready
if !KEYCLOAK_ATTEMPT! GEQ 60 (
    docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 150 keycloak
    set "FATAL_MESSAGE=Keycloak realm nao respondeu."
    exit /b 1
)
timeout /t 3 /nobreak >nul
goto :wait_keycloak

:keycloak_ready
echo Keycloak realm OK.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$deadline=(Get-Date).AddSeconds(120); " ^
  "do { try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 'http://localhost:8088/healthz'; if($r.StatusCode -eq 200){exit 0} } catch {}; Start-Sleep -Seconds 3 } while((Get-Date) -lt $deadline); exit 1"

if errorlevel 1 (
    docker compose --env-file "%ENV_FILE%" -f "%COMPOSE_BASE%" -f "%COMPOSE_MODE%" -f "%COMPOSE_OVERRIDE%" logs --no-color --tail 150 frontend
    set "FATAL_MESSAGE=Frontend healthz nao respondeu."
    exit /b 1
)

echo Frontend healthz OK.
exit /b 0


:fatal
echo.
echo ============================================================
echo ERROR
echo ============================================================
if defined FATAL_MESSAGE (
    echo %FATAL_MESSAGE%
) else (
    echo Unexpected error.
)
echo.
echo Este BAT e uma adaptacao direta do BAT funcional do PRIMA:
echo - JAVA_HOME e definido diretamente.
echo - java -version roda diretamente no CMD.
echo - Maven roda no Windows.
echo - npm roda no Windows.
echo - Docker recebe artefatos prontos.
echo - Docker nao baixa dependencias Maven/npm durante o build.
echo - Containers so sao parados depois que todos os builds passam.
echo.
echo A janela permanecera aberta.
echo Copie o erro acima e envie caso ainda exista alguma falha.
echo.
pause
exit /b 1
