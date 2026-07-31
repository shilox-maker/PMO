# ==============================================================================
# Restauracion Interactiva de Base de Datos - PMO Control Tower
# Muestra el listado de backups y permite seleccionar la version a restaurar.
# Uso: .\restoreDB.ps1
# O directo: .\restoreDB.ps1 -BackupFile backup_dbo_2026-07-30T14-58-41.json
# ==============================================================================

[CmdletBinding()]
param (
    [string]$BackupFile
)

# Determinar directorio backend
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BackendDir = Join-Path (Split-Path -Parent $ScriptDir) "backend"

if (-not (Test-Path $BackendDir)) {
    if (Test-Path "C:\Apps\PMO\pre\backend") {
        $BackendDir = "C:\Apps\PMO\pre\backend"
    } elseif (Test-Path "C:\Apps\PMO\pro\backend") {
        $BackendDir = "C:\Apps\PMO\pro\backend"
    }
}

if (-not (Test-Path $BackendDir)) {
    Write-Host "❌ Error: No se encontro el directorio del backend ($BackendDir)" -ForegroundColor Red
    exit 1
}

Push-Location $BackendDir

try {
    if ($BackupFile) {
        Write-Host "Ejecutando restauracion del fichero: $BackupFile..." -ForegroundColor Yellow
        node utils/backup.js restore $BackupFile
    } else {
        node utils/restore-interactive.js
    }
} finally {
    Pop-Location
}
