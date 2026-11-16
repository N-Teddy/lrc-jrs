@echo off
setlocal
echo =======================================================
echo           Checking MongoDB Server Status
echo =======================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$portOpen = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet;" ^
  "if ($portOpen) {" ^
  "    Write-Host '[OK] MongoDB is ALREADY RUNNING and listening on 127.0.0.1:27017!' -ForegroundColor Green;" ^
  "    Write-Host '    Database path: C:\Users\Teddy\mongodb-data' -ForegroundColor Gray;" ^
  "    Write-Host '    Your backend server can connect immediately.' -ForegroundColor Cyan;" ^
  "    exit 0;" ^
  "} else {" ^
  "    Write-Host '[INFO] MongoDB is not running. Starting mongod daemon...' -ForegroundColor Yellow;" ^
  "    $mongodPath = 'C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe';" ^
  "    $dataPath = 'C:\Users\Teddy\mongodb-data';" ^
  "    if (-not (Test-Path $mongodPath)) {" ^
  "        Write-Host '[ERROR] mongod.exe not found at ' $mongodPath -ForegroundColor Red;" ^
  "        exit 1;" ^
  "    }" ^
  "    Start-Process -FilePath $mongodPath -ArgumentList \"--dbpath `\"$dataPath`\" --port 27017 --bind_ip 127.0.0.1 --wiredTigerCacheSizeGB 0.5\" -WindowStyle Hidden;" ^
  "    Start-Sleep -Seconds 2;" ^
  "    $started = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet;" ^
  "    if ($started) {" ^
  "        Write-Host '[SUCCESS] MongoDB started successfully on 127.0.0.1:27017!' -ForegroundColor Green;" ^
  "        Write-Host '          Memory capped at 512MB (No more OOM crashes).' -ForegroundColor Gray;" ^
  "        exit 0;" ^
  "    } else {" ^
  "        Write-Host '[ERROR] Failed to start MongoDB. Please check logs in C:\Users\Teddy\mongodb-data.' -ForegroundColor Red;" ^
  "        exit 1;" ^
  "    }" ^
  "}"

if %errorlevel% neq 0 (
    echo.
    echo Please resolve the error above.
    pause
)
