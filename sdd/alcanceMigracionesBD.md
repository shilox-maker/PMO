# Alcance: Sistema de Migraciones de Base de Datos (Sequelize)

## 1. Objetivo
Implementar un sistema de migraciones formales para la base de datos SQLite (`ppm_governance.db`) utilizando Sequelize CLI o Umzug. Esto permitirá evolucionar el esquema de la base de datos en los entornos de validación y producción sin pérdida de datos, evitando el uso destructivo del comando `npm run seed`.

## 2. Impacto y Conflictos
*   **Modifica:** La configuración de arranque del backend. La sincronización automática de modelos (`sequelize.sync({ force: true/alter })`) debe desactivarse en producción para dar paso a las migraciones manuales.
*   **Añade:** Una nueva carpeta `/backend/migrations` para almacenar los scripts de cambios incrementales.
*   **Depreca parcialmente:** El uso de `npm run seed` en entornos vivos.

## 3. Modelo de Datos / Estructura
*   Se creará automáticamente una tabla de control interna (normalmente `SequelizeMeta`) en SQLite. Esta tabla guardará el registro de qué archivos de migración ya se han ejecutado para no repetirlos.

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Creación de una nueva migración**
*   **Dado que** un desarrollador necesita añadir un nuevo campo (ej. "PO") a la tabla "Facturas"...
*   **Cuando** utiliza el IDE para generar un archivo de migración...
*   **Entonces** se debe crear un archivo en `/backend/migrations` con métodos `up()` (para añadir el campo) y `down()` (para revertirlo), sin alterar el resto de la tabla.

**Escenario 2: Ejecución de la migración sin pérdida de datos**
*   **Dado que** hay migraciones pendientes y la base de datos contiene datos vivos de usuarios...
*   **Cuando** se ejecuta el nuevo comando de actualización (ej. `npm run migrate`)...
*   **Entonces** el backend aplicará solo las migraciones no registradas en `SequelizeMeta`, manteniendo intactos los registros existentes (Proyectos, Facturas, Usuarios, etc.).