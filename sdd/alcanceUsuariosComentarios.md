# 📑 SPECIFICATION UPDATE: AUTHENTICATION, CONFIGURABLE STATES, SEARCHABLE KUS & AUDITED LOGS

## 1. RESUMEN DE LOS CAMBIOS
Este documento actualiza el PRD original para transformar el sistema en una plataforma multiperfil escalable. Se elimina el harcodeo de estados, se soluciona el cuello de botella de la selección de Key Users (KUs), se corrige un bug crítico de fechas y se añade un módulo de comentarios enriquecidos (compatibles con Outlook) por proyecto, junto con un sistema de auditoría interna de modificaciones y control de accesos.

---

## 2. CAMBIOS EN EL MODELO DE DATOS (BASE DE DATOS)

### 2.1 ❌ MODIFICAR / DESHACER
* **Tabla `Proveedores`:** Sustituir la semilla de datos (seed) anterior que obligaba a registrar `"Mi Empresa"` por el nombre oficial de la organización: **`"Dacsa"`**.
* **Tabla `Proyectos` (Campo `estado_proyecto`):** Eliminar el tipo `ENUM` o el string plano harcodeado. Ahora este campo se convierte en una Clave Foránea (**FK**) que apunta a la nueva tabla maestra de estados.
* **Campo `Proyectos.id_pm`:** Ya no apunta a un "Staff interno" genérico; ahora debe vincularse como Clave Foránea (**FK**) directamente a la nueva tabla maestra de `Usuarios`.

### 2.2 ➕ NUEVAS ENTIDADES & CAMPOS

#### Nueva Entidad Master: `Estados_Proyecto`
Centraliza los 16-17 estados requeridos para el workflow del portfolio.
* `id_estado` (UUID / Autonumérico, PK)
* `nombre_estado` (VARCHAR) - *Ej: "Kickoff", "Validación Técnica", "Cierre"*
* `icono` (VARCHAR, Nullable) - *Almacena el string, ruta o identificador del icono visual.*
* `orden` (INTEGER) - *Determina la posición secuencial exacta en el flujo de trabajo.*

#### Nueva Entidad Master: `Usuarios`
Soporte para el mantenimiento de usuarios interno y control de login/perfiles.
* `id_usuario` (UUID / Autonumérico, PK)
* `nombre` (VARCHAR)
* `apellidos` (VARCHAR)
* `correo` (VARCHAR, Unique)
* `password` (VARCHAR) - *Encriptada mediante hash en backend.*
* `perfil` (ENUM) - *Valores estrictos: `[ADMINISTRADOR, PM, DIRECTOR]`.*
* `activo` (BOOLEAN, Default True) - *Permite deshabilitar el acceso al usuario sin borrar su histórico de acciones o proyectos.*

#### Nueva Entidad Transaccional: `Comentarios_Proyecto`
Muro de comunicación histórico dentro de cada proyecto con soporte de auditoría.
* `id_comentario` (UUID / Autonumérico, PK)
* `id_proyecto` (FK linking `Proyectos.id_proyecto`, On Delete Cascade)
* `id_usuario` (FK linking `Usuarios.id_usuario`) - *Autor original.*
* `texto_comentario` (TEXT / LONGTEXT) - *Almacena el contenido en formato HTML generado por el editor.*
* `fecha_registro` (TIMESTAMP) - *Fecha y hora de creación automática.*
* **Campos de Auditoría (Logs de Edición):**
  * `editado` (BOOLEAN, Default False) - *Flag indicador.*
  * `id_usuario_modificacion` (FK linking `Usuarios.id_usuario`, Nullable) - *Quién realizó la última edición.*
  * `fecha_modificacion` (TIMESTAMP, Nullable) - *Cuándo se realizó la última edición.*

---

## 3. REQUERIMIENTOS DE INTERFAZ DE USUARIO (UI/UX) & COMPORTAMIENTO

### 3.1 Selector de Key Users (Escalabilidad de 10 a 100+)
* **UI Nueva:** Reemplazar los componentes de selección simple o checkbox por un **Combobox con buscador/filtro de texto predictivo (Typeahead/Autocomplete)**.
* **Lógica de datos:** Al desplegarse, el buscador debe agrupar visualmente a los Key Users por su empresa (Proveedor). Los pertenecientes a **Dacsa** deben aparecer prioritariamente en la parte superior del listado.

### 3.2 Sección de Comentarios (Dentro de la ficha de Proyecto)
* **UI Nueva:** Un Timeline o feed vertical cronológico inverso (el más reciente arriba).
* **Editor WYSIWYG (Texto Enriquecido):** El campo de entrada de texto debe ser un editor enriquecido (Ej: TipTap, Quill o CKEditor) que cumpla estrictamente con:
  * Formatos básicos: Negrita, cursiva, listas ordenadas/desordenadas y colores de texto.
  * **Compatibilidad con Microsoft Outlook:** El editor debe procesar correctamente el portapapeles (Clipboard). Debe permitir **pegar texto e imágenes directamente desde Outlook** manteniendo el formato HTML limpio, y permitir **seleccionar y copiar el comentario de la app para pegarlo en un correo de Outlook** sin romper el diseño ni las listas.
* **Lógica de Edición e Inmutabilidad Informativa:**
  * El sistema permite la edición de un comentario por cualquier perfil con acceso.
  * Al guardar los cambios, el comentario se marcará visualmente con la etiqueta `(Editado)`.
  * La UI mostrará de forma informativa un tooltip o texto de log integrado: `"Editado por [Nombre Apellidos] el [Fecha] a las [Hora]"`, recuperando los datos de los campos de auditoría.

### 3.3 Módulo de Administración (Acceso exclusivo a perfil `ADMINISTRADOR`)
Se restringe el acceso total a esta sección al resto de perfiles. Contiene dos mantenimientos:
1. **Mantenimiento de Estados:** CRUD simple para gestionar los 16-17 estados. Permite subir el icono asociado y definir el número de `orden` para organizar el flujo del portfolio.
2. **Mantenimiento de Usuarios:** Formulario para altas, bajas (marcar como inactivo) y modificaciones de personal interno con los campos: *Nombre, Apellidos, Correo, Perfil, Contraseña y Checkbox de Activo/Inactivo*.

---

## 4. CORRECCIÓN DE BUGS (BUG FIXES)

### 🐛 Bug en Formato de Fechas en `Tareas / Hitos`
* **Problema detectado:** El sistema bloquea el flujo y no permite guardar tareas/hitos debido a una discrepancia en el parseo del formato de fechas entre el componente del Front-end (Datepicker) y la API/ORM del Back-end.
* **Solución requerida:** Estandarizar toda la capa de persistencia a formato **ISO 8601 (`YYYY-MM-DD`)**. El backend debe validar y de lo contrario rechazar cualquier input de fecha que no cumpla con este formato antes de intentar insertarlo en la base de datos, devolviendo un error controlado y limpio a la interfaz.