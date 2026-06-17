# Alcance: Ciclo de Vida End-to-End y Refactorización de Estados

## 1. Objetivo
Evolucionar la entidad `Proyectos` para registrar y auditar todo el ciclo de vida de un proyecto, desde su concepción hasta su cierre definitivo o cancelación. Se sustituye el flujo de estados genérico por un embudo (funnel) corporativo de 12 fases estrictas, y se dota a la base de datos de los campos de fecha necesarios para medir los tiempos de transición (Lead Time y Cycle Time) entre la petición, la aprobación, la ejecución y la estabilización.

## 2. Impacto y Conflictos
*   **Depreca:** La lista actual de 16 estados en la tabla maestra `Estados_Proyecto`.
*   **Modifica (BBDD):** Entidades `Estados_Proyecto` (Re-seeding) y `Proyectos` (nuevas columnas de fecha).
*   **Migración de Datos:** Se requiere un script de Sequelize (`umzug`) que mapee los estados de los 60 proyectos existentes hacia los nuevos 12 estados equivalentes más cercanos.
*   **Modifica (UI):** 
    *   La ficha de detalle del proyecto incorpora una nueva sección "Fechas del Ciclo de Vida".
    *   La vista `/timeline` (Gantt) debe ajustarse para utilizar `fecha_kickoff` y `fecha_go_live` como los nuevos límites principales de la barra de ejecución.

## 3. Modelo de Datos / Estructura (SQLite)
*   **Tabla `Estados_Proyecto` (Nuevo Maestro):**
    1. Petición
    2. Estudio de viabilidad
    3. Buscar propuestas
    4. Tener aprobación
    5. Planificar
    6. Kickoff
    7. Ejecución
    8. Go Live
    9. Estabilización
    10. Cierre
    11. Descartado (Estado inactivo/terminal)
    12. Cancelado (Estado inactivo/terminal)

*   **Tabla `Proyectos` (Nuevas Columnas de Fecha - Todas `DATE`, `allowNull: true`):**
    *   `fecha_peticion`
    *   `fecha_alcance_definido`
    *   `fecha_aprobacion`
    *   `fecha_planificacion`
    *   `fecha_kickoff` 
    *   `fecha_go_live`
    *   `fecha_cierre`

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Migración y Estandarización de Estados**
*   **Dado que** se despliega la nueva actualización en la base de datos (`npm run migrate`)...
*   **Cuando** el sistema arranca...
*   **Entonces** el desplegable de estados en todos los proyectos debe mostrar exclusivamente el nuevo flujo de 12 pasos. Los estados "Descartado" y "Cancelado" y "Cierre" contarán lógicamente como `proyecto_cerrado = true` para que desaparezcan de los filtros de "Proyectos abiertos" en el Dashboard.

**Escenario 2: Interfaz del Ciclo de Vida en el Proyecto**
*   **Dado que** un PM accede al detalle de un proyecto...
*   **Cuando** navega por la cabecera de metadatos...
*   **Entonces** debe visualizar una nueva tarjeta o sección llamada "Hitos del Ciclo de Vida" que contenga DatePickers (selectores de fecha) para: Petición, Alcance Definido, Aprobación, Planificación, Kickoff, Go-Live y Cierre.
*   **Y Cuando** guarda los cambios...
*   **Entonces** el backend debe validar que las fechas enviadas cumplan con el formato ISO 8601 (`YYYY-MM-DD`).

**Escenario 3: Automatización Reactiva de Fechas (Opcional pero recomendada)**
*   **Dado que** el PM cambia el estado del proyecto en el desplegable principal...
*   **Cuando** pasa el proyecto al estado "Kickoff" o "Go Live" y pulsa guardar...
*   **Entonces** si los campos `fecha_kickoff` o `fecha_go_live` estaban vacíos, el sistema debe rellenarlos automáticamente con la fecha del día actual, notificándolo en el Muro de Comentarios mediante la auditoría automática.

**Escenario 4: Compatibilidad con el Timeline**
*   **Dado que** un Director entra en la vista `/timeline` para ver la carga de trabajo...
*   **Cuando** el motor renderiza las barras horizontales de los proyectos...
*   **Entonces** la barra visual de "Ejecución" debe pintarse comenzando en `fecha_kickoff` y terminando en `fecha_go_live` (o `fecha_fin_estimada` si está retrasado), ignorando el tiempo previo de "Petición" para no distorsionar el Gantt de carga técnica.