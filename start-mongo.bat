@echo off
:: Check for admin rights and elevate if necessary
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges to start MongoDB...
    powershell -Command "Start-Process cmd -ArgumentList '/c net start MongoDB & pause' -Verb RunAs"
    exit /b
)

net start MongoDB
pause
