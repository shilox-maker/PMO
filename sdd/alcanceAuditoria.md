# Alcance: Estandarización de Trazabilidad Global (Auditoría de Registros)

## 1. Objetivo
Estandarizar el modelo de datos transaccional para garantizar una trazabilidad completa a nivel de fila. Todas las entidades de negocio deben registrar automáticamente la identidad del usuario creador (`createdBy`) y del último usuario modificador (`modifiedBy`), complementando las marcas de tiempo nativas de Sequelize, para asegurar un historial de auditoría robusto.

## 2. Impacto y Conflictos
*   **Modifica (BBDD):** [EXTIENDE] Las entidades principales (Proyectos, Facturas, Riesgos, Incidencias, Cambios de Alcance). Sequelize ya gestiona las fechas por defecto, por lo que el impacto requiere una migración (`umzug`) masiva para añadir los IDs de usuario.
*   **Modifica (Backend):** [EXTIENDE] Todos los endpoints de escritura en Express.
*   **Conflicto / Depreca:** Soluciona la necesidad de haber añadido `creador_id` de forma aislada en la especificación anterior (`alcanceAutenticacionHibridaYExternos.md`), unificando el concepto bajo un estándar global en toda la aplicación.

## 3. Modelo de Datos / Estructura (SQLite)
Se aplicará la siguiente alteración mediante una migración transversal sobre las tablas transaccionales:
*   `ADD COLUMN createdBy` (FK -> Usuarios). Para que la migración no rompa los registros existentes en `ppm_governance.db`, deberá configurarse como `allowNull: true` inicialmente, o asignarse a un usuario administrador por defecto.
*   `ADD COLUMN modifiedBy` (FK -> Usuarios, allowNull: true).

*(Nota técnica para el IDE: `createdOn` y `modifiedOn` ya están cubiertos por los campos estándar `createdAt` y `updatedAt` de Sequelize).*

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Creación de un nuevo registro (Trazabilidad Inicial)**
*   **Dado que** un usuario autenticado (ej. un PM) crea una nueva entidad (ej. un Riesgo o una Incidencia)...
*   **Cuando** el backend de Express recibe la petición `POST`...
*   **Entonces** el middleware intercepta la llamada, extrae el ID del usuario del token de sesión y lo inyecta automáticamente en el campo `createdBy` antes de guardar en SQLite.
*   **Y Entonces** el campo `modifiedBy` queda nulo (o igual al creador) y Sequelize genera la fecha de creación.

**Escenario 2: Modificación de un registro existente**
*   **Dado que** un usuario edita un metadato de un registro ya existente...
*   **Cuando** el backend procesa la petición `PUT`...
*   **Entonces** el sistema actualiza automáticamente la columna `modifiedBy` con el ID del usuario actual que realiza la acción.
*   **Y Entonces** el ORM actualiza automáticamente la fecha de modificación (`updatedAt`), manteniendo el valor original de `createdBy` estrictamente inmutable.

**Escenario 3: Seguridad anti-manipulación**
*   **Dado que** un usuario malintencionado intenta enviar datos trucados en el cuerpo (Body) de una petición a la API...
*   **Cuando** incluye manualmente valores falsos como `{"createdBy": 999}`...
*   **Entonces** el backend debe ignorar esos valores del payload y forzar siempre el ID real proveniente de la sesión de autenticación criptográfica.