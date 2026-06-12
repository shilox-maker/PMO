# Alcance: Automatización de Despliegue y Orquestación (Raspberry Pi)

## 1. Objetivo
Crear un script de Bash (`deploy.sh`) en la raíz del monorepositorio que orqueste la actualización completa de la plataforma. Este script debe descargar la última versión del código desde la rama `main` de GitHub, actualizar la base de datos de forma segura, compilar el frontend y reiniciar los servicios (incluyendo la compatibilidad con los túneles Cloudflared de PM2).

## 2. Impacto y Conflictos
*   **Añade:** Un nuevo archivo ejecutable `deploy.sh`.
*   **Dependencia Estricta:** Requiere que el documento `alcanceMigracionesBD.md` ya esté implementado, ya que el script utilizará el nuevo comando de migraciones.
*   **Frontend y Backend:** Orquesta los comandos ya existentes documentados: `npm run build` para la carpeta `/frontend/dist` y reinicia el servicio Express.

## 3. Modelo de Datos / Estructura
*   No aplica cambios estructurales en la base de datos, actúa como infraestructura (DevOps).

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Ejecución del pipeline de despliegue**
*   **Dado que** hay nuevos cambios fusionados en la rama `main` de GitHub...
*   **Cuando** el administrador ejecuta `./deploy.sh` en la Raspberry Pi...
*   **Entonces** el script debe realizar secuencialmente los siguientes pasos automatizados:
    1. Ejecutar `git pull origin main` para bajar el código.
    2. Entrar a `/backend`, instalar dependencias (`npm install`) y ejecutar las migraciones de Sequelize de forma segura (sin borrar datos).
    3. Entrar a `/frontend`, instalar dependencias (`npm install`) y compilar la vista para producción con `npm run build`.
    4. Usar `pm2 restart` para reiniciar la API del backend y el servicio local del frontend.
    5. *(Opcional)* Refrescar los procesos de `cloudflared` en PM2 e imprimir las nuevas URLs temporales de `.trycloudflare.com` en los logs si los túneles se han reiniciado.

**Escenario 2: Protección ante fallos**
*   **Dado que** el script está ejecutando la compilación o las migraciones...
*   **Cuando** ocurre un error (ej. error de sintaxis en el código bajado de GitHub o falla en `npm run build`)...
*   **Entonces** el script debe detenerse inmediatamente (`set -e` en Bash), no debe reiniciar PM2 y debe mostrar un mensaje de error claro en la terminal para que la versión anterior siga funcionando.