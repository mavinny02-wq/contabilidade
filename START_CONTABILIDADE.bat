@echo off
setlocal EnableExtensions

title Contabilidade - Inicializacao unica

set "ACTION=%~1"
if not defined ACTION set "ACTION=dev"

if /i "%ACTION%"=="dev" goto :run_dev
if /i "%ACTION%"=="local" goto :run_dev
if /i "%ACTION%"=="onpremise" goto :run_onpremise
if /i "%ACTION%"=="prod" goto :run_onpremise
if /i "%ACTION%"=="deploy" goto :run_onpremise
if /i "%ACTION%"=="memoria" goto :run_memory
if /i "%ACTION%"=="memory" goto :run_memory
if /i "%ACTION%"=="help" goto :usage
if /i "%ACTION%"=="--help" goto :usage
if /i "%ACTION%"=="-h" goto :usage

echo Acao desconhecida: %ACTION%
set "RC=2"
goto :usage_and_finish

:run_dev
echo ============================================================
echo CONTABILIDADE - MODO DESENVOLVIMENTO
echo Um unico comando compilara e iniciara somente os servicos necessarios.
echo Keycloak nao sera iniciado porque a autenticacao esta desabilitada no modo dev.
echo ============================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\invoke-startup-runtime-preflight.ps1" -Mode dev
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :finish

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-contabilidade-resilient.ps1" -Mode dev
set "RC=%ERRORLEVEL%"
goto :finish

:run_onpremise
set "PULL_ARG="
set "DIGEST_ARG="
for %%A in (%*) do (
  if /i "%%~A"=="pull" set "PULL_ARG=-Pull"
  if /i "%%~A"=="digest" set "DIGEST_ARG=-RequireDigest"
)

echo ============================================================
echo CONTABILIDADE - DEPLOY ON-PREMISE
echo Este modo usa imagens prontas e nao executa Maven, npm ou docker build.
echo ============================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-contabilidade-onpremise.ps1" %PULL_ARG% %DIGEST_ARG%
set "RC=%ERRORLEVEL%"
goto :finish

:run_memory
call "%~dp0scripts\maintenance\liberar-memoria-docker.bat"
set "RC=%ERRORLEVEL%"
goto :finish

:usage
echo ============================================================
echo CONTABILIDADE - UNICO BAT OFICIAL
echo ============================================================
echo.
echo Duplo clique ou sem argumentos:
echo   START_CONTABILIDADE.bat
echo   Compila e inicia o ambiente de desenvolvimento.
echo.
echo Desenvolvimento explicito:
echo   START_CONTABILIDADE.bat dev
echo.
echo Producao on-premise com imagens publicadas:
echo   START_CONTABILIDADE.bat onpremise pull digest
echo.
echo Utilitario manual de memoria Docker/WSL:
echo   START_CONTABILIDADE.bat memoria
echo.
echo Ajuda:
echo   START_CONTABILIDADE.bat help
set "RC=0"
goto :finish

:usage_and_finish
echo.
echo Use:
echo   START_CONTABILIDADE.bat help
goto :finish

:finish
echo.
if "%RC%"=="0" (
  echo ============================================================
  echo START_CONTABILIDADE finalizado com sucesso.
  echo ============================================================
) else (
  echo ============================================================
  echo START_CONTABILIDADE terminou com erro %RC%.
  echo O erro e o caminho do log estao acima.
  echo ============================================================
)

echo.
pause
exit /b %RC%
