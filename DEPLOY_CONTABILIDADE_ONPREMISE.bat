@echo off
setlocal EnableExtensions

title Contabilidade - Deploy on-premise sem build

set "PULL_ARG="
set "DIGEST_ARG="

for %%A in (%*) do (
  if /i "%%~A"=="pull" set "PULL_ARG=-Pull"
  if /i "%%~A"=="digest" set "DIGEST_ARG=-RequireDigest"
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-contabilidade-onpremise.ps1" %PULL_ARG% %DIGEST_ARG%
set "RC=%ERRORLEVEL%"

echo.
if "%RC%"=="0" (
  echo ============================================================
  echo DEPLOY ON-PREMISE FINALIZADO COM SUCESSO
  echo Nenhuma imagem foi construida neste servidor.
  echo ============================================================
) else (
  echo ============================================================
  echo DEPLOY ON-PREMISE TERMINOU COM ERRO %RC%.
  echo ============================================================
)

echo.
pause
exit /b %RC%
