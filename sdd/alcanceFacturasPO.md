# Alcance: Integración de Campo PO (Purchase Order) en Facturas

## 1. Objetivo de la Mejora
Añadir un nuevo campo de texto denominado "PO" (Purchase Order) al registro de facturas. Este campo servirá como nexo de unión entre la plataforma PPM y el ERP de la empresa, facilitando la trazabilidad financiera.

## 2. Impacto en la Base de Datos / Backend
*   **Modelo de Base de Datos (SQLite / Sequelize):** Modificar el modelo de la entidad `Facturas` para incluir un nuevo atributo `PO` de tipo `STRING` [1, 3].
*   **Controladores de API (Express):** Actualizar los endpoints de creación (`POST`) y edición (`PUT`) de facturas para que acepten, validen y guarden el campo `PO` proveniente del cuerpo de la petición (`req.body`) [3].

## 3. Impacto en el Frontend (React 19)
*   **Formularios:** Añadir un `input` de texto para la "PO" en el formulario o modal donde los Project Managers suben y editan las facturas [3].
*   **Tablas de Datos:** Incorporar una nueva columna "PO" en la tabla de facturas dentro del detalle del proyecto.
*   **Integración con Selector de Columnas:** Asegurar que esta nueva columna "PO" esté soportada por el selector dinámico de visibilidad de columnas (implementado en la mejora anterior).

## 4. Reglas de Negocio
*   **Formato de Texto Libre:** El campo debe ser de tipo texto alfanumérico para soportar cualquier formato de codificación que utilice el ERP (ej. "PO-2026-00145").
*   **Campo Opcional:** El campo debe permitir valores nulos/vacíos (`allowNull: true`), ya que en ocasiones un PM puede registrar una factura preventiva en estado `PENDIENTE_DE_RECIBIR` para alertar del bloqueo de presupuesto y contabilizar el consumo real antes de que el departamento de Compras genere la PO oficial [2].
*   **Exportación de Datos:** El campo PO debe incluirse en los reportes financieros o exportaciones a Excel del proyecto.

## 5. Pasos a seguir (Instrucciones para el IDE)
1.  **Paso 1 (Backend - Modelo):** Ve a la carpeta `/backend` y localiza el archivo donde se define la entidad `Facturas` con Sequelize. Añade el campo `PO: { type: DataTypes.STRING, allowNull: true }`. Asegúrate de que la tabla en SQLite se actualice correctamente (usando migraciones o `alter: true`) [3].
2.  **Paso 2 (Backend - API):** Modifica el controlador de facturas para asegurarte de que cuando se crea o actualiza el registro, el campo `PO` se extrae correctamente del `req.body` y se guarda en la base de datos.
3.  **Paso 3 (Frontend - UI Formulario):** En el frontend (React 19), localiza el componente del formulario de facturas. Añade un nuevo `input` de texto con la etiqueta "PO (ERP)" o "Purchase Order" y enlaza su valor al estado del formulario [3].
4.  **Paso 4 (Frontend - UI Tabla):** En la vista de detalle financiero del proyecto, añade el encabezado "PO" a la tabla que lista las facturas.
5.  **Paso 5 (Actualización de Exportaciones):** Incluye la variable `PO` en las funciones que exportan los datos financieros, respetando la lógica de las columnas visibles para el usuario.

