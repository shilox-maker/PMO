#!/bin/bash

# ==============================================================================
# Script de Despliegue Automatizado para PPM Governance Dashboard
# Ejecución: ./deploy.sh
# ==============================================================================

# Detener la ejecución inmediatamente si algún comando falla
set -e

echo "=================================================="
echo "🚀 Iniciando despliegue automatizado..."
echo "=================================================="

# 1. Obtener los últimos cambios de GitHub
echo "📥 [1/4] Obteniendo últimos cambios de la rama 'main'..."
git pull origin main

# 2. Actualizar Backend y Base de Datos
echo "⚙️  [2/4] Configurando el Backend y migrando la Base de Datos..."
cd backend
npm install
# Ejecutamos las migraciones antes del reinicio para asegurar que el código no arranca
# si hay un error en la migración de la base de datos (Protección contra fallos)
npm run migrate
cd ..

# 3. Actualizar y Compilar Frontend
echo "🎨 [3/4] Configurando y compilando el Frontend..."
cd frontend
npm install
npm run build
cd ..

# 4. Reiniciar servicios con PM2
echo "🔄 [4/4] Reiniciando servicios en PM2..."
# Reiniciamos todos los servicios (backend, frontend y cloudflared si existe)
pm2 restart all

echo "=================================================="
echo "✅ ¡Despliegue completado con éxito!"
echo "=================================================="

# 5. Obtener URLs de Cloudflared (Opcional)
echo "🌐 Comprobando URLs públicas (Cloudflared)..."
sleep 3 # Damos un margen para que los túneles se generen
pm2 logs cloudflared --lines 30 --nostream | grep "trycloudflare.com" || echo "No se encontraron URLs de trycloudflare.com en los últimos logs."
