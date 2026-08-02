@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0export-fiscal-platform-wave.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo Export completed successfully.
) else (
  echo Export failed with code %EXIT_CODE%.
)
echo.
pause
exit /b %EXIT_CODE%
