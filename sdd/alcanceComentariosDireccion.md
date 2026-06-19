# Alcance: Comentarios "Para Dirección" y Carga Rápida desde Seguimiento

## 1. Objetivo
Añadir una nueva dimensión de clasificación para las actualizaciones cualitativas de los proyectos ("Para dirección") y agilizar el flujo de trabajo de los PMs implementando un modal de actualización rápida directamente en la cuadrícula de "Seguimiento de proyectos", el cual utiliza el último comentario existente como plantilla base para registrar uno nuevo.

## 2. Impacto y Conflictos
*   **Modifica (BBDD):** Entidad `Comentarios_Proyecto`. Se requiere script de migración para añadir el nuevo campo sin alterar el flag de auditoría actual (`es_importante`).
*   **Modifica (Frontend - Proyecto):** Formulario de creación/edición en el Muro de Comentarios.
*   **Modifica (Frontend - Seguimiento):** Inyección de botón de acción por fila y nuevo componente Modal con el Editor WYSIWYG.
*   **Sin Conflictos:** Aprovecha los endpoints actuales de la API y el componente WYSIWYG existente, garantizando el parseo correcto de listas y colores.

## 3. Modelo de Datos / Estructura (SQLite)
*   **Tabla `Comentarios_Proyecto`:**
    *   `ADD COLUMN para_direccion BOOLEAN DEFAULT FALSE`

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Clasificación de Comentarios "Para Dirección"**
*   **Dado que** el Project Manager redacta un comentario en la ficha interna del proyecto...
*   **Cuando** observa los controles de guardado bajo el Editor WYSIWYG...
*   **Entonces** junto al check de "Marcar como Importante", debe existir un nuevo check independiente etiquetado como "Para dirección".
*   **Y Cuando** se guarda el comentario...
*   **Entonces** el muro debe reflejar visualmente (ej. un badge o icono distintivo) que ese comentario tiene la marca `para_direccion = true`.

**Escenario 2: Lanzamiento del Modal Rápido en Seguimiento**
*   **Dado que** un PM está revisando la tabla global en la vista "Seguimiento de proyectos"...
*   **Cuando** interactúa con la fila de un proyecto específico...
*   **Entonces** debe existir un botón de acción rápida (ej. icono de "Añadir comentario" o "Actualizar estado").
*   **Y Cuando** hace clic en el botón...
*   **Entonces** se debe superponer un Popup/Modal que contenga el Editor WYSIWYG y los checkboxes de clasificación ("Importante", "Para dirección").

**Escenario 3: Precarga como Plantilla (Smart Copy)**
*   **Dado que** se abre el Popup de actualización rápida de un proyecto...
*   **Cuando** el sistema termina de cargar el componente...
*   **Entonces** el editor WYSIWYG debe aparecer rellenado automáticamente con el contenido HTML/Texto del **último comentario cronológico** registrado en el muro de ese proyecto.

**Escenario 4: Creación de Nuevo Registro (Anti-Edición)**
*   **Dado que** el PM ha modificado la plantilla precargada en el Popup para reflejar el estado de esta semana...
*   **Cuando** pulsa el botón "Guardar" o "Publicar"...
*   **Entonces** el backend no debe sobrescribir el comentario antiguo (no hace un `PUT`), sino que obligatoriamente ejecuta un `POST`, insertando un registro completamente nuevo en la base de datos con el timestamp actual.