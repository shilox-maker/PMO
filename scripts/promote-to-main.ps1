# ==============================================================================
# Promocion de develop a main
# Hace merge de develop en main y lo sube a Azure DevOps.
# Ejecutar desde el servidor DESPUES de validar PRE.
# Uso: .\promote-to-main.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"
$APP_DIR = "C:\Apps\PMO\pro"  # Usamos la copia de PRO que sigue main

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "  Promocion: develop -> main" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

Push-Location $APP_DIR

# ------------------------------------------------------------------------------
# 1. Asegurar que estamos en main y actualizar ambas ramas
# ------------------------------------------------------------------------------
Write-Host "`n[1/4] Actualizando ramas..." -ForegroundColor Yellow

git fetch origin
git checkout main
git pull origin main
Write-Host "  main actualizada" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 2. Mostrar que se va a mergear
# ------------------------------------------------------------------------------
Write-Host "`n[2/4] Commits en develop que NO estan en main:" -ForegroundColor Yellow

$pendingCommits = git log --oneline "main..origin/develop"
if (-not $pendingCommits) {
    Write-Host "  No hay commits nuevos en develop. Nada que promocionar." -ForegroundColor DarkGray
    Pop-Location
    exit 0
}

$pendingCommits | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
$commitCount = ($pendingCommits | Measure-Object).Count
Write-Host "`n  Total: $commitCount commits" -ForegroundColor White

# ------------------------------------------------------------------------------
# 3. Confirmacion
# ------------------------------------------------------------------------------
Write-Host ""
$confirm = Read-Host "  Confirmar merge a main? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "`n  Promocion cancelada." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

# ------------------------------------------------------------------------------
# 4. Merge y push
# ------------------------------------------------------------------------------
Write-Host "`n[3/4] Mergeando develop en main..." -ForegroundColor Yellow

$date = Get-Date -Format "yyyy-MM-dd HH:mm"
git merge origin/develop --no-ff -m "Promote: merge develop into main ($date)"

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Conflicto de merge. Resuelve manualmente:" -ForegroundColor Red
    Write-Host "    cd $APP_DIR" -ForegroundColor DarkGray
    Write-Host "    git status" -ForegroundColor DarkGray
    Write-Host "    # Resolver conflictos, luego: git add . && git commit" -ForegroundColor DarkGray
    Pop-Location
    exit 1
}

Write-Host "  Merge completado localmente" -ForegroundColor Green

Write-Host "`n[4/4] Subiendo a Azure DevOps..." -ForegroundColor Yellow
git push origin main
Write-Host "  main actualizada en Azure DevOps" -ForegroundColor Green

Pop-Location

# ------------------------------------------------------------------------------
# Resumen
# ------------------------------------------------------------------------------
Write-Host "`n==================================================" -ForegroundColor Yellow
Write-Host "  PROMOCION COMPLETADA" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  main ahora incluye $commitCount commits de develop." -ForegroundColor White
Write-Host "  Commit actual: $(git -C $APP_DIR rev-parse --short HEAD)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Siguiente paso: .\deploy-pro.ps1" -ForegroundColor Cyan
Write-Host ""
