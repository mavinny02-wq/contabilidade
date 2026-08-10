@echo off
setlocal EnableExtensions
title Contabilidade - Liberar memoria Docker/WSL

echo ============================================================
echo LIBERAR MEMORIA DOCKER / WSL
echo ============================================================
echo.
echo Este utilitario e separado do START para evitar limpeza
echo automatica e perda de cache a cada rebuild.
echo.
echo O VmmemWSL pode manter page cache depois de builds.
echo docker builder prune limpa cache de build nao usado.
echo wsl --shutdown devolve a memoria imediatamente, mas encerra:
echo - Docker Desktop;
echo - todos os containers;
echo - todas as distribuicoes WSL.
echo.

choice /C SN /N /M "Remover cache de build nao usado? [S/N] "
if errorlevel 2 goto :ask_shutdown

docker builder prune --force
echo.

:ask_shutdown
choice /C SN /N /M "Encerrar WSL/Docker agora para devolver memoria? [S/N] "
if errorlevel 2 goto :end

echo.
echo Encerrando WSL em 5 segundos...
timeout /t 5 /nobreak >nul
wsl --shutdown
echo WSL encerrado. Abra o Docker Desktop novamente quando precisar.

:end
echo.
pause
exit /b 0
