# ==============================================================================
# Script de Despliegue Interactivo a Azure App Service (PRE / PRO)
# Uso: .\scripts\deploy-azure.ps1 [-Environment PRE|PRO]
# ==============================================================================

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("PRE", "PRO")]
    [string]$Environment
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = Get-Item "$PSScriptRoot\.." | Select-Object -ExpandProperty FullName

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "    DESPLIEGUE INTERACTIVO A AZURE APP SERVICE    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Seleccionar Entorno
# ------------------------------------------------------------------------------
if (-not $Environment) {
    Write-Host "`nSelecciona el entorno de destino:" -ForegroundColor Yellow
    Write-Host "  [1] PRE - Preproducción (prepmo)" -ForegroundColor White
    Write-Host "  [2] PRO - Producción (pmo)" -ForegroundColor White
    $choice = Read-Host "Introduce opción (1 o 2)"
    if ($choice -eq "2") {
        $Environment = "PRO"
    } else {
        $Environment = "PRE"
    }
}

Write-Host "`nSelecciona el método de despliegue:" -ForegroundColor Yellow
Write-Host "  [1] Local - Usar archivos locales (generar ZIP)" -ForegroundColor White
Write-Host "  [2] Git - Sincronizar desde repositorio Git" -ForegroundColor White
$deployMethod = Read-Host "Introduce opción (1 o 2)"
if ($deployMethod -eq "2") {
    Write-Host "`n[Git] Sincronizando repositorio con rama main..." -ForegroundColor Yellow
    git fetch --quiet
    $branch = "origin/main"
    git rev-parse --quiet --verify $branch > $null
    if ($LASTEXITCODE -ne 0) {
        throw "Branch $branch no encontrado."
    }
    git reset --hard $branch
}

# Configuración por entorno extraída de Azure
if ($Environment -eq "PRO") {
    $RG_NAME = "rg-pmo-pro-northeurope-001"
    $APP_NAME = "pmo"
} else {
    $RG_NAME = "rg-pmo-pre-northeurope-001"
    $APP_NAME = "prepmo"
}

Write-Host "`nEntorno seleccionado: [$Environment]" -ForegroundColor Green
Write-Host "  - Grupo de Recursos: $RG_NAME" -ForegroundColor DarkGray
Write-Host "  - App Service:       $APP_NAME" -ForegroundColor DarkGray

# ------------------------------------------------------------------------------
# 2. Generar Paquete ZIP de Despliegue
# ------------------------------------------------------------------------------
Write-Host "`n[Paso 1/3] Generando paquete ZIP limpio..." -ForegroundColor Yellow
$BUILD_SCRIPT = Join-Path $PSScriptRoot "build-azure-zip.ps1"
powershell -ExecutionPolicy Bypass -File $BUILD_SCRIPT

$ZIP_PATH = Join-Path $ROOT_DIR "pmo-azure-deploy.zip"
if (-not (Test-Path $ZIP_PATH)) {
    throw "Error: No se pudo encontrar el archivo $ZIP_PATH."
}

# ------------------------------------------------------------------------------
# 3. Autenticacion Interactiva en Azure CLI
# ------------------------------------------------------------------------------
Write-Host "`n[Paso 2/3] Conectando con Azure (Autenticacion Interactiva)..." -ForegroundColor Yellow
Write-Host "  Se abrira tu navegador para iniciar sesion en Azure..." -ForegroundColor DarkGray

# Comprobar si az cli esta instalado (o anadirlo al PATH si se acaba de instalar)
if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
    $defaultAzPath = "$env:ProgramFiles\Microsoft SDKs\Azure\CLI2\wbin"
    if (Test-Path "$defaultAzPath\az.cmd") {
        $env:Path += ";$defaultAzPath"
    } else {
        throw "Error: Azure CLI ('az') no esta instalado. Instalalo con 'winget install Microsoft.AzureCLI' o desde la web oficial de Azure."
    }
}

# Comprobar si ya existe una sesión previa en Azure CLI
$accountInfo = az account show 2>$null
if (-not $accountInfo) {
    Write-Host "  Iniciando sesión en Azure mediante navegador..." -ForegroundColor Yellow
    az login
} else {
    Write-Host "  Sesión de Azure CLI previa activa detectada." -ForegroundColor Green
}

Write-Host "`n[Paso 3/3] Desplegando $ZIP_PATH en Azure App Service [$APP_NAME]..." -ForegroundColor Yellow

az webapp deploy `
    --resource-group $RG_NAME `
    --name $APP_NAME `
    --src-path $ZIP_PATH `
    --type zip `
    --async true

Write-Host "`n  Despliegue enviado. Esperando a que el sitio arranque..." -ForegroundColor Yellow

$maxWait  = 120   # segundos máximo de espera
$interval = 10    # segundos entre comprobaciones
$elapsed  = 0
$url      = "https://$APP_NAME.azurewebsites.net"

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds $interval
    $elapsed += $interval
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -lt 500) {
            Write-Host "  ✅ Sitio respondiendo (HTTP $($response.StatusCode)) tras ${elapsed}s." -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "  ⏳ Esperando arranque... ($($elapsed)s / $($maxWait)s)" -ForegroundColor DarkGray
    }
}

if ($elapsed -ge $maxWait) {
    Write-Host "  ⚠️  El sitio tardó más de $maxWait s en responder. Verifica en KUDU." -ForegroundColor Yellow
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " ¡DESPLIEGUE A [$Environment] COMPLETADO CON ÉXITO! " -ForegroundColor Green
Write-Host " App URL: $url     " -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
