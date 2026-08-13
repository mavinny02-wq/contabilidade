@echo off
setlocal EnableExtensions

echo ============================================================
echo CONTABILIDADE - LIBERAR MEMORIA DOCKER / WSL
echo ============================================================
echo.
echo Este utilitario nunca e executado automaticamente pelo startup.
echo Ele existe apenas para manutencao manual e pode encerrar containers.
echo.

choice /C SN /N /M "Remover cache de build nao usado? [S/N] "
if errorlevel 2 goto :ask_shutdown

docker builder prune --force
if errorlevel 1 exit /b 1
echo.

:ask_shutdown
choice /C SN /N /M "Encerrar WSL/Docker agora para devolver memoria? [S/N] "
if errorlevel 2 goto :end

echo.
echo Encerrando WSL em 5 segundos...
timeout /t 5 /nobreak >nul
wsl --shutdown
if errorlevel 1 exit /b 1
echo WSL encerrado. Abra o Docker Desktop novamente quando precisar.

:end
echo.
exit /b 0
