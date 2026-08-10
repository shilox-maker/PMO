# ==============================================================================
# Script de Preparacion y Empaquetado para Azure App Service
# Genera un archivo ZIP limpio solo con lo necesario para produccion.
# Uso: .\scripts\build-azure-zip.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"
$ROOT_DIR = Get-Item "$PSScriptRoot\.." | Select-Object -ExpandProperty FullName
$STAGING_DIR = Join-Path $ROOT_DIR "dist-azure-staging"
$OUTPUT_ZIP = Join-Path $ROOT_DIR "pmo-azure-deploy.zip"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Preparando empaquetado para Azure App Service   " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Compilar Frontend
# ------------------------------------------------------------------------------
Write-Host "`n[1/4] Compilando Frontend (VITE_API_URL=/api npm run build)..." -ForegroundColor Yellow
Push-Location "$ROOT_DIR\frontend"
try {
    $env:VITE_API_URL = "/api"
    npm run build
} finally {
    Pop-Location
}

if (-not (Test-Path "$ROOT_DIR\frontend\dist")) {
    throw "Error: No se encontro la carpeta 'frontend/dist'. Revisa los errores de compilacion."
}
Write-Host "  Frontend compilado correctamente." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 2. Crear Directorio Temporal de Staging
# ------------------------------------------------------------------------------
Write-Host "`n[2/4] Preparando estructura limpia de archivos..." -ForegroundColor Yellow

if (Test-Path $STAGING_DIR) { Remove-Item $STAGING_DIR -Recurse -Force }
if (Test-Path $OUTPUT_ZIP) { Remove-Item $OUTPUT_ZIP -Force }

New-Item -ItemType Directory -Path $STAGING_DIR | Out-Null

# Copiar contenido de Backend a la raíz de staging (para que Oryx detecte package.json)
Get-ChildItem -Path "$ROOT_DIR\backend" -Exclude "node_modules", ".env", "*.db", "tests", "docs", "*.log" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $STAGING_DIR -Recurse -Force
}

# Copiar el Frontend compilado (dist)
New-Item -ItemType Directory -Path "$STAGING_DIR\frontend" | Out-Null
Copy-Item -Path "$ROOT_DIR\frontend\dist" -Destination "$STAGING_DIR\frontend\dist" -Recurse -Force

Write-Host "  Estructura limpia generada en staging." -ForegroundColor Green

# Usar .NET ZipArchive para garantizar separadores de ruta POSIX '/' compatibles con Linux
Add-Type -Assembly "System.IO.Compression.FileSystem"
Add-Type -Assembly "System.IO.Compression"

$zip = [System.IO.Compression.ZipFile]::Open($OUTPUT_ZIP, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $files = Get-ChildItem -Path $STAGING_DIR -Recurse -File
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($STAGING_DIR.Length + 1).Replace("\", "/")
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
    }
} finally {
    $zip.Dispose()
}

$zipSize = (Get-Item $OUTPUT_ZIP).Length / 1MB
Write-Host ("  ZIP creado con exito (rutas POSIX Linux): {0:N2} MB" -f $zipSize) -ForegroundColor Green

# ------------------------------------------------------------------------------
# 4. Limpieza de Staging
# ------------------------------------------------------------------------------
Write-Host "`n[4/4] Limpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item $STAGING_DIR -Recurse -Force
Write-Host "  Limpieza completada." -ForegroundColor Green

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " ¡LISTO PARA DESPLEGAR!                           " -ForegroundColor Green
Write-Host " Archivo generado: pmo-azure-deploy.zip          " -ForegroundColor White
Write-Host " Puedes subir este ZIP directamente a Kudu o con: " -ForegroundColor White
Write-Host " az webapp deploy --name <TU-APP> --src-path pmo-azure-deploy.zip --type zip" -ForegroundColor DarkYellow
Write-Host "==================================================" -ForegroundColor Cyan
