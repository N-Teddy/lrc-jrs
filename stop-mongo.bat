@echo off
setlocal
echo =======================================================
echo               Stopping MongoDB Server
echo =======================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$procs = Get-Process -Name 'mongod' -ErrorAction SilentlyContinue;" ^
  "if ($procs) {" ^
  "    $procs | Stop-Process -Force;" ^
  "    Write-Host '[SUCCESS] Stopped MongoDB server process.' -ForegroundColor Green;" ^
  "} else {" ^
  "    Write-Host '[INFO] No running mongod process found.' -ForegroundColor Yellow;" ^
  "}"
