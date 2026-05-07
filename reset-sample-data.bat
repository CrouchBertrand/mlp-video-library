@echo off
setlocal
cd /d "%~dp0"

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd was not found. Please install Node.js for Windows first.
  pause
  exit /b 1
)

echo This will replace the local sample library data with the current MLP sample resources.
echo Admin account and settings are preserved where possible.
choice /C YN /M "Continue"
if errorlevel 2 exit /b 0

call npm.cmd run db:push
call npm.cmd run db:seed
echo Sample data has been reset.
pause
