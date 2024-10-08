@echo off
cd /d "%~dp0"  REM Change to the directory where the batch file is located

start /B node settings.js  REM Start the settings server

timeout /t 3 /nobreak > NUL  REM Wait for three seconds to ensure both servers are up

start http://localhost:3001  REM Open the settings page