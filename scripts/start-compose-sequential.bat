@echo off
setlocal EnableExtensions

set "MODE=%~1"
if not defined MODE set "MODE=dev"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-compose-sequential.ps1" -Mode "%MODE%"
exit /b %ERRORLEVEL%
