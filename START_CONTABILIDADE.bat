@echo off
setlocal EnableExtensions

title Contabilidade - Build resiliente e startup sequencial

set "MODE=%~1"
if not defined MODE set "MODE=dev"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-contabilidade-resilient.ps1" -Mode "%MODE%"
set "RC=%ERRORLEVEL%"

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
