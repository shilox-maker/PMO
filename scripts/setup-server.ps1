# ==============================================================================
# Setup Inicial del Servidor Windows para PMO
# Ejecutar UNA SOLA VEZ como Administrador.
# ==============================================================================

$ErrorActionPreference = "Stop"
$APPS_ROOT = "C:\Apps\PMO"
$REPO_URL = "https://github.com/TU_USUARIO/PMO.git"  # ← CAMBIAR

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Setup Inicial PMO - Windows Server 2022" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Verificar prerequisitos
# ------------------------------------------------------------------------------
Write-Host "`n[1/6] Verificando prerequisitos..." -ForegroundColor Yellow

$nodeOk = $false
$gitOk = $false

try { $v = node -v; Write-Host "  Node.js: $v" -ForegroundColor Green; $nodeOk = $true }
catch { Write-Host "  Node.js: NO INSTALADO" -ForegroundColor Red }

try { $v = git --version; Write-Host "  Git:     $v" -ForegroundColor Green; $gitOk = $true }
catch { Write-Host "  Git:     NO INSTALADO" -ForegroundColor Red }

if (-not $nodeOk -or -not $gitOk) {
    Write-Host "`n  Instala los prerequisitos faltantes:" -ForegroundColor Red
    if (-not $nodeOk) { Write-Host "    Node.js LTS: https://nodejs.org/en/download/" -ForegroundColor Yellow }
    if (-not $gitOk)  { Write-Host "    Git:         https://git-scm.com/download/win" -ForegroundColor Yellow }
    Write-Host "`n  Tras instalar, CIERRA y REABRE PowerShell y ejecuta este script de nuevo." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# 2. Instalar PM2 global
# ------------------------------------------------------------------------------
Write-Host "`n[2/6] Instalando PM2..." -ForegroundColor Yellow

$pm2Exists = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Exists) {
    Write-Host "  PM2 ya instalado: $(pm2 -v)" -ForegroundColor Green
} else {
    npm install -g pm2
    Write-Host "  PM2 instalado correctamente" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 3. Crear estructura de carpetas
# ------------------------------------------------------------------------------
Write-Host "`n[3/6] Creando estructura de carpetas..." -ForegroundColor Yellow

$folders = @("$APPS_ROOT\pre", "$APPS_ROOT\pro", "$APPS_ROOT\scripts", "$APPS_ROOT\iis\pre", "$APPS_ROOT\iis\pro")
foreach ($f in $folders) {
    if (-not (Test-Path $f)) {
        New-Item -ItemType Directory -Path $f -Force | Out-Null
        Write-Host "  Creado: $f" -ForegroundColor Green
    } else {
        Write-Host "  Ya existe: $f" -ForegroundColor DarkGray
    }
}

# ------------------------------------------------------------------------------
# 4. Clonar repositorio en PRE y PRO
# ------------------------------------------------------------------------------
Write-Host "`n[4/6] Clonando repositorio..." -ForegroundColor Yellow

if (-not (Test-Path "$APPS_ROOT\pre\.git")) {
    git clone -b develop $REPO_URL "$APPS_ROOT\pre"
    Write-Host "  PRE clonado (rama develop)" -ForegroundColor Green
} else {
    Write-Host "  PRE ya clonado, saltando" -ForegroundColor DarkGray
}

if (-not (Test-Path "$APPS_ROOT\pro\.git")) {
    git clone -b main $REPO_URL "$APPS_ROOT\pro"
    Write-Host "  PRO clonado (rama main)" -ForegroundColor Green
} else {
    Write-Host "  PRO ya clonado, saltando" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# 5. Instalar dependencias iniciales
# ------------------------------------------------------------------------------
Write-Host "`n[5/6] Instalando dependencias npm..." -ForegroundColor Yellow

foreach ($env in @("pre", "pro")) {
    Write-Host "  [$env] Backend..." -ForegroundColor DarkCyan
    Push-Location "$APPS_ROOT\$env\backend"
    npm install --omit=dev
    Pop-Location

    Write-Host "  [$env] Frontend..." -ForegroundColor DarkCyan
    Push-Location "$APPS_ROOT\$env\frontend"
    npm install
    Pop-Location
}

# ------------------------------------------------------------------------------
# 6. Crear plantillas .env
# ------------------------------------------------------------------------------
Write-Host "`n[6/6] Creando plantillas .env..." -ForegroundColor Yellow

$backendEnvPre = @"
NODE_ENV=production
DB_DIALECT=mssql
DB_HOST=tu-servidor.database.windows.net
DB_PORT=1433
DB_NAME=nombre_bd
DB_USER=pmo_pre_user
DB_PASSWORD=CAMBIAR_PASSWORD_PRE
DB_SCHEMA=PREPMO
PORT=5000
JWT_SECRET=$(New-Guid)
FRONTEND_URL=https://prepmo.dacsa.com
"@

$backendEnvPro = @"
NODE_ENV=production
DB_DIALECT=mssql
DB_HOST=tu-servidor.database.windows.net
DB_PORT=1433
DB_NAME=nombre_bd
DB_USER=pmo_pro_user
DB_PASSWORD=CAMBIAR_PASSWORD_PRO
DB_SCHEMA=PROPMO
PORT=5100
JWT_SECRET=$(New-Guid)
FRONTEND_URL=https://pmo.dacsa.com
"@

$frontendEnv = "VITE_API_URL=/api"

# Solo crear si no existen (no sobrescribir credenciales)
$envFiles = @{
    "$APPS_ROOT\pre\backend\.env"  = $backendEnvPre
    "$APPS_ROOT\pro\backend\.env"  = $backendEnvPro
    "$APPS_ROOT\pre\frontend\.env" = $frontendEnv
    "$APPS_ROOT\pro\frontend\.env" = $frontendEnv
}

foreach ($path in $envFiles.Keys) {
    if (-not (Test-Path $path)) {
        $envFiles[$path] | Out-File -FilePath $path -Encoding utf8NoBOM
        Write-Host "  Creado: $path" -ForegroundColor Green
    } else {
        Write-Host "  Ya existe (no sobrescrito): $path" -ForegroundColor DarkGray
    }
}

# ------------------------------------------------------------------------------
# Resumen
# ------------------------------------------------------------------------------
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETADO" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Proximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Edita los .env con las credenciales reales de Azure SQL" -ForegroundColor White
Write-Host "     $APPS_ROOT\pre\backend\.env" -ForegroundColor DarkGray
Write-Host "     $APPS_ROOT\pro\backend\.env" -ForegroundColor DarkGray
Write-Host "  2. Ejecuta setup-iis.ps1 para configurar IIS" -ForegroundColor White
Write-Host "  3. Ejecuta deploy-pre.ps1 para el primer despliegue" -ForegroundColor White
Write-Host ""
