# ==============================================================================
# Configuracion de IIS como Reverse Proxy + SSL (Let's Encrypt)
# Ejecutar UNA SOLA VEZ como Administrador tras setup-server.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"
$APPS_ROOT = "C:\Apps\PMO"
$WINACME_DIR = "C:\Tools\win-acme"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Configuracion IIS + SSL para PMO" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Verificar modulos IIS necesarios
# ------------------------------------------------------------------------------
Write-Host "`n[1/5] Verificando modulos IIS..." -ForegroundColor Yellow

Import-Module WebAdministration -ErrorAction Stop

# Verificar URL Rewrite
$urlRewrite = Get-WebGlobalModule -Name "RewriteModule" -ErrorAction SilentlyContinue
if (-not $urlRewrite) {
    Write-Host "  URL Rewrite Module NO instalado." -ForegroundColor Red
    Write-Host "  Descargalo de: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
    Write-Host "  Instala e1 MSI y vuelve a ejecutar este script." -ForegroundColor Yellow
    exit 1
}
Write-Host "  URL Rewrite: OK" -ForegroundColor Green

# Verificar ARR
$arr = Get-WebGlobalModule -Name "ApplicationRequestRouting" -ErrorAction SilentlyContinue
if (-not $arr) {
    Write-Host "  ARR NO instalado." -ForegroundColor Red
    Write-Host "  Descargalo de: https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ARR: OK" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 2. Habilitar proxy en ARR
# ------------------------------------------------------------------------------
Write-Host "`n[2/5] Habilitando proxy en ARR..." -ForegroundColor Yellow

$arrProxy = Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
    -Filter "system.webServer/proxy" -Name "enabled" -ErrorAction SilentlyContinue

if ($arrProxy -and $arrProxy.Value -eq $true) {
    Write-Host "  Proxy ARR ya habilitado" -ForegroundColor DarkGray
} else {
    Set-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST" `
        -Filter "system.webServer/proxy" -Name "enabled" -Value "True"
    Write-Host "  Proxy ARR habilitado" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 3. Crear sitios IIS
# ------------------------------------------------------------------------------
Write-Host "`n[3/5] Creando sitios IIS..." -ForegroundColor Yellow

$sites = @(
    @{ Name = "PMO-PRE"; Host = "prepmo.dacsa.com"; Port = 5000; IISPath = "$APPS_ROOT\iis\pre" },
    @{ Name = "PMO-PRO"; Host = "pmo.dacsa.com";    Port = 5100; IISPath = "$APPS_ROOT\iis\pro" }
)

foreach ($site in $sites) {
    # Crear directorio fisico del sitio IIS
    if (-not (Test-Path $site.IISPath)) {
        New-Item -ItemType Directory -Path $site.IISPath -Force | Out-Null
    }

    # Crear sitio si no existe
    $existing = Get-IISSite -Name $site.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "  Sitio $($site.Name) ya existe, saltando" -ForegroundColor DarkGray
    } else {
        New-IISSite -Name $site.Name `
            -PhysicalPath $site.IISPath `
            -BindingInformation "*:80:$($site.Host)"
        Write-Host "  Sitio $($site.Name) creado -> $($site.Host):80" -ForegroundColor Green
    }

    # Generar web.config con regla de reverse proxy
    $webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:$($site.Port)/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@
    $webConfig | Out-File -FilePath "$($site.IISPath)\web.config" -Encoding utf8NoBOM -Force
    Write-Host "  web.config generado -> localhost:$($site.Port)" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 4. Instalar win-acme (Let's Encrypt)
# ------------------------------------------------------------------------------
Write-Host "`n[4/5] Configurando win-acme para SSL..." -ForegroundColor Yellow

if (Test-Path "$WINACME_DIR\wacs.exe") {
    Write-Host "  win-acme ya instalado en $WINACME_DIR" -ForegroundColor DarkGray
} else {
    Write-Host "  Descargando win-acme..." -ForegroundColor DarkCyan
    New-Item -ItemType Directory -Path $WINACME_DIR -Force | Out-Null
    $wacsUrl = "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1/win-acme.v2.2.9.1.x64.pluggable.zip"
    $wacsZip = "$env:TEMP\win-acme.zip"
    Invoke-WebRequest -Uri $wacsUrl -OutFile $wacsZip -UseBasicParsing
    Expand-Archive -Path $wacsZip -DestinationPath $WINACME_DIR -Force
    Remove-Item $wacsZip
    Write-Host "  win-acme instalado en $WINACME_DIR" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 5. Generar certificados SSL
# ------------------------------------------------------------------------------
Write-Host "`n[5/5] Generando certificados SSL..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  IMPORTANTE: Los dominios prepmo.dacsa.com y pmo.dacsa.com" -ForegroundColor Yellow
Write-Host "  deben apuntar a este servidor ANTES de generar los certificados." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Para generar los certificados manualmente, ejecuta:" -ForegroundColor White
Write-Host "    $WINACME_DIR\wacs.exe" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Selecciona las opciones:" -ForegroundColor White
Write-Host "    N - Create certificate (default settings)" -ForegroundColor DarkGray
Write-Host "    2 - Choose from IIS site bindings" -ForegroundColor DarkGray
Write-Host "    Selecciona el sitio PMO-PRE o PMO-PRO" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  win-acme configurara la renovacion automatica." -ForegroundColor White

# ------------------------------------------------------------------------------
# Resumen
# ------------------------------------------------------------------------------
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  IIS CONFIGURADO" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Sitios creados:" -ForegroundColor White
Write-Host "    PMO-PRE -> prepmo.dacsa.com -> localhost:5000" -ForegroundColor DarkGray
Write-Host "    PMO-PRO -> pmo.dacsa.com    -> localhost:5100" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Proximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Apunta los DNS de prepmo/pmo.dacsa.com a este servidor" -ForegroundColor White
Write-Host "  2. Ejecuta $WINACME_DIR\wacs.exe para los certificados SSL" -ForegroundColor White
Write-Host "  3. Ejecuta deploy-pre.ps1 para el primer despliegue" -ForegroundColor White
Write-Host ""
