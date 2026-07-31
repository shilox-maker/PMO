# ==============================================================================
# Generacion Desatendida de Backup de Base de Datos - PMO Control Tower
# Apto para ser ejecutado por el Programador de Tareas de Windows o CLI.
# Uso: .\backupDB.ps1 [-TargetEnv pre|pro]
# ==============================================================================

[CmdletBinding()]
param (
    [ValidateSet("local", "pre", "pro")]
    [string]$TargetEnv = "local"
)

$ErrorActionPreference = "Stop"

# 1. Determinar directorio del backend
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackendDir = Join-Path (Split-Path -Parent $ScriptDir) "backend"

if ($TargetEnv -eq "pre" -and (Test-Path "C:\Apps\PMO\pre\backend")) {
    $BackendDir = "C:\Apps\PMO\pre\backend"
} elseif ($TargetEnv -eq "pro" -and (Test-Path "C:\Apps\PMO\pro\backend")) {
    $BackendDir = "C:\Apps\PMO\pro\backend"
} elseif (-not (Test-Path $BackendDir)) {
    if (Test-Path "C:\Apps\PMO\pro\backend") {
        $BackendDir = "C:\Apps\PMO\pro\backend"
    } elseif (Test-Path "C:\Apps\PMO\pre\backend") {
        $BackendDir = "C:\Apps\PMO\pre\backend"
    }
}

if (-not (Test-Path $BackendDir)) {
    Write-Error "❌ Error: No se encontro el directorio del backend ($BackendDir)"
    exit 1
}

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[$Timestamp] Iniciando Backup Desatendido de BD" -ForegroundColor Cyan
Write-Host "Directorio objetivo: $BackendDir" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

Push-Location $BackendDir

try {
    # 2. Ejecutar exportacion de backup via Node.js
    node utils/backup.js export
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Backup completado exitosamente." -ForegroundColor Green
        exit 0
    } else {
        Write-Error "`n❌ El script de backup retorno un codigo de error: $LASTEXITCODE"
        exit $LASTEXITCODE
    }
} catch {
    Write-Error "`n❌ Error ejecutando el backup desatendido: $_"
    exit 1
} finally {
    Pop-Location
}
