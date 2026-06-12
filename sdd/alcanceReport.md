# 📑 SYSTEM SPECIFICATION: MANAGEMENT, AUDITED COMMENTS & ATOMIC REPORTING

## 1. RESUMEN DEL COMPOSITE DE CAMBIOS
Este documento detalla la infraestructura técnica para la gestión de accesos, el control de estados dinámicos, el sistema de comentarios enriquecidos y el motor de reportes atómicos del PPM. El sistema prioriza el filtrado selectivo de información cualitativa para generar dossieres ejecutivos limpios de ruido operativo.

---

## 2. MODELO DE DATOS (BASE DE DATOS)

### 2.1 Entidades Maestras (Configuración y Accesos)

#### `Estados_Proyecto` (Mantenimiento Admin)
* `id_estado` (UUID / Autonumérico, PK)
* `nombre_estado` (VARCHAR) - *Ej: "Kickoff", "Validación Técnica", "Cierre"*
* `icono` (VARCHAR, Nullable) - *String identificador del icono visual.*
* `orden` (INTEGER) - *Orden secuencial en el flujo de trabajo (16-17 estados).*

#### `Usuarios` (Mantenimiento Admin)
* `id_usuario` (UUID / Autonumérico, PK)
* `nombre` (VARCHAR)
* `apellidos` (VARCHAR)
* `correo` (VARCHAR, Unique)
* `password` (VARCHAR) - *Encriptada mediante hash.*
* `perfil` (ENUM) - *Valores: `[ADMINISTRADOR, PM, DIRECTOR]`.*
* `activo` (BOOLEAN, Default True) - *Control logístico de baja (sin borrar histórico).*

### 2.2 Entidades Transaccionales (Hitos y Auditoría)

#### `Comentarios_Proyecto`
* `id_comentario` (UUID / Autonumérico, PK)
* `id_proyecto` (FK linking `Proyectos.id_proyecto`, On Delete Cascade)
* `id_usuario` (FK linking `Usuarios.id_usuario`) - *Autor original.*
* `texto_comentario` (LONGTEXT) - *Contenido HTML del editor.*
* `es_importante` (BOOLEAN, Default False) - *Filtro crítico: Si es True, se resalta en la UI y se incluye en los reportes.*
* `fecha_registro` (TIMESTAMP) - *Fecha/hora de creación automática.*
* **Campos de Auditoría:**
  * `editado` (BOOLEAN, Default False)
  * `id_usuario_modificacion` (FK `Usuarios.id_usuario`, Nullable)
  * `fecha_modificacion` (TIMESTAMP, Nullable)

---

## 3. INTERFAZ DE USUARIO (UI/UX) & COMPORTAMIENTO

### 3.1 Selector de Key Users (Escalabilidad)
* **UI:** Componente Combobox con **filtro de texto predictivo (Autocomplete/Typeahead)**.
* **Lógica:** Al desplegarse para gestionar proyectos, agrupa a los KUs por Proveedor. Los Key Users pertenecientes al registro de la empresa **"Dacsa"** deben listarse fijados en la parte superior de forma prioritaria.

### 3.2 Muro de Comentarios y Editor WYSIWYG
* **UI:** Timeline vertical cronológico inverso (lo más reciente arriba).
* **Control de Entrada:** Editor de texto enriquecido (WYSIWYG) con soporte nativo para portapapeles de **Microsoft Outlook** (permitiendo copiar hacia Outlook o pegar desde Outlook manteniendo tablas, listas e imágenes limpias).
* **Selector de Importancia (Flag del Informe):** Junto al botón de guardar del comentario, se debe incluir un Checkbox o Toggle visualmente destacado: **`[ ] Marcar como Importante (Incluir en Informe)`**.
* **Lógica de Edición (Inmutabilidad Informativa):** Cualquier edición permitida sobre un comentario activará el flag `editado = True` y mostrará de forma estricta un log informativo visible: `"Editado por [Nombre Apellidos] el [Fecha] a las [Hora]"`.

### 3.3 Módulo de Administración (Exclusivo Perfil `ADMINISTRADOR`)
Sección restringida mediante guardas de rutas en Front y Back para la gestión de:
1. **Mantenimiento de Estados:** CRUD para gestionar nombres, iconos y el número de `orden` de los 16-17 estados del workflow.
2. **Mantenimiento de Usuarios:** CRUD sencillo para gestionar el alta, datos y estado (`activo/inactivo`) del personal.

---

## 4. MOTOR DE REPORTES (SISTEMA ATÓMICO Y CONCATENADO)

El motor de reportes opera bajo demanda y extrae la información de manera individual por proyecto. Si se ejecuta de forma masiva, empaqueta los resultados secuencialmente.

### 4.1 Comportamiento según el origen de ejecución

* **Desde la Ficha de un Proyecto:** El usuario pulsa `[📄 Generar Informe]`. El sistema procesa y descarga el documento exclusivo de ese proyecto.
* **Desde la Pantalla "Control Ejecutivo":** El usuario pulsa `[📊 Exportar Informe de Portfolio]`. 
  1. El sistema lee los proyectos visibles en el grid según los filtros activos (**Rango de Fechas** y/o **Project Manager**).
  2. Ejecuta el motor del reporte para cada proyecto de forma individual (*Bucle/Loop*).
  3. **Concatenación:** Une los bloques resultantes en un único archivo continuo, aplicando un salto de página forzado (`page-break-after: always`) entre cada proyecto para generar un dossier ordenado.

### 4.2 Estructura Obligatoria del Bloque de Proyecto en Reporte

Cada segmento del reporte debe estructurarse estrictamente con los siguientes datos:
1. **KPIs de Control (Deterministas):**
   * Cabecera con metadatos: ID, Nombre, PM, Proveedor y Estado (con su icono).
   * Línea de tiempos: Comparativa entre `Fecha Fin Inicial` y `Fecha Fin Estimada` (retrasos calculados mediante Cambios de Alcance aprobados resaltados en **ROJO**).
   * Estado financiero: Contraste entre `Budget Inicial` y Gasto Comprometido (Suma de Facturas Pagadas + 'PENDIENTE_DE_RECIBIR'). Alerta visual si se supera el presupuesto original.
   * Hitos: Tabla resumen con los últimos 3 hitos completados y los próximos 3 pendientes.
2. **Sección Cualitativa Filtrada (Muro Ejecutivo):**
   * **Regla de Extracción Crítica:** El reporte **SOLO** extraerá e imprimirá los comentarios de la base de datos donde `es_importante == True`. Cualquier comentario operativo ordinario se omite del documento final.
   * Los comentarios se pintarán con su formato HTML original, mostrando su autor, fecha y el log de auditoría si fue modificado.

---

## 5. CORRECCIÓN DE BUGS GENERALES

### 🐛 Bug de Fechas en Tareas / Hitos
* El sistema presenta un bloqueo al persistir hitos debido al formato del input. Se fuerza la estandarización estricta en toda la aplicación (Front-end, API y Base de Datos) al formato **ISO 8601 (`YYYY-MM-DD`)**. El backend rechazará con una excepción controlada cualquier trama de datos que no cumpla esta estructura de persistencia.