@echo off
setlocal EnableExtensions EnableDelayedExpansion
REM Contabilidade: compilacao local. O Docker recebe somente artefatos preparados.
title Contabilidade - Inicializacao local por artefatos

set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

set "MODE=%~1"
if not defined MODE set "MODE=dev"
if /i not "%MODE%"=="dev" if /i not "%MODE%"=="onpremise" (
  echo Modo invalido: %MODE%. Use dev ou onpremise.
  goto :fatal
)

set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"
set "WORKER_DIR=%PROJECT_DIR%\automation-worker"
set "LOCAL_ROOT=%PROJECT_DIR%\.docker-local\artifact-build"
set "BACKEND_CONTEXT=%LOCAL_ROOT%\backend-context"
set "FRONTEND_CONTEXT=%LOCAL_ROOT%\frontend-context"
set "WORKER_CONTEXT=%LOCAL_ROOT%\worker-context"
set "WORKER_PROD=%LOCAL_ROOT%\worker-production"
set "OVERRIDE=%LOCAL_ROOT%\compose.artifacts.yaml"
set "FATAL_MESSAGE="
set "APP_URL=http://localhost:8088"

call :preflight
if errorlevel 1 goto :fatal

set "BACKEND_IMAGE=contabilidade-backend:%VERSION%"
set "FRONTEND_IMAGE=contabilidade-frontend:%VERSION%"
set "WORKER_IMAGE=contabilidade-automation-worker:%VERSION%"

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
call :verify_images
if errorlevel 1 goto :fatal
call :start_stack
if errorlevel 1 goto :fatal

echo.
echo ============================================================
echo SUCESSO - Contabilidade %VERSION% em modo %MODE%
echo Java: %JAVA_VERSION% em %JAVA_HOME%
echo Node: %NODE_VERSION%
echo Maven e npm foram executados somente na maquina Windows.
echo Imagens: %BACKEND_IMAGE%, %FRONTEND_IMAGE%, %WORKER_IMAGE%
echo Aplicacao: %APP_URL%
echo ============================================================
start "" "%APP_URL%"
pause
exit /b 0

:preflight
echo [1/8] Validando pre-requisitos sem tocar nos containers atuais...
cd /d "%PROJECT_DIR%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Nao foi possivel acessar %PROJECT_DIR%."
  exit /b 1
)

if not exist "VERSION" (
  set "FATAL_MESSAGE=Arquivo VERSION ausente."
  exit /b 1
)
set /p VERSION=<VERSION
if not defined VERSION (
  set "FATAL_MESSAGE=Arquivo VERSION vazio."
  exit /b 1
)

for %%F in (
  "backend\pom.xml"
  "frontend\package.json"
  "automation-worker\package.json"
  "compose.yaml"
  "compose.dev.yaml"
  "compose.onpremise.yaml"
  "frontend\nginx.conf"
  "frontend\docker-entrypoint.d\40-runtime-config.sh"
  "infra\keycloak\realm-contabilidade-dev.json"
  "infra\keycloak\realm-contabilidade.json"
  "scripts\gerar-lockfiles.ps1"
) do (
  if not exist %%F (
    set "FATAL_MESSAGE=Arquivo obrigatorio ausente: %%~F"
    exit /b 1
  )
)

where powershell >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=PowerShell nao encontrado."
  exit /b 1
)
where mvn >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=Maven nao encontrado no PATH."
  exit /b 1
)
where docker >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=Docker CLI nao encontrado."
  exit /b 1
)

call :activate_java21
if errorlevel 1 exit /b 1

call :activate_node22
if errorlevel 1 exit /b 1

for /f "tokens=3" %%V in ('mvn -version 2^>^&1 ^| findstr /b /c:"Java version:"') do set "MAVEN_JAVA_VERSION=%%V"
if not defined MAVEN_JAVA_VERSION (
  set "FATAL_MESSAGE=Nao foi possivel confirmar a JVM usada pelo Maven."
  exit /b 1
)
if not "!MAVEN_JAVA_VERSION:~0,3!"=="21." (
  set "FATAL_MESSAGE=O Maven ainda usa Java !MAVEN_JAVA_VERSION!. JAVA_HOME selecionado: !JAVA_HOME!."
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=Docker Desktop nao esta em execucao."
  exit /b 1
)
docker compose version >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=Plugin Docker Compose nao encontrado."
  exit /b 1
)

if not exist ".env" (
  if /i "%MODE%"=="onpremise" (
    set "FATAL_MESSAGE=.env ausente. Crie-o a partir de .env.example, troque todos os segredos e use KEYCLOAK_REALM_FILE=realm-contabilidade.json."
    exit /b 1
  )
  echo AVISO: criando .env de desenvolvimento a partir de .env.example.
  echo        Troque os valores antes de qualquer uso real.
  copy /y ".env.example" ".env" >nul
  if errorlevel 1 (
    set "FATAL_MESSAGE=Nao foi possivel criar o .env de desenvolvimento."
    exit /b 1
  )
) else (
  echo .env existente preservado sem alteracao.
)

if /i "%MODE%"=="onpremise" (
  findstr /x /c:"KEYCLOAK_REALM_FILE=realm-contabilidade.json" .env >nul
  if errorlevel 1 (
    set "FATAL_MESSAGE=On-premise exige KEYCLOAK_REALM_FILE=realm-contabilidade.json no .env."
    exit /b 1
  )
  findstr /i /c:"altere-esta-senha" /c:"altere-este-token" /c:"altere-este-segredo" .env >nul
  if not errorlevel 1 (
    set "FATAL_MESSAGE=On-premise recusado: .env ainda contem segredos de exemplo."
    exit /b 1
  )
)

call :ensure_lockfiles
if errorlevel 1 exit /b 1

if not exist "%LOCAL_ROOT%" mkdir "%LOCAL_ROOT%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Nao foi possivel criar %LOCAL_ROOT%."
  exit /b 1
)

if /i "%MODE%"=="dev" (
  set "MODE_COMPOSE=%PROJECT_DIR%\compose.dev.yaml"
) else (
  set "MODE_COMPOSE=%PROJECT_DIR%\compose.onpremise.yaml"
)

docker compose --env-file "%PROJECT_DIR%\.env" -f "%PROJECT_DIR%\compose.yaml" -f "!MODE_COMPOSE!" config --quiet
if errorlevel 1 (
  set "FATAL_MESSAGE=Compose base do modo %MODE% invalido."
  exit /b 1
)

echo Java !JAVA_VERSION! selecionado em !JAVA_HOME!.
echo Maven usa Java !MAVEN_JAVA_VERSION!.
echo Node !NODE_VERSION!, versao da aplicacao !VERSION!.
echo Containers atuais ainda nao foram alterados.
exit /b 0

:activate_java21
call :locate_java21

if not defined JAVA21_HOME (
  where winget >nul 2>&1
  if not errorlevel 1 (
    echo.
    echo JDK 21 nao foi encontrado nesta maquina.
    echo O projeto exige JDK 21; o Java 17 atual nao sera removido.
    choice /c SN /n /m "Deseja instalar Eclipse Temurin JDK 21 com winget agora? [S/N] "
    if not errorlevel 2 (
      winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-package-agreements --accept-source-agreements
      if errorlevel 1 (
        set "FATAL_MESSAGE=A instalacao automatica do JDK 21 falhou. Execute manualmente: winget install EclipseAdoptium.Temurin.21.JDK"
        exit /b 1
      )
      call :locate_java21
    )
  )
)

if not defined JAVA21_HOME (
  set "FATAL_MESSAGE=JDK 21 nao encontrado. Instale com: winget install EclipseAdoptium.Temurin.21.JDK. Depois execute o BAT novamente ou defina CONTABILIDADE_JAVA_HOME."
  exit /b 1
)

set "JAVA_HOME=%JAVA21_HOME%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

where javac >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=O caminho encontrado contem Java 21, mas nao contem javac. Instale o JDK 21 completo."
  exit /b 1
)

set "JAVA_VERSION="
for /f "tokens=3" %%V in ('java -version 2^>^&1 ^| findstr /i "version"') do if not defined JAVA_VERSION set "JAVA_VERSION=%%~V"
if not defined JAVA_VERSION (
  set "FATAL_MESSAGE=Nao foi possivel identificar a versao do Java selecionado."
  exit /b 1
)
if not "!JAVA_VERSION:~0,3!"=="21." (
  set "FATAL_MESSAGE=Falha ao ativar Java 21. Versao ativa: !JAVA_VERSION!."
  exit /b 1
)
exit /b 0

:locate_java21
set "JAVA21_HOME="

if defined CONTABILIDADE_JAVA_HOME call :consider_java "%CONTABILIDADE_JAVA_HOME%"
if defined JAVA_HOME call :consider_java "%JAVA_HOME%"

for /f "delims=" %%J in ('where java 2^>nul') do (
  if not defined JAVA21_HOME for %%P in ("%%~dpJ..") do call :consider_java "%%~fP"
)

for /d %%J in (
  "%ProgramFiles%\Eclipse Adoptium\jdk-21*"
  "%ProgramFiles%\Java\jdk-21*"
  "%ProgramFiles%\Microsoft\jdk-21*"
  "%ProgramFiles%\Amazon Corretto\jdk21*"
  "%ProgramFiles%\BellSoft\LibericaJDK-21*"
  "%ProgramFiles%\Zulu\zulu-21*"
  "%LOCALAPPDATA%\Programs\Eclipse Adoptium\jdk-21*"
  "%USERPROFILE%\.jdks\*21*"
  "%ProgramData%\chocolatey\lib\temurin21\tools\jdk-*"
) do (
  if not defined JAVA21_HOME call :consider_java "%%~fJ"
)

if not defined JAVA21_HOME call :consider_java "%USERPROFILE%\scoop\apps\temurin21-jdk\current"
if not defined JAVA21_HOME call :consider_java "%USERPROFILE%\scoop\apps\openjdk21\current"
exit /b 0

:consider_java
if defined JAVA21_HOME exit /b 0
set "JAVA_CANDIDATE=%~1"
if not defined JAVA_CANDIDATE exit /b 0
if not exist "%JAVA_CANDIDATE%\bin\java.exe" exit /b 0
if not exist "%JAVA_CANDIDATE%\bin\javac.exe" exit /b 0

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$java=Join-Path $env:JAVA_CANDIDATE 'bin\java.exe';" ^
  "$line=(& $java -version 2>&1 | Select-Object -First 1);" ^
  "if($line -match 'version \"21(\.|\")'){exit 0}else{exit 1}" >nul 2>&1
if not errorlevel 1 set "JAVA21_HOME=%JAVA_CANDIDATE%"
exit /b 0

:activate_node22
call :locate_node22

if not defined NODE22_HOME (
  where winget >nul 2>&1
  if not errorlevel 1 (
    echo.
    echo Node.js 22.12 ou superior nao foi encontrado.
    choice /c SN /n /m "Deseja instalar a versao LTS do Node.js com winget agora? [S/N] "
    if not errorlevel 2 (
      winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
      if errorlevel 1 (
        set "FATAL_MESSAGE=A instalacao automatica do Node.js LTS falhou. Execute manualmente: winget install -e --id OpenJS.NodeJS.LTS"
        exit /b 1
      )
      call :locate_node22
    )
  )
)

if not defined NODE22_HOME (
  set "FATAL_MESSAGE=Node.js 22.12 ou superior nao encontrado. Instale com: winget install -e --id OpenJS.NodeJS.LTS. Depois execute o BAT novamente ou defina CONTABILIDADE_NODE_HOME."
  exit /b 1
)

set "PATH=%NODE22_HOME%;%PATH%"
set "NODE_VERSION="
for /f "delims=" %%V in ('node -p "process.versions.node"') do set "NODE_VERSION=%%V"
if not defined NODE_VERSION (
  set "FATAL_MESSAGE=Nao foi possivel identificar a versao do Node.js."
  exit /b 1
)

powershell -NoProfile -Command "if([version]'!NODE_VERSION!' -ge [version]'22.12.0'){exit 0}else{exit 1}" >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=Node 22.12 ou superior obrigatorio; detectado !NODE_VERSION!."
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  set "FATAL_MESSAGE=npm nao encontrado junto ao Node.js selecionado."
  exit /b 1
)
exit /b 0

:locate_node22
set "NODE22_HOME="

if defined CONTABILIDADE_NODE_HOME call :consider_node "%CONTABILIDADE_NODE_HOME%"
if defined NVM_SYMLINK call :consider_node "%NVM_SYMLINK%"

for /f "delims=" %%N in ('where node 2^>nul') do (
  if not defined NODE22_HOME call :consider_node "%%~dpN"
)

for /d %%N in (
  "%APPDATA%\nvm\v22.*"
  "%APPDATA%\nvm\v23.*"
  "%APPDATA%\nvm\v24.*"
  "%LOCALAPPDATA%\nvm\v22.*"
  "%LOCALAPPDATA%\nvm\v23.*"
  "%LOCALAPPDATA%\nvm\v24.*"
  "%USERPROFILE%\scoop\apps\nodejs22\*"
  "%USERPROFILE%\scoop\apps\nodejs-lts\*"
) do (
  if not defined NODE22_HOME call :consider_node "%%~fN"
)

if not defined NODE22_HOME call :consider_node "%ProgramFiles%\nodejs"
exit /b 0

:consider_node
if defined NODE22_HOME exit /b 0
set "NODE_CANDIDATE=%~1"
if not defined NODE_CANDIDATE exit /b 0
if not exist "%NODE_CANDIDATE%\node.exe" exit /b 0
if not exist "%NODE_CANDIDATE%\npm.cmd" exit /b 0

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$node=Join-Path $env:NODE_CANDIDATE 'node.exe';" ^
  "$version=& $node -p 'process.versions.node';" ^
  "if([version]$version -ge [version]'22.12.0'){exit 0}else{exit 1}" >nul 2>&1
if not errorlevel 1 set "NODE22_HOME=%NODE_CANDIDATE%"
exit /b 0

:ensure_lockfiles
if exist "frontend\package-lock.json" if exist "automation-worker\package-lock.json" exit /b 0

if /i "%MODE%"=="onpremise" (
  set "FATAL_MESSAGE=Lockfiles ausentes. Em on-premise gere e revise primeiro: powershell -ExecutionPolicy Bypass -File scripts\gerar-lockfiles.ps1"
  exit /b 1
)

echo.
echo AVISO: package-lock.json esta ausente no frontend ou no worker.
echo O modo dev pode gerar os lockfiles usando as versoes exatas do package.json.
choice /c SN /n /m "Deseja gerar os lockfiles agora? [S/N] "
if errorlevel 2 (
  set "FATAL_MESSAGE=Lockfiles nao gerados. Execute manualmente scripts\gerar-lockfiles.ps1."
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_DIR%\scripts\gerar-lockfiles.ps1"
if errorlevel 1 (
  set "FATAL_MESSAGE=Falha ao gerar os lockfiles."
  exit /b 1
)

if not exist "frontend\package-lock.json" (
  set "FATAL_MESSAGE=frontend\package-lock.json nao foi gerado."
  exit /b 1
)
if not exist "automation-worker\package-lock.json" (
  set "FATAL_MESSAGE=automation-worker\package-lock.json nao foi gerado."
  exit /b 1
)
echo Lockfiles gerados. Eles aparecerao no git status e devem ser revisados/commitados.
exit /b 0

:deps_hash
for /f "delims=" %%H in ('powershell -NoProfile -Command "$p=@('%~1\package.json','%~1\package-lock.json');($p|%%{(Get-FileHash -Algorithm SHA256 -LiteralPath $_).Hash}) -join '|'"') do set "CURRENT_HASH=%%H"
set "CACHED_HASH="
if exist "%~2" set /p CACHED_HASH=<"%~2"
exit /b 0

:install_locked
call :deps_hash "%~1" "%~2"
if not exist "%~1\node_modules" goto :do_npm_ci
if /i not "!CURRENT_HASH!"=="!CACHED_HASH!" goto :do_npm_ci
echo Reutilizando node_modules verificado por hashes em %~1.
exit /b 0

:do_npm_ci
cd /d "%~1"
call npm ci --no-audit --no-fund
if errorlevel 1 (
  set "FATAL_MESSAGE=npm ci falhou em %~1."
  exit /b 1
)
>"%~2" echo !CURRENT_HASH!
exit /b 0

:build_backend
echo [2/8] Compilando backend localmente...
cd /d "%BACKEND_DIR%"
call mvn -B -DskipTests clean package
if errorlevel 1 (
  set "FATAL_MESSAGE=Build Maven local falhou. Confirme acesso ao Maven Central/proxy corporativo e revise o log acima."
  exit /b 1
)

powershell -NoProfile -Command "$ErrorActionPreference='Stop';$j=Get-ChildItem target\*.jar|?{$_.Name -notmatch '^(original-|.*-(sources|javadoc)\.jar$)'}|Sort Length -Descending|Select -First 1;if(!$j){throw 'JAR executavel nao encontrado'};Copy-Item $j.FullName target\contabilidade-backend.jar -Force"
if errorlevel 1 (
  set "FATAL_MESSAGE=Nao foi possivel selecionar o JAR executavel."
  exit /b 1
)
exit /b 0

:build_frontend
echo [3/8] Compilando frontend localmente...
call :install_locked "%FRONTEND_DIR%" "%LOCAL_ROOT%\frontend-deps.sha256"
if errorlevel 1 exit /b 1

cd /d "%FRONTEND_DIR%"
call npm run locale:validate
if errorlevel 1 (
  set "FATAL_MESSAGE=Validacao i18n falhou."
  exit /b 1
)
call npm run typecheck
if errorlevel 1 (
  set "FATAL_MESSAGE=Typecheck do frontend falhou."
  exit /b 1
)
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
echo [4/8] Compilando worker localmente...
call :install_locked "%WORKER_DIR%" "%LOCAL_ROOT%\worker-deps.sha256"
if errorlevel 1 exit /b 1

cd /d "%WORKER_DIR%"
call npm run typecheck
if errorlevel 1 (
  set "FATAL_MESSAGE=Typecheck do worker falhou."
  exit /b 1
)
call npm run build
if errorlevel 1 (
  set "FATAL_MESSAGE=Build do worker falhou."
  exit /b 1
)
if not exist "dist\index.js" (
  set "FATAL_MESSAGE=dist do worker nao foi gerado."
  exit /b 1
)

REM As dependencias atuais sao JavaScript. Prepara uma arvore de producao separada, sem segredos.
if exist "%WORKER_PROD%" rd /s /q "%WORKER_PROD%"
mkdir "%WORKER_PROD%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Nao foi possivel criar %WORKER_PROD%."
  exit /b 1
)
copy /y "package.json" "%WORKER_PROD%\package.json" >nul
copy /y "package-lock.json" "%WORKER_PROD%\package-lock.json" >nul
call npm ci --prefix "%WORKER_PROD%" --omit=dev --ignore-scripts --no-audit --no-fund
if errorlevel 1 (
  set "FATAL_MESSAGE=Preparacao isolada das dependencias de producao do worker falhou."
  exit /b 1
)
exit /b 0

:prepare_contexts
echo [5/8] Preparando contextos runtime isolados...
for %%D in ("%BACKEND_CONTEXT%" "%FRONTEND_CONTEXT%" "%WORKER_CONTEXT%") do if exist %%D rd /s /q %%D

mkdir "%BACKEND_CONTEXT%"
mkdir "%FRONTEND_CONTEXT%\dist"
mkdir "%FRONTEND_CONTEXT%\docker-entrypoint.d"
mkdir "%WORKER_CONTEXT%\dist"
if errorlevel 1 (
  set "FATAL_MESSAGE=Nao foi possivel preparar os contextos Docker locais."
  exit /b 1
)

