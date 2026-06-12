# Alcance: Selector Dinámico de Visibilidad de Columnas

## 1. Objetivo de la Mejora
Implementar un selector de columnas (dropdown con checkboxes) en las tablas de datos de la vista de "Proyectos" y del "Executive Portfolio Dashboard" (/governance). El usuario podrá marcar o desmarcar qué columnas desea visualizar en tiempo real para adaptar la herramienta a sus necesidades de revisión, optimizando el espacio visual.

## 2. Impacto en la Base de Datos / Backend
*   **Base de Datos / SQLite:** Ninguno. La información extraída seguirá siendo la misma [3, 4].
*   **Backend (Express):** Ninguno. La API seguirá devolviendo el objeto del proyecto completo. Esta funcionalidad es 100% de presentación (Frontend).

## 3. Impacto en el Frontend (React 19)
*   **Gestión de Estado Persistente:** Crear un estado (ej. `visibleColumns`) que almacene un objeto o array con el identificador de cada columna y su valor booleano (`true`/`false`). Este estado debe leerse y guardarse en el `localStorage` del navegador para que el usuario no pierda su configuración al recargar la página.
*   **Componente de UI (ColumnSelector):** Crear un nuevo componente reutilizable, representado por un botón con un icono de Lucide React (ej. `Columns` o `Settings2`). Al hacer clic, debe desplegar un menú estilo *glassmorphic* con checkboxes para cada columna disponible.
*   **Renderizado Condicional:** Modificar el código de las tablas (`<thead>`, `<th>`, `<tbody>` y `<td>`) para que cada celda verifique si su columna correspondiente está en estado `true` antes de renderizarse.

## 4. Reglas de Negocio
*   **Columnas Fijas (Inmutables):** Deben existir columnas que el usuario **no pueda ocultar** para garantizar que la tabla no pierda su sentido (por ejemplo, el Nombre del Proyecto y el Estado). Estas opciones deben aparecer deshabilitadas/bloqueadas en el selector.
*   **Adaptabilidad UI:** Al ocultar columnas, la tabla debe usar CSS dinámico (preferiblemente `width: 100%` con distribución automática) para que las columnas visibles se expandan y aprovechen el espacio vacío dejado por las columnas ocultas.
*   **Consistencia de Exportación:** Al igual que en la mejora de los filtros, si el usuario exporta a Excel o a PDF el informe de la tabla, el archivo generado **solo debe incluir las columnas que el usuario tiene visibles en ese momento**.

## 5. Pasos a seguir (Instrucciones para el IDE)
1.  **Paso 1 (Hook de Estado Persistente):** Crea un custom hook (ej. `useTableColumns`) o define un estado local en las vistas que se inicialice comprobando si existe una configuración guardada en `localStorage` (ej. `ppm-projects-columns`). Si no existe, que cargue todas las columnas como `true` por defecto.
2.  **Paso 2 (Creación del Componente):** Crea el componente `<ColumnSelector />` pasándole por *props* el estado de las columnas y la función para actualizarlas. Usa el diseño *glassmorphic* para el panel desplegable y añade un botón "Restablecer por defecto".
3.  **Paso 3 (Implementación en Proyectos):** Ve a la vista del listado de Proyectos. Renderiza el `<ColumnSelector />` en la barra superior (junto a los filtros y botones de exportación). Envuelve cada bloque `<th>` y `<td>` de la tabla en una condición (ej. `{visibleColumns.budget && <td>{proyecto.budget}</td>}`).
4.  **Paso 4 (Implementación en Portfolio /governance):** Repite el Paso 3 para la tabla de consolidado que se muestra en la vista del Executive Portfolio Dashboard.
5.  **Paso 5 (Ajuste de Exportaciones):** Revisa las funciones que generan los Excels/Informes. Modifícalas para que iteren sobre el estado `visibleColumns` y excluyan del archivo final las columnas que estén marcadas como `false`.