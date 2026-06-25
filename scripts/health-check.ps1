# ==============================================================================
# Health Check - Verificacion de estado de los entornos PMO
# Uso: .\health-check.ps1              (verifica ambos)
#      .\health-check.ps1 -Env pre     (solo PRE)
#      .\health-check.ps1 -Env pro     (solo PRO)
# ==============================================================================

param(
    [ValidateSet("pre", "pro", "all")]
    [string]$Env = "all"
)

$results = @()

function Test-Environment {
    param([string]$Name, [int]$Port, [string]$AppDir)

    Write-Host "`n--- $($Name.ToUpper()) ---" -ForegroundColor Cyan

    # 1. PM2 proceso
    $pm2Name = "pmo-$Name-backend"
    $pm2List = pm2 jlist 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
    $proc = $pm2List | Where-Object { $_.name -eq $pm2Name }

    if ($proc -and $proc.pm2_env.status -eq "online") {
        Write-Host "  PM2 ($pm2Name): ONLINE" -ForegroundColor Green
    } else {
        Write-Host "  PM2 ($pm2Name): OFFLINE" -ForegroundColor Red
    }

    # 2. API responde
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$Port/api/auth/login" `
            -Method POST -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  API (localhost:$Port): OK (HTTP $($resp.StatusCode))" -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code) {
            Write-Host "  API (localhost:$Port): OK (HTTP $code)" -ForegroundColor Green
        } else {
            Write-Host "  API (localhost:$Port): NO RESPONDE" -ForegroundColor Red
        }
    }

    # 3. Frontend compilado
    $distPath = "$AppDir\frontend\dist\index.html"
    if (Test-Path $distPath) {
        $size = (Get-Item $distPath).Length
        Write-Host "  Frontend (dist/index.html): OK ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  Frontend (dist/index.html): NO EXISTE" -ForegroundColor Red
    }

    # 4. Fichero .env existe
    $envPath = "$AppDir\backend\.env"
    if (Test-Path $envPath) {
        Write-Host "  Backend .env: OK" -ForegroundColor Green
    } else {
        Write-Host "  Backend .env: NO EXISTE" -ForegroundColor Red
    }

    # 5. Git - commit actual
    $commit = git -C $AppDir rev-parse --short HEAD 2>$null
    $branch = git -C $AppDir rev-parse --abbrev-ref HEAD 2>$null
    if ($commit) {
        Write-Host "  Git: $branch @ $commit" -ForegroundColor DarkGray
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Health Check PMO - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($Env -eq "all" -or $Env -eq "pre") {
    Test-Environment -Name "pre" -Port 5000 -AppDir "C:\Apps\PMO\pre"
}

if ($Env -eq "all" -or $Env -eq "pro") {
    Test-Environment -Name "pro" -Port 5100 -AppDir "C:\Apps\PMO\pro"
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  Health Check completado" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