copy /y "%BACKEND_DIR%\target\contabilidade-backend.jar" "%BACKEND_CONTEXT%\contabilidade-backend.jar" >nul
if errorlevel 1 exit /b 1
xcopy /e /i /y "%FRONTEND_DIR%\dist" "%FRONTEND_CONTEXT%\dist" >nul
if errorlevel 1 exit /b 1
copy /y "%FRONTEND_DIR%\nginx.conf" "%FRONTEND_CONTEXT%\nginx.conf" >nul
if errorlevel 1 exit /b 1
copy /y "%FRONTEND_DIR%\docker-entrypoint.d\40-runtime-config.sh" "%FRONTEND_CONTEXT%\docker-entrypoint.d\40-runtime-config.sh" >nul
if errorlevel 1 exit /b 1
xcopy /e /i /y "%WORKER_DIR%\dist" "%WORKER_CONTEXT%\dist" >nul
if errorlevel 1 exit /b 1
xcopy /e /i /y "%WORKER_PROD%\node_modules" "%WORKER_CONTEXT%\node_modules" >nul
if errorlevel 1 exit /b 1
copy /y "%WORKER_DIR%\package.json" "%WORKER_CONTEXT%\package.json" >nul
if errorlevel 1 exit /b 1

(
  echo FROM eclipse-temurin:21-jre
  echo LABEL contabilidade.local.artifact-only="true"
  echo RUN apt-get update ^&^& apt-get install -y --no-install-recommends curl ^&^& rm -rf /var/lib/apt/lists/*
  echo WORKDIR /app
  echo COPY contabilidade-backend.jar /app/contabilidade-backend.jar
  echo EXPOSE 8080
  echo ENTRYPOINT ["java","-jar","/app/contabilidade-backend.jar"]
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
  echo COPY --chown=pwuser:pwuser package.json ./
  echo COPY --chown=pwuser:pwuser dist ./dist
  echo COPY --chown=pwuser:pwuser node_modules ./node_modules
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
  echo   frontend:
  echo     image: %FRONTEND_IMAGE%
  echo     build: null
  echo   automation-worker:
  echo     image: %WORKER_IMAGE%
  echo     build: null
)>"%OVERRIDE%"

docker compose --env-file "%PROJECT_DIR%\.env" -f "%PROJECT_DIR%\compose.yaml" -f "%MODE_COMPOSE%" -f "%OVERRIDE%" config --quiet
if errorlevel 1 (
  set "FATAL_MESSAGE=Override Compose gerado e invalido."
  exit /b 1
)
exit /b 0

:build_one
set "BUILD_LOG=%LOCAL_ROOT%\%~1-image-build.log"
docker build --progress=plain -t "%~2" "%~3" >"!BUILD_LOG!" 2>&1
set "BUILD_RC=!ERRORLEVEL!"
type "!BUILD_LOG!"
if "!BUILD_RC!"=="0" exit /b 0

findstr /i /l /c:"failed to prepare extraction snapshot" /c:"parent snapshot" /c:"snapshot not found" "!BUILD_LOG!" >nul
if errorlevel 1 exit /b !BUILD_RC!

echo AVISO: corrupcao especifica do cache de snapshot detectada.
echo Uma unica limpeza do cache do builder e nova tentativa serao feitas.
docker builder prune --force
if errorlevel 1 exit /b 1
docker build --progress=plain -t "%~2" "%~3"
exit /b !ERRORLEVEL!

:build_images
echo [6/8] Construindo imagens runtime sem Maven ou npm no Docker...
call :build_one backend "%BACKEND_IMAGE%" "%BACKEND_CONTEXT%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Imagem runtime do backend falhou."
  exit /b 1
)
call :build_one frontend "%FRONTEND_IMAGE%" "%FRONTEND_CONTEXT%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Imagem runtime do frontend falhou."
  exit /b 1
)
call :build_one worker "%WORKER_IMAGE%" "%WORKER_CONTEXT%"
if errorlevel 1 (
  set "FATAL_MESSAGE=Imagem runtime do worker falhou."
  exit /b 1
)
exit /b 0

:verify_images
echo [7/8] Verificando conteudo, entrypoints e rotulos...
for %%I in ("%BACKEND_IMAGE%" "%FRONTEND_IMAGE%" "%WORKER_IMAGE%") do (
  set "IMAGE_LABEL="
  for /f "delims=" %%L in ('docker image inspect %%I --format "{{ index .Config.Labels \"contabilidade.local.artifact-only\" }}"') do set "IMAGE_LABEL=%%L"
  if /i not "!IMAGE_LABEL!"=="true" (
    set "FATAL_MESSAGE=Rotulo artifact-only ausente em %%~I."
    exit /b 1
  )
)

docker run --rm --entrypoint /bin/sh "%BACKEND_IMAGE%" -c "test -f /app/contabilidade-backend.jar && test ! -f /app/pom.xml"
if errorlevel 1 exit /b 1
docker run --rm --entrypoint /bin/sh "%FRONTEND_IMAGE%" -c "test -f /usr/share/nginx/html/index.html && test -f /docker-entrypoint.d/40-runtime-config.sh && test ! -d /usr/share/nginx/html/src"
if errorlevel 1 exit /b 1
docker run --rm "%FRONTEND_IMAGE%" nginx -t
if errorlevel 1 exit /b 1
docker run --rm --entrypoint /bin/sh "%WORKER_IMAGE%" -c "test -f /app/dist/index.js && test -d /app/node_modules/playwright && test ! -d /app/src && test ! -f /app/tsconfig.json"
if errorlevel 1 exit /b 1
exit /b 0

:start_stack
echo [8/8] Todos os builds passaram. Reiniciando a pilha selecionada sem reconstruir imagens...
set "DC=docker compose --env-file ^"%PROJECT_DIR%\.env^" -f ^"%PROJECT_DIR%\compose.yaml^" -f ^"%MODE_COMPOSE%^" -f ^"%OVERRIDE%^""

%DC% down
if errorlevel 1 (
  set "FATAL_MESSAGE=Nao foi possivel parar a pilha selecionada."
  exit /b 1
)

%DC% up --no-build -d
if errorlevel 1 (
  set "FATAL_MESSAGE=Falha ao iniciar a pilha."
  %DC% logs --no-color --tail 120
  exit /b 1
)

for /l %%N in (1,1,36) do (
  timeout /t 5 /nobreak >nul
  set "READY=1"
  for %%S in (postgres keycloak backend automation-worker frontend) do (
    %DC% ps --status running %%S | findstr /i "%%S" >nul
    if errorlevel 1 set "READY=0"
  )
  if "!READY!"=="1" goto :health
)

%DC% logs --no-color --tail 120 postgres keycloak backend automation-worker frontend
set "FATAL_MESSAGE=Tempo esgotado aguardando os cinco servicos em execucao."
exit /b 1

:health
%DC% exec -T frontend nginx -t
if errorlevel 1 (
  set "FATAL_MESSAGE=nginx -t falhou."
  %DC% logs --tail 120 frontend
  exit /b 1
)

%DC% exec -T backend sh -c "curl -fsS http://localhost:8080/actuator/health/readiness"
if errorlevel 1 (
  set "FATAL_MESSAGE=Readiness do backend falhou."
  %DC% logs --tail 120 backend
  exit /b 1
)

%DC% exec -T automation-worker node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
if errorlevel 1 (
  set "FATAL_MESSAGE=Health do worker falhou."
  %DC% logs --tail 120 automation-worker
  exit /b 1
)

powershell -NoProfile -Command "$ErrorActionPreference='Stop';(Invoke-WebRequest -UseBasicParsing http://localhost:8088/healthz).StatusCode" >nul
if errorlevel 1 (
  set "FATAL_MESSAGE=Health do frontend falhou."
  %DC% logs --tail 120 frontend
  exit /b 1
)

%DC% ps
exit /b 0

:fatal
echo.
echo ============================================================
echo FALHA
if defined FATAL_MESSAGE echo %FATAL_MESSAGE%
echo Nenhum fluxo fiscal externo ou pago foi executado por este arquivo.
echo Containers existentes so sao parados depois de todos os artefatos e imagens passarem.
echo ============================================================
pause
exit /b 1
