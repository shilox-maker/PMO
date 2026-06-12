# Alcance: Optimización y Unificación de Filtros y Exportaciones

## 1. Objetivo de la Mejora
Mejorar la usabilidad (UX) de los filtros en la plataforma y unificar la experiencia entre la vista de Proyectos y el Executive Portfolio Dashboard (/governance). Los objetivos clave son:
1. Hacer que el filtro de Estados sea colapsable para ahorrar espacio visual.
2. Corregir el bug que resetea el filtro de Estados al modificar otros filtros (como el de PM).
3. Trasladar el filtro de Estados a la vista principal de Proyectos.
4. Igualar los filtros: llevar todos los filtros existentes en la página de Proyectos a la página de KPIs de Portfolio.
5. Reubicar los botones de Exportar Informe y Exportar Excel para que estén junto a la barra de filtros en el Portfolio.

## 2. Impacto en la Base de Datos / Backend
*   **Base de Datos (SQLite):** Sin cambios en las tablas.
*   **Backend (API Express):** 
    *   Revisar el endpoint que alimenta los KPIs del Portfolio (`/governance`). Dado que vamos a añadirle nuevos filtros que antes solo existían en Proyectos, el controlador del backend deberá aceptar estos nuevos parámetros en la `query` y aplicarlos al filtrado de la base de datos antes de devolver el conteo y los KPIs calculados.
    *   Asegurar que el endpoint de Proyectos también acepta el filtrado por Estado (leyendo del maestro de `Estados_Proyecto`).

## 3. Impacto en el Frontend (React 19)
*   **Gestión de Estado de Filtros:** Modificar los `useState` o el objeto de filtros para asegurar que las actualizaciones son parciales (usando el *spread operator* `...prevFilters`) y no sobrescriben todo el estado, evitando así que al cambiar de PM se pierda el Estado seleccionado.
*   **Componente Colapsable:** Crear un contenedor expansible/colapsable (usando iconos como `ChevronDown` y `ChevronUp` de Lucide React) para envolver los botones de filtrado por Estado.
*   **Unificación de UI:** Mover los botones de exportación (Excel e Informe) dentro o justo al lado del contenedor de la barra de filtros en la vista `/governance`.
*   **Replicación de Componentes:** Copiar los inputs/selects de filtros que existan en la vista de Proyectos (ej. búsqueda por texto, tipología, etc.) hacia la vista de KPIs de Portfolio.

## 4. Reglas de Negocio
*   **Filtros Combinados:** Todos los filtros deben actuar en conjunto (operación `AND`). Si selecciono un PM, un Estado y un texto, la vista debe reflejar la intersección de los tres.
*   **Exportaciones Fieles:** Las exportaciones a Excel y los Informes deben descargar la información **exactamente como está filtrada** en la pantalla en ese momento, respetando todos los filtros activos combinados.
*   **Estados Dinámicos:** Los botones del filtro de Estados deben seguir leyéndose dinámicamente de la base de datos, soportando la configuración de la tabla maestra.

## 5. Pasos a seguir (Instrucciones para el IDE)
1.  **Paso 1 (Fix de Estado en /governance):** Localiza la vista del Portfolio Dashboard y corrige la función que maneja los cambios en los filtros (ej. `handleFilterChange`). Asegúrate de que actualiza el estado manteniendo el resto de filtros intactos (`setFilters(prev => ({...prev, [key]: value}))`).
2.  **Paso 2 (UI Colapsable de Estados):** En esa misma vista, envuelve la botonera de filtrado por Estado en un `div` que se oculte/muestre mediante un estado booleano (`isStatesOpen`), añadiendo un botón con el texto "Filtro por Estados" y un icono de Lucide React (`ChevronDown` / `ChevronUp`).
3.  **Paso 3 (Unificación de Filtros - De Proyectos a Portfolio):** Revisa el componente de la lista de Proyectos, identifica qué filtros adicionales hay (búsqueda, tipo, etc.) y cópialos a la barra de filtros del Portfolio Dashboard (`/governance`). Asegúrate de que el frontend envía estos nuevos parámetros a la API del Portfolio y que el backend los procesa.
4.  **Paso 4 (Traslado del Filtro de Estados a Proyectos):** Toma el nuevo componente colapsable de Estados que acabas de hacer y añádelo también a la página de Proyectos, permitiendo a los usuarios filtrar la tabla principal por estado.
5.  **Paso 5 (Reubicación de Botones de Exportación):** En la vista de Portfolio Dashboard, mueve los componentes/botones que disparan la generación del Reporte y el Excel para que queden alineados a la derecha de (o inmediatamente debajo de) la nueva barra unificada de filtros.