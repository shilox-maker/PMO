# ==============================================================================
# Despliegue Automatico - Entorno PRE (prepmo.dacsa.com)
# Descarga rama 'develop', compila y reinicia el servicio.
# Uso: .\deploy-pre.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"
$ENV_NAME = "PRE"
$APP_DIR = "C:\Apps\PMO\pre"
$PM2_NAME = "pmo-pre-backend"
$BRANCH = "main"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Despliegue $ENV_NAME - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Obtener ultimos cambios
# ------------------------------------------------------------------------------
Write-Host "`n[1/5] Descargando cambios de '$BRANCH'..." -ForegroundColor Yellow
$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"

Push-Location $APP_DIR
git fetch origin $BRANCH
$localHash = git rev-parse HEAD
git reset --hard "origin/$BRANCH"
$remoteHash = git rev-parse HEAD

$ErrorActionPreference = $oldPreference

if ($localHash -eq $remoteHash) {
    Write-Host "  Sin cambios nuevos. Continuando igualmente..." -ForegroundColor DarkGray
} else {
    $commitCount = git rev-list --count "$localHash..$remoteHash"
    Write-Host "  $commitCount commits nuevos descargados" -ForegroundColor Green
    git log --oneline "$localHash..$remoteHash" | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
}

# ------------------------------------------------------------------------------
# 2. Backend: dependencias + migraciones
# ------------------------------------------------------------------------------
Write-Host "`n[2/5] Actualizando Backend..." -ForegroundColor Yellow
Push-Location "$APP_DIR\backend"

$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"

Write-Host "  npm install..." -ForegroundColor DarkCyan
npm install --omit=dev 2>&1 | Out-Null

Write-Host "  Realizando backup de seguridad de la BBDD..." -ForegroundColor DarkCyan
npm run db:backup

Write-Host "  Ejecutando migraciones..." -ForegroundColor DarkCyan
npm run migrate
Write-Host "  Backend actualizado" -ForegroundColor Green

Pop-Location

# ------------------------------------------------------------------------------
# 3. Frontend: dependencias + build
# ------------------------------------------------------------------------------
Write-Host "`n[3/5] Compilando Frontend..." -ForegroundColor Yellow
Push-Location "$APP_DIR\frontend"

# Asegurar que el .env del frontend apunta a ruta relativa y activa el mock de Azure AD
"VITE_API_URL=/api`nVITE_AZURE_MOCK=true" | Out-File -FilePath ".env" -Encoding utf8 -Force

Write-Host "  npm install..." -ForegroundColor DarkCyan
npm install 2>&1 | Out-Null

Write-Host "  npm run build..." -ForegroundColor DarkCyan
npm run build

Write-Host "  Frontend compilado" -ForegroundColor Green

Pop-Location

# ------------------------------------------------------------------------------
# 4. Reiniciar PM2
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

$ErrorActionPreference = $oldPreference

# ------------------------------------------------------------------------------
# 5. Health check
# ------------------------------------------------------------------------------
Write-Host "`n[5/5] Verificando despliegue..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
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
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE $ENV_NAME COMPLETADO" -ForegroundColor Green
Write-Host "  Commit: $(git -C $APP_DIR rev-parse --short HEAD)" -ForegroundColor DarkGray
Write-Host "  URL: https://prepmo.dacsa.com" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan

# Notificacion Telegram (opcional - rellena las variables de entorno)
if ($env:TELEGRAM_BOT_TOKEN -and $env:TELEGRAM_CHAT_ID) {
    $msg = "✅ *PMO PRE Desplegado*%0ACommit: $(git -C $APP_DIR rev-parse --short HEAD)"
    $uri = "https://api.telegram.org/bot$($env:TELEGRAM_BOT_TOKEN)/sendMessage"
    Invoke-RestMethod -Uri $uri -Method Post -Body @{
        chat_id    = $env:TELEGRAM_CHAT_ID
        text       = $msg
        parse_mode = "Markdown"
    } -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  Notificacion Telegram enviada" -ForegroundColor DarkGray
}
