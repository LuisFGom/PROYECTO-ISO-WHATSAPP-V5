#!/usr/bin/env powershell

# Script para capturar logs del backend y guardarlos en un archivo

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 CAPTURANDO LOGS DEL BACKEND" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Crear archivo para logs
$logFile = "$PSScriptRoot\backend-logs-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"

Write-Host "📁 Los logs se guardarán en: $logFile" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "1. El script está esperando mensajes del backend..." -ForegroundColor White
Write-Host "2. Ahora HAZ UNA VIDEOLLAMADA desde el navegador" -ForegroundColor Yellow
Write-Host "3. Cuando la llamada falle, presiona Ctrl+C para parar este script" -ForegroundColor Yellow
Write-Host "4. Los logs se habrán guardado en el archivo" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Iniciar proceso del backend y capturar salida
$process = Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev 2>&1" `
  -NoNewWindow `
  -PassThru `
  -RedirectStandardOutput $logFile `
  -RedirectStandardError $logFile

Write-Host "✅ Backend iniciado. PID: $($process.Id)" -ForegroundColor Green
Write-Host "⏱️  Esperando logs... (presiona Ctrl+C cuando la llamada falle)" -ForegroundColor Cyan

# Esperar a que el usuario presione Ctrl+C
try {
  while (-not $process.HasExited) {
    Start-Sleep -Seconds 1
  }
} catch {
  # Si presionan Ctrl+C
  Write-Host ""
  Write-Host "⏹️  Parando captura..." -ForegroundColor Yellow
}

# Matar el proceso
Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ LOGS CAPTURADOS" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📁 Ubicación: $logFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Mostrando últimas 50 líneas de logs:" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Get-Content $logFile -Tail 50
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "📝 Copia el contenido completo del archivo de logs y comparte para análisis" -ForegroundColor Cyan
