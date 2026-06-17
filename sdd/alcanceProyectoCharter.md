# Alcance: Definición del Project Charter (Alcance y Criterios de Cierre)

## 1. Objetivo
Centralizar la definición funcional, técnica y de aceptación de cada proyecto dentro de la plataforma PMO. Se incorporan dos nuevas áreas temáticas ("Alcance" y "Criterios de Cierre") en la ficha del proyecto, permitiendo a los Project Managers documentar el propósito, los límites, las integraciones y las métricas de éxito utilizando texto enriquecido.

## 2. Impacto y Conflictos
*   **Modifica (BBDD):** Entidad `Proyectos`.
*   **Modifica (UI - Proyecto):** Se añaden las pestañas "Alcance" y "Criterios de Cierre" en la vista de detalle.
*   **Modifica (UI - Reportes):** El Modal de Generación de Informes se amplía para incluir estas nuevas secciones como exportables.
*   **Migración de Datos:** Requiere un script de Sequelize para añadir las nuevas columnas a la tabla `Proyectos` sin afectar a los registros existentes.

## 3. Modelo de Datos / Estructura (SQLite)
Se aplicará la siguiente alteración sobre la tabla `Proyectos` añadiendo columnas de tipo `TEXT` (todas con `allowNull: true`):
*   `alcance_por_que`
*   `alcance_objetivo`
*   `alcance_resultados`
*   `alcance_limitaciones`
*   `alcance_integraciones`
*   `alcance_desarrollo`
*   `cierre_aceptacion`
*   `cierre_exito`

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Inyección de nuevas pestañas en la UI**
*   **Dado que** un Project Manager accede al detalle de un proyecto...
*   **Cuando** observa la barra de navegación interna (donde están Timeline, Riesgos, Incidencias, etc.)...
*   **Entonces** debe visualizar dos nuevas pestañas: "Alcance" y "Criterios de Cierre".

**Escenario 2: Edición del Alcance con texto enriquecido**
*   **Dado que** el usuario navega a la pestaña "Alcance"...
*   **Cuando** visualiza el formulario...
*   **Entonces** la pantalla debe estar dividida en 6 bloques expansibles o tarjetas: "¿Por qué?", "Objetivo principal", "Resultados deseados", "Limitaciones e hipótesis", "Integraciones" y "Cómo se desarrollará".
*   **Y Cuando** el PM hace clic en "Editar" en cualquiera de ellos...
*   **Entonces** se debe instanciar el componente *Editor WYSIWYG personalizado* de la plataforma, permitiéndole introducir listas, negritas y colores para estructurar la información antes de guardar.

**Escenario 3: Edición de Criterios de Cierre**
*   **Dado que** el usuario navega a la pestaña "Criterios de Cierre"...
*   **Cuando** visualiza el contenido...
*   **Entonces** la pantalla presentará 2 bloques gestionados con el editor WYSIWYG: "Criterios de aceptación" y "Criterios de éxito".

**Escenario 4: Integración con el Motor de Reportes**
*   **Dado que** un Director pulsa el botón de "Generar Informe"...
*   **Cuando** se despliega el Modal de selección de secciones...
*   **Entonces** el listado de *checkboxes* debe incluir "Alcance del Proyecto" y "Criterios de Cierre" (marcados por defecto).
*   **Y Cuando** el usuario exporta el PDF con estas opciones marcadas...
*   **Entonces** el motor inyectará el contenido HTML sanitizado de estas 8 columnas en el documento final, respetando los formatos de lista y negrita.