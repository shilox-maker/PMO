# Alcance: Refactorización Operativa de Proyectos, Riesgos e Informes Dinámicos

## 1. Objetivo
Adecuar el modelo de datos transaccional y la interfaz de usuario de la vista de Proyectos para reflejar la realidad operativa: reubicación de la Orden de Compra (PO) a nivel de factura, gestión manual de fechas de incidencias, clausura de riesgos, eliminación de estados redundantes en cambios de alcance, inclusión del registro de "Lecciones Aprendidas" y generación de informes a la carta.

## 2. Impacto y Conflictos
*   **Modifica (BBDD):** Tablas `Proyectos`, `Facturas`, `Incidencias`, `Riesgos` y `Cambios_Alcance`.
*   **Añade (BBDD):** Nueva entidad `Lecciones_Aprendidas`.
*   **Extiende (UI):** La vista de detalle del Proyecto (añadiendo la sección Lecciones Aprendidas) y el generador de reportes (creando un modal de selección de secciones).
*   **Depreca:** El campo `PO` en Proyectos y el estado `En Revisión` en Cambios de Alcance.
*   **Migraciones:** Se requiere un script de Sequelize que: 1) Elimine `PO` de Proyectos y lo añada a Facturas, 2) Convierta los Riesgos actuales a estado "Activo", 3) Mueva los Cambios de Alcance "En Revisión" a un estado neutral.

## 3. Modelo de Datos / Estructura (SQLite)
Se aplicarán las siguientes alteraciones sobre las entidades relacionales claves:
*   `Proyectos`: `DROP COLUMN po` (Eliminación).
*   `Facturas`: `ADD COLUMN po` (STRING, allowNull: true).
*   `Cambios_Alcance`: El enum/restricción de estados elimina la opción `EN_REVISION`.
*   `Incidencias`: `ADD COLUMN fecha_cierre` (DATE, allowNull: true).
*   `Riesgos`: 
    *   La columna `descripcion` pasa a ser opcional (`allowNull: true`).
    *   `ADD COLUMN estado` (ENUM/STRING: `ACTIVO`, `CERRADO`) por defecto `ACTIVO`.
*   `Lecciones_Aprendidas` **[NUEVA TABLA]**:
    *   `id` (PK)
    *   `proyecto_id` (FK -> Proyectos)
    *   `titulo` (STRING, obligatorio)
    *   `descripcion` (TEXT, opcional)
    *   `fecha_registro` (DATE, por defecto NOW)

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Reubicación de la Orden de Compra (PO)**
*   **Dado que** un PM visualiza la cabecera de un Proyecto...
*   **Cuando** inspecciona los metadatos principales...
*   **Entonces** el campo "PO" ya no debe existir en la vista global. 
*   **Y Cuando** accede a la pestaña de "Facturas" (Gestión Económica) y crea/edita una factura...
*   **Entonces** el formulario de la factura debe incluir el campo opcional "PO", almacenándose de forma individualizada.

**Escenario 2: Limpieza de Cambios de Alcance**
*   **Dado que** se registra un nuevo "Cambio de Alcance" (Change Request)...
*   **Cuando** el usuario despliega las opciones de estado...
*   **Entonces** la opción "En Revisión" no debe aparecer, simplificando el flujo de decisión.

**Escenario 3: Control Manual de Incidencias y Riesgos**
*   **Dado que** un PM actualiza la situación operativa de su proyecto...
*   **Cuando** edita una "Incidencia"...
*   **Entonces** debe disponer de un campo tipo DatePicker llamado "Fecha de Cierre" editable manualmente.
*   **Y Cuando** crea o edita un "Riesgo"...
*   **Entonces** el campo "Descripción" no debe ser obligatorio para guardar, y debe existir un selector (Toggle/Dropdown) para marcar el Riesgo como "Activo" o "Cerrado" (desactivándolo visualmente si se cierra).

**Escenario 4: Nueva Entidad - Lecciones Aprendidas**
*   **Dado que** un proyecto está finalizando o ha superado un hito...
*   **Cuando** el PM navega por las pestañas del proyecto (junto a Riesgos, Incidencias, etc.)...
*   **Entonces** debe existir una nueva pestaña "Lecciones Aprendidas" que permita listar, crear, editar y eliminar aprendizajes con un Título y una Descripción.

**Escenario 5: Informes de Proyecto a la Carta (Report Generator)**
*   **Dado que** el PM o Director pulsa el botón "Generar Informe"...
*   **Cuando** se dispara la acción...
*   **Entonces** antes de compilar el documento, el sistema debe mostrar un Modal con un listado de *checkboxes* marcados por defecto (Resumen, Hitos financieros, Riesgos, Incidencias, Cambios de Alcance, Lecciones Aprendidas).
*   **Y Cuando** el usuario desmarca ciertas secciones y pulsa "Exportar/Generar"...
*   **Entonces** el motor del reporte procesará exclusivamente las entidades seleccionadas, omitiendo del documento final (PDF/Vista) las áreas no deseadas.