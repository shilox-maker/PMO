#!/bin/bash

# ==============================================================================
# Script de Sincronización de Túneles (Ideal para @reboot en Cron)
# Levanta los servicios locales, genera nuevos túneles y recompila el frontend.
# ==============================================================================

# No usamos 'set -e' al principio porque al reiniciar la Raspberry, la red puede
# tardar unos segundos en estar lista y no queremos que el script muera prematuramente.

echo "=================================================="
echo "🔌 Iniciando Sincronización de Túneles en Arranque..."
echo "=================================================="

# Esperar un poco a que la red de la Raspberry esté disponible tras el reinicio
echo "⏳ Esperando a que la red esté lista..."
sleep 10

# 1. Levantar/Reiniciar Backend
echo "⚙️  [1/4] Levantando Backend y túnel de la API..."
cd ~/PMO/backend || cd backend
pm2 restart pmo-backend || pm2 start server.js --name "pmo-backend"

# 2. Levantar túnel de la API
pm2 delete tunnel-api 2>/dev/null || true
pm2 start cloudflared --name "tunnel-api" -- tunnel --url http://localhost:5000

echo "⏳ Esperando 15 segundos para la generación de la URL de la API..."
sleep 15

# 3. Extraer URL de la API
API_URL=$(pm2 logs tunnel-api --lines 100 --nostream | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | head -n 1)

if [ -z "$API_URL" ]; then
    echo "❌ Error: No se pudo obtener la URL de la API. Revisa tu conexión."
    exit 1
fi

echo "✅ Nueva URL de la API obtenida: $API_URL"

# 4. Inyectar y recompilar Frontend
echo "🎨 [2/4] Inyectando URL y recompilando el Frontend..."
cd ../frontend
echo "VITE_API_URL=$API_URL/api" > .env
npm run build

# 5. Reiniciar servicio del Frontend local
echo "🔄 [3/4] Levantando servicio local del frontend..."
pm2 restart pmo-frontend || pm2 start npm --name "pmo-frontend" -- run dev

# 6. Levantar túnel del Frontend
echo "🌐 [4/4] Levantando el túnel público del Frontend..."
pm2 delete tunnel-frontend 2>/dev/null || true
pm2 start cloudflared --name "tunnel-frontend" -- tunnel --url http://localhost:5173

echo "⏳ Esperando 20 segundos para la generación de la URL del frontend..."
sleep 20

FRONTEND_URL=$(pm2 logs tunnel-frontend --lines 100 --nostream | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | head -n 1)

echo "=================================================="
echo "✅ ¡TÚNELES SINCRONIZADOS Y LEVANTADOS!"
echo "=================================================="
echo "La URL interna de tu API es: $API_URL/api"
echo "La URL pública para tus usuarios es: $FRONTEND_URL"
echo "=================================================="
