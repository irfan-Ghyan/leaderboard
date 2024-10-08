@echo off
cd /d "%~dp0"  REM Change to the directory where the batch file is located

REM Check for Node.js processes and terminate them if found
for /f "tokens=2" %%a in ('tasklist ^| findstr /I "node.exe"') do (
    echo Terminating process with PID: %%a
    taskkill /F /PID %%a
)

echo All servers have been stopped.