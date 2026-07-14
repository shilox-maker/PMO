# ==============================================================================
# Despliegue con Confirmacion - Entorno PRO (pmo.dacsa.com)
# Descarga rama 'main', compila y reinicia el servicio.
# Requiere confirmacion manual antes de ejecutar.
# Uso: .\deploy-pro.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"
$ENV_NAME = "PRO"
$APP_DIR = "C:\Apps\PMO\pro"
$PM2_NAME = "pmo-pro-backend"
$BRANCH = "main"

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "  DESPLIEGUE PRODUCCION - $ENV_NAME" -ForegroundColor Magenta
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
Write-Host "==================================================" -ForegroundColor Magenta

# ------------------------------------------------------------------------------
# 1. Mostrar que se va a desplegar y pedir confirmacion
# ------------------------------------------------------------------------------
Write-Host "`n[Preflight] Analizando cambios pendientes..." -ForegroundColor Yellow
Push-Location $APP_DIR

$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"

git fetch origin $BRANCH
$localHash = git rev-parse HEAD
$remoteHash = git rev-parse "origin/$BRANCH"

$ErrorActionPreference = $oldPreference

if ($localHash -eq $remoteHash) {
    Write-Host "  No hay cambios nuevos en '$BRANCH'. Nada que desplegar." -ForegroundColor DarkGray
    Pop-Location
    exit 0
}

$commitCount = git rev-list --count "$localHash..$remoteHash"
Write-Host "`n  Commits pendientes de desplegar ($commitCount):" -ForegroundColor White
git log --oneline "$localHash..$remoteHash" | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "  ATENCION: Esto actualizara PRODUCCION (pmo.dacsa.com)" -ForegroundColor Red
$confirm = Read-Host "  Escriba 'DEPLOY' para confirmar"

if ($confirm -ne "DEPLOY") {
    Write-Host "`n  Despliegue cancelado." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

# ------------------------------------------------------------------------------
# 2. Descargar cambios
# ------------------------------------------------------------------------------
Write-Host "`n[1/5] Descargando cambios de '$BRANCH'..." -ForegroundColor Yellow
$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
git reset --hard "origin/$BRANCH"
$ErrorActionPreference = $oldPreference
Write-Host "  $commitCount commits aplicados" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 3. Backend: dependencias + migraciones
# ------------------------------------------------------------------------------
Write-Host "`n[2/5] Actualizando Backend..." -ForegroundColor Yellow
Push-Location "$APP_DIR\backend"

Write-Host "  npm install..." -ForegroundColor DarkCyan
npm install --omit=dev 2>&1 | Out-Null

Write-Host "  Realizando backup de seguridad de la BBDD..." -ForegroundColor DarkCyan
npm run db:backup

Write-Host "  Ejecutando migraciones..." -ForegroundColor DarkCyan
npm run migrate
Write-Host "  Backend actualizado" -ForegroundColor Green

Pop-Location

# ------------------------------------------------------------------------------
# 4. Frontend: dependencias + build
# ------------------------------------------------------------------------------
Write-Host "`n[3/5] Compilando Frontend..." -ForegroundColor Yellow
Push-Location "$APP_DIR\frontend"

"VITE_API_URL=/api" | Out-File -FilePath ".env" -Encoding utf8NoBOM -Force

Write-Host "  npm install..." -ForegroundColor DarkCyan
npm install 2>&1 | Out-Null

Write-Host "  npm run build..." -ForegroundColor DarkCyan
npm run build
Write-Host "  Frontend compilado" -ForegroundColor Green

Pop-Location

# ------------------------------------------------------------------------------
# 5. Reiniciar PM2
# ------------------------------------------------------------------------------
Write-Host "`n[4/5] Reiniciando servicio PM2..." -ForegroundColor Yellow

$pm2List = pm2 jlist 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
$processExists = $pm2List | Where-Object { $_.name -eq $PM2_NAME }

if ($processExists) {
    pm2 restart $PM2_NAME
    Write-Host "  $PM2_NAME reiniciado" -ForegroundColor Green
} else {
    pm2 start "$APP_DIR\backend\server.js" --name $PM2_NAME
    Write-Host "  $PM2_NAME iniciado por primera vez" -ForegroundColor Green
}

pm2 save 2>$null

# ------------------------------------------------------------------------------
# 6. Health check
# ------------------------------------------------------------------------------
Write-Host "`n[5/5] Verificando despliegue..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5100/api/auth/login" `
        -Method POST -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
}

if ($statusCode -or ($response -and $response.StatusCode)) {
    Write-Host "  API respondiendo correctamente" -ForegroundColor Green
} else {
    Write-Host "  AVISO: La API no responde. Revisa: pm2 logs $PM2_NAME" -ForegroundColor Red
}

$distIndex = Test-Path "$APP_DIR\frontend\dist\index.html"
if ($distIndex) {
    Write-Host "  Frontend compilado: OK" -ForegroundColor Green
} else {
    Write-Host "  Frontend: dist/index.html NO encontrado" -ForegroundColor Red
}

Pop-Location

# ------------------------------------------------------------------------------
# Resumen
# ------------------------------------------------------------------------------
Write-Host "`n==================================================" -ForegroundColor Magenta
Write-Host "  PRODUCCION DESPLEGADA" -ForegroundColor Green
Write-Host "  Commit: $(git -C $APP_DIR rev-parse --short HEAD)" -ForegroundColor DarkGray
Write-Host "  URL: https://pmo.dacsa.com" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Magenta

# Notificacion Telegram (opcional)
if ($env:TELEGRAM_BOT_TOKEN -and $env:TELEGRAM_CHAT_ID) {
    $msg = "🚀 *PMO PRO Desplegado*%0ACommit: $(git -C $APP_DIR rev-parse --short HEAD)"
    $uri = "https://api.telegram.org/bot$($env:TELEGRAM_BOT_TOKEN)/sendMessage"
    Invoke-RestMethod -Uri $uri -Method Post -Body @{
        chat_id    = $env:TELEGRAM_CHAT_ID
        text       = $msg
        parse_mode = "Markdown"
    } -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  Notificacion Telegram enviada" -ForegroundColor DarkGray
}
