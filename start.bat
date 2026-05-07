@echo off
setlocal
cd /d "%~dp0"

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd was not found. Please install Node.js for Windows first.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm.cmd install
)

set NEED_SEED=0
if not exist dev.db (
  set NEED_SEED=1
)

echo Checking local database...
call npm.cmd run db:push

if "%NEED_SEED%"=="1" (
  echo Creating local database...
  echo Adding sample MLP content...
  call npm.cmd run db:seed
)

echo Opening MLP Video Library at http://localhost:3000
start "" http://localhost:3000
call npm.cmd run dev
