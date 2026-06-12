#!/bin/bash

# ==============================================================================
# Script de Despliegue Automatizado para PPM Governance Dashboard
# Orquesta la actualización de código, migraciones, compilación y túneles.
# Ejecución: ./deploy.sh
# ==============================================================================

# Detener la ejecución inmediatamente si algún comando clave falla
set -e

echo "=================================================="
echo "🚀 Iniciando despliegue automatizado..."
echo "=================================================="

# 1. Obtener los últimos cambios de GitHub de forma forzosa (Evita conflictos locales)
echo "📥 [1/7] Obteniendo últimos cambios de la rama 'main'..."
git fetch origin main
git reset --hard origin/main

# 2. Actualizar Backend y Base de Datos
echo "⚙️  [2/7] Configurando el Backend y migrando la Base de Datos..."
cd backend
# Instalamos dependencias limpiamente
npm install
# Ejecutamos las migraciones antes de levantar la API
npm run migrate
cd ..

# 3. Reiniciar Backend y levantar Túnel de la API
echo "🔄 [3/7] Reiniciando la API y levantando el túnel de Cloudflare..."
# Borramos túneles viejos para asegurar que levantan limpios
pm2 delete tunnel-api tunnel-frontend 2>/dev/null || true
# Asumimos que el backend se llama 'pmo-backend' o 'backend' en PM2, si no existe lo levanta
pm2 restart pmo-backend || pm2 start server.js --name "pmo-backend" --cwd ./backend

# Limpiamos logs antiguos y levantamos túnel del backend
pm2 flush tunnel-api 2>/dev/null || true
pm2 start cloudflared --name "tunnel-api" -- tunnel --url http://localhost:5000

echo "⏳ Esperando 15 segundos para la generación de la URL de la API..."
sleep 15

# Extraemos la nueva URL aleatoria (usando tail -n 1 para coger la más reciente)
API_URL=$(pm2 logs tunnel-api --lines 100 --nostream | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | tail -n 1)

if [ -z "$API_URL" ]; then
    echo "❌ Error: No se pudo obtener la URL de la API. Revisa los logs de PM2."
    exit 1
fi

echo "✅ Nueva URL de la API obtenida: $API_URL"

# 4. Inyectar la URL en el Frontend
echo "🔧 [4/7] Inyectando la nueva URL de la API en el frontend..."
cd frontend
# Sobrescribimos el archivo .env con la nueva URL para que Vite la procese en el build
echo "VITE_API_URL=$API_URL/api" > .env
echo "✅ Archivo .env actualizado correctamente."

# 5. Instalar y Compilar Frontend
echo "🎨 [5/7] Configurando y compilando el Frontend..."
npm install
npm run build
cd ..

# 6. Reiniciar el servicio local del Frontend
echo "🔄 [6/7] Reiniciando servicio local del frontend..."
pm2 restart pmo-frontend || pm2 start npm --name "pmo-frontend" --cwd ./frontend -- run dev

# 7. Levantar Túnel del Frontend
echo "🌐 [7/7] Levantando el túnel público del Frontend..."
# Ajusta el puerto si en producción usas otro servidor en lugar de `npm run dev` (ej. 5173)
pm2 flush tunnel-frontend 2>/dev/null || true
pm2 start cloudflared --name "tunnel-frontend" -- tunnel --url http://localhost:5173

echo "⏳ Esperando 20 segundos para la generación de la URL del frontend..."
sleep 20

FRONTEND_URL=$(pm2 logs tunnel-frontend --lines 100 --nostream | grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | tail -n 1)

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ Error: No se pudo obtener la URL del Frontend."
    exit 1
fi

echo "=================================================="
echo "✅ ¡DESPLIEGUE COMPLETADO CON ÉXITO!"
echo "=================================================="
echo "La URL interna de tu API es: $API_URL/api"
echo "La URL pública para tus usuarios es: $FRONTEND_URL"
echo "=================================================="

# ==============================================================================
# 8. Notificación por Telegram (Opcional)
# ==============================================================================
# Si rellenas estas variables, la Raspberry te mandará un mensaje con la URL
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    echo "📱 Enviando notificación por Telegram..."
    MESSAGE="✅ *PPM Dashboard Desplegado*%0A%0A🌐 *URL Pública:* $FRONTEND_URL"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" \
        -d text="${MESSAGE}" \
        -d parse_mode="Markdown" > /dev/null
    echo "✅ Mensaje enviado al móvil."
fi
