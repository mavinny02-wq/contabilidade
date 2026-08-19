@echo off
setlocal EnableExtensions

title Contabilidade - Operacao local

set "ACTION=%~1"
if not defined ACTION set "ACTION=dev"

if /i "%ACTION%"=="dev" goto :run_dev
if /i "%ACTION%"=="local" goto :run_dev
if /i "%ACTION%"=="check" goto :run_check
if /i "%ACTION%"=="verify" goto :run_check
if /i "%ACTION%"=="doctor" goto :run_doctor
if /i "%ACTION%"=="diagnose" goto :run_doctor
if /i "%ACTION%"=="build" goto :run_build
if /i "%ACTION%"=="start" goto :run_start
if /i "%ACTION%"=="up" goto :run_start
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
set "CONTABILIDADE_BUILD_ONLY="
echo ============================================================
echo CONTABILIDADE - DESENVOLVIMENTO: BUILD + START
echo Compila, cria/verifica imagens e inicia PostgreSQL, backend, worker e frontend.
echo Use "start" para subir imagens existentes sem Maven/npm/compilacao.
echo ============================================================
call :runtime_preflight
if not "%RC%"=="0" goto :finish
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-contabilidade-resilient.ps1" -Mode dev
set "RC=%ERRORLEVEL%"
goto :finish

:run_build
set "CONTABILIDADE_BUILD_ONLY=1"
echo ============================================================
echo CONTABILIDADE - BUILD SOMENTE
echo Compila e cria/verifica imagens. Nao inicia nem altera a stack Compose.
echo ============================================================
call :runtime_preflight
if not "%RC%"=="0" goto :finish
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-contabilidade-resilient.ps1" -Mode dev
set "RC=%ERRORLEVEL%"
goto :finish

:run_start
set "CONTABILIDADE_BUILD_ONLY="
echo ============================================================
echo CONTABILIDADE - START SOMENTE
echo Usa imagens existentes. Nao executa Maven, npm, typecheck ou docker build.
echo ============================================================
call :runtime_preflight
if not "%RC%"=="0" goto :finish
call "%~dp0scripts\start-compose-sequential.bat" dev
set "RC=%ERRORLEVEL%"
goto :finish

:run_check
echo ============================================================
echo CONTABILIDADE - CHECK DE COMPILACAO
echo Valida backend, frontend e worker sem iniciar ou alterar Docker Compose.
echo ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\check-contabilidade.ps1"
set "RC=%ERRORLEVEL%"
goto :finish

:run_doctor
echo ============================================================
echo CONTABILIDADE - DOCTOR READ-ONLY
echo Diagnostica toolchain, Docker, Compose e imagens sem build/start/cleanup.
echo ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\doctor-contabilidade.ps1" -Mode dev
set "RC=%ERRORLEVEL%"
goto :finish

:runtime_preflight
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\invoke-startup-runtime-preflight.ps1" -Mode dev
set "RC=%ERRORLEVEL%"
exit /b %RC%

:run_onpremise
set "PULL_ARG="
set "DIGEST_ARG="
for %%A in (%*) do (
  if /i "%%~A"=="pull" set "PULL_ARG=-Pull"
  if /i "%%~A"=="digest" set "DIGEST_ARG=-RequireDigest"
)

echo ============================================================
echo CONTABILIDADE - DEPLOY ON-PREMISE
echo Usa imagens prontas e nao executa Maven, npm ou docker build.
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
echo Build + start de desenvolvimento ^(compatibilidade^):
echo   START_CONTABILIDADE.bat
echo   START_CONTABILIDADE.bat dev
echo.
echo Diagnostico read-only, sem compilacao ou start:
echo   START_CONTABILIDADE.bat doctor
echo.
echo Compilacao e builds de componentes, sem Docker Compose:
echo   START_CONTABILIDADE.bat check
echo.
echo Compilar e criar/verificar imagens, sem iniciar Compose:
echo   START_CONTABILIDADE.bat build
echo.
echo Iniciar imagens existentes, sem Maven/npm/compilacao:
echo   START_CONTABILIDADE.bat start
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
if /i not "%CONTABILIDADE_NONINTERACTIVE%"=="1" pause
exit /b %RC%
