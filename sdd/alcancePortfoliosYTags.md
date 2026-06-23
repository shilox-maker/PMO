# Alcance: Agrupación por Portfolios y Sistema de Etiquetas Transversal (Tags)

## 1. Objetivo
Permitir la agrupación macro de proyectos mediante la nueva entidad `Portfolio`, gestionable desde la sección de Administración de forma opcional. Adicionalmente, dotar a los proyectos de un sistema de categorización flexible mediante `Tags` compartidos (multiselección con autocompletado y creación en línea) para enriquecer la información transversal (año, planta, funcionalidad).

## 2. Impacto y Conflictos
*   **Añade (BBDD):** Nuevas entidades `Portfolios`, `Tags` y tabla pivote `Proyecto_Tags`.
*   **Modifica (BBDD - Proyectos):** Añade la columna opcional `portfolio_id`.
*   **Modifica (UI - Admin):** Nueva pestaña "Mantenimiento de Portfolios" para usuarios con rol `ADMINISTRADOR`.
*   **Modifica (UI - Ficha de Proyecto):** Incorpora un selector opcional para el Portfolio y un componente Combobox multiselección para los Tags.
*   **Migraciones de Datos:** Se requiere script (`umzug`) que cree las tablas y la nueva columna en proyectos, permitiendo valores nulos para no afectar a los proyectos históricos.

## 3. Modelo de Datos / Estructura (SQLite)
*   **Tabla `Portfolios`:**
    *   `id` (PK)
    *   `nombre` (STRING, Unique, Not Null)
    *   `descripcion` (TEXT, Allow Null)
*   **Tabla `Tags`:**
    *   `id` (PK)
    *   `nombre` (STRING, Unique, Not Null - *ej: "2024", "CAPEX", "Planta Buñol"*)
*   **Tabla Pivot `Proyecto_Tags`:**
    *   `proyecto_id` (FK -> Proyectos)
    *   `tag_id` (FK -> Tags)
*   **Tabla `Proyectos`:**
    *   `ADD COLUMN portfolio_id` (FK -> Portfolios, Allow Null)

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Mantenimiento de Portfolios en Administración**
*   **Dado que** un usuario con rol `ADMINISTRADOR` accede al Panel de Administración...
*   **Cuando** navega a la nueva pestaña "Portfolios"...
*   **Entonces** puede realizar operaciones CRUD (Crear, Leer, Editar, Eliminar) solicitando únicamente "Nombre" y "Descripción". (Nota: No se puede eliminar un portfolio si tiene proyectos asignados).

**Escenario 2: Asignación Opcional de Portfolio a un Proyecto**
*   **Dado que** un PM crea o edita un proyecto...
*   **Cuando** visualiza la cabecera principal...
*   **Entonces** debe existir un desplegable llamado "Portfolio" listando las opciones creadas por administración, incluyendo la opción por defecto "Sin asignar".
*   **Y Cuando** guarda el proyecto sin seleccionar portfolio...
*   **Entonces** el backend permite el guardado correctamente, almacenando un valor nulo en la base de datos.

**Escenario 3: Uso del Combobox Multiselección de Tags**
*   **Dado que** el PM quiere categorizar su proyecto...
*   **Cuando** hace clic en el nuevo campo "Tags" y empieza a escribir una palabra...
*   **Entonces** el componente predictivo debe mostrar un listado con los tags existentes en el sistema que coincidan con su texto.
*   **Y Cuando** selecciona uno, el tag se añade como una "píldora" (badge) en el campo, permitiendo buscar y añadir más tags (multiselección).

**Escenario 4: Creación de un Nuevo Tag "Al vuelo"**
*   **Dado que** el PM busca un tag (ej. "IA Generativa") que aún no existe en el sistema global...
*   **Cuando** escribe el texto completo y no hay resultados...
*   **Entonces** el componente predictivo debe mostrar la opción "Crear etiqueta: IA Generativa".
*   **Y Cuando** el usuario hace clic...
*   **Entonces** el sistema registra el tag en la BBDD silenciosamente, lo selecciona para este proyecto, y a partir de ese momento, el tag "IA Generativa" estará disponible en el autocompletado del resto de proyectos de la empresa.