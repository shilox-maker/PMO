# CHANGELOG

## [2.0.0] - 2026-06-18
### Added
- **Configuración de Comités Centralizada e Inline**:
  - Toda la configuración de comités y gobernanza (Semanal, Mensual y SteerCo) se gestiona de forma interactiva e inline directamente en la pestaña de **Comunicaciones** mediante el componente modular `CommitteeEditForm`.
  - Se eliminó la sección "Comités y Canales de Comunicación" del modal general de edición del proyecto (`ProjectEditModal.jsx`).
- **Integración de Empresa en Participantes**:
  - Los participantes de los comités y de la matriz RACI ahora se listan mostrando su empresa asociada (obtenida de partner/proveedor) además de su nombre y rol técnico.
- **Rango de Selección Limitado a RACI**:
  - Al editar comités, los participantes seleccionables se restringen estrictamente a los miembros de la **Matriz RACI** del proyecto.
- **Colores Personalizados en Matriz RACI**:
  - Los badges visuales de la matriz RACI muestran colores diferenciados cuando están activos: **R** (Responsable) en Rojo, **A** (Aprobador) en Azul, **C** (Consultado) en Verde e **I** (Informado) en Amarillo.

### Fixed
- **Despliegue del Selector de Colores en Comentarios**:
  - Se resolvió el recorte visual del selector de color de texto en el muro de comentarios (`RichTextEditor.jsx`) eliminando `overflow: hidden` del contenedor del editor y redondeando las esquinas superiores del Toolbar.

## [1.7.11] - 2026-06-18
### Fixed
- **Migración 13 para Cambios_Alcance**: Creada la migración `13_add_contactos_to_cambios_alcance.js` para añadir las columnas `id_solicitante_contacto` y `id_aprobador_contacto` a la tabla `Cambios_Alcance`, resolviendo errores de base de datos en producción.
- **Configuración de Proxy de Confianza**: Habilitada la opción `trust proxy` en Express para asegurar el correcto funcionamiento del limitador de tasa (`express-rate-limit`) detrás de túneles de Cloudflare.
- **Suite de Pruebas**: Corregida la referencia obsoleta a `KeyUsers` por `ContactosProveedor` en la suite de pruebas unitarias (`api.test.js`).

## [1.7.10] - 2026-06-18
### Added
- **Filtro de Proyectos Abiertos en KPIs PMO**: Añadido un botón rápido en la vista de KPIs para prefiltrar proyectos "Abiertos" excluyendo automáticamente los estados de cierre (CERRADO, CANCELADO, FINALIZADO, COMPLETADO, PARKING).
- **Mejora de Detalles de KPI**: Al hacer clic en las tarjetas de KPI (Desborde, CAPEX, Gobernanza, etc.) se muestran en detalle los proyectos que componen el KPI y sus estados.
## [1.7.9] - 2026-06-17
### Added
- **Ciclo de Vida de Proyectos (12 estados)**: Refactorización corporativa completa del flujo de estados, reduciendo de 16 a 12 fases estandarizadas: Petición, Alcance, Aprobación, Planificación, Kickoff, En Ejecución, Go Live, Soporte Post-GoLive, Cierre, Cancelado, En Pausa y Deprioritizado.
- **Trazabilidad de Hitos**: Nuevos campos de fecha en `Proyectos` (`fecha_peticion`, `fecha_alcance_definido`, `fecha_aprobacion`, `fecha_planificacion`, `fecha_kickoff`, `fecha_go_live`, `fecha_cierre`) para registrar la fecha real de cada hito del ciclo de vida.
- **Tarjeta "Hitos del Ciclo de Vida"**: Nueva sección en la vista de detalle del proyecto con línea de tiempo visual de hitos, indicadores de estado y formulario de edición inline.
- **Auto-relleno inteligente de fechas**: El backend auto-rellena `fecha_kickoff` y `fecha_go_live` con la fecha actual al cambiar el estado a "Kickoff" o "Go Live" respectivamente (solo si el campo estaba vacío), registrando un comentario de auditoría automático en el muro del proyecto.
- **Validación ISO 8601**: Validación de formato `YYYY-MM-DD` para todos los campos de fecha del ciclo de vida en los endpoints POST y PUT de proyectos.
- **Migración `08_lifecycle_migration.js`**: Añade las 7 columnas de fecha a la tabla `Proyectos` y mapea los estados históricos a los 12 nuevos estados corporativos.
- **Timeline actualizado**: Las barras del timeline de proyectos ahora respetan `fecha_kickoff` (inicio) y `fecha_go_live` (fin) en lugar de las fechas genéricas de proyecto.

## [1.7.8] - 2026-06-17
### Added
- **Matriz RACI para Key Users**: Integración visual avanzada en la vista de detalle del proyecto que sustituye al listado simple de Key Users. Permite definir uno de los 10 roles funcionales para los participantes y configurar responsabilidades RACI individuales (Responsable, Aprobador, Consultado, Informado).
- **Acciones Rápidas**: Posibilidad de modificar o retirar participantes del proyecto directamente desde la tabla RACI.
- **Base de Datos y Migración**: Creada la migración `07_add_raci_to_proyecto_keyusers.js` para añadir las columnas `rol` y `raci` a `Proyecto_KeyUsers`, con migración histórica automática para preservar la retrocompatibilidad.
- **Robustez de Red**: Modificado el parsing de respuestas HTTP del frontend en [ProjectDetail.jsx](file:///c:/PruebasIA/PMO/frontend/src/pages/ProjectDetail.jsx) para validar la cabecera `content-type` de la respuesta y evitar que un error HTTP no-JSON se reporte como fallo de parsing `JSON.parse`.

## [1.7.7] - 2026-06-17
### Added
- Report generation now includes an interactive Checklist Modal allowing customization of sections (Resumen, Hitos, Timeline, Riesgos, Incidencias, Cambios de Alcance, Lecciones Aprendidas).
- Timeline section can be optionally included in the report, rendering a beautiful vertical sequence of milestones and tasks.

### Changed
- Refactored Invoice Status: removed "PAGADA" option and renamed/set the active statuses to "PENDIENTE DE RECIBIR" and "RECIBIDA".
- Updated all test/seed data invoices to use "RECIBIDA" instead of "PAGADA".

## [1.7.6] - 2026-06-17
### Added
- Project-specific timeline (miniature) integrated in the General tab of project detail view.
- Checkbox "Pertenece al Grupo Dacsa" in the Vendor Directory modals (create/edit) to allow multi-society settings for Dacsa.
- Support in "Planes Inactivos" card to act as a drilldown filter on click.
- Column header and control for "Último Comentario" in the Governance Dashboard table.

### Fixed
- Fixed backend database constraint validation by replacing `id_autor` with `id_usuario` inside PUT `/api/projects/:id_proyecto` audit comments hooks.
- Aligned Governance and Inactive Plans cards horizontally with Overrun and CAPEX cards in a clean layout.

## [1.7.5] - 2026-06-16
### Fixed
- Allow bold (b) and italic (i) tags in sanitizeHTML for comments.

## [1.7.4] - 2026-06-16
### Fixed
- Duplicate app.listen error.
- CORS cloudflare issues.
- Evolutivo UI features complete.

# Changelog

Todas las novedades y cambios notables del sistema **Gobernanza PPM** se registrarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [SemVer (Versionado Semántico)](https://semver.org/spec/v2.0.0.html).

---

## [1.7.0] - 2026-06-13

### Añadido
- **Suite de Pruebas Funcionales**:
  - Pruebas E2E en Frontend configuradas con **Playwright**.
  - Pruebas de integración API en Backend configuradas con **Jest** y **Supertest** (usando SQLite en memoria).
- **Timeline / Gantt de Portfolio**:
  - Nueva vista global temporal de todos los proyectos activos.
  - Representación visual con barras coloreadas según el estado RAG del proyecto.
  - Hitos de proyecto integrados como diamantes interactivos con tooltips (estado y fecha límite).
  - Tres niveles de zoom temporal dinámico: Trimestral, Mensual y Semanal.
  - Filtros en tiempo real por RAG, PM y toggle para mostrar proyectos cerrados.
  - Marcador dinámico del día "Hoy" y scroll automático a la posición temporal actual.
  - Desarrollo 100% nativo con CSS/React, manteniendo compatibilidad total con los tres temas del sistema (Claro, Oscuro, Dacsa) sin dependencias de terceros.
  - Nuevo endpoint en backend (`GET /api/timeline`) optimizado para servir datos de fechas e hitos.

---

## [1.6.0] - 2026-06-12

### Añadido
- **Cambio de Contraseña (Autoservicio)**:
  - Nueva política de seguridad estricta para contraseñas (mínimo 10 caracteres, combinando mayúsculas, minúsculas, números y caracteres especiales).
  - Implementación de Salts (`password_salt`) para el hashing SHA-256 en base de datos.
  - Endpoint dedicado `/api/users/me/change-password` y modal flotante en la interfaz del usuario.
  - **Retrocompatibilidad**: Auto-migración silenciosa de seguridad al hacer login con contraseñas heredadas sin salt.
- **Sistema Formal de Migraciones de Base de Datos**:
  - Sustitución de sincronización automática de Sequelize por control programático con `umzug` en el arranque.
  - Nuevos scripts de utilidad `npm run migrate` y `npm run migrate:undo`.
- **Automatización de Despliegue DevOps**:
  - Script maestro `deploy.sh` en la raíz para ejecutar actualizaciones `zero-downtime` o controladas contra fallos (`set -e`).
  - Extracción automática de URLs públicas en túneles temporales de Cloudflared vía logs de PM2.

---

## [1.5.0] - 2026-06-12

### Añadido
- **Campo PO (Purchase Order)**: Añadido en la vista de Facturas (Frontend & Backend).
- **Selector de Columnas para PO**: Incluido PO en los selectores dinámicos del Dashboard y Governance Dashboard.
- **Exportaciones con PO**: Añadido listado de POs en las exportaciones a Excel de Proyectos y datos consolidados del backend.

---

## [1.4.2] - 2026-06-12

### Añadido
- **Unificación de Filtros**: Inclusión de panel de segmentación por estado de proyecto tanto en la vista Proyectos como en el Executive Portfolio Dashboard, con renderizado colapsable estilo *glassmorphic*.
- **Mejora Visual de Filtros**: Igualación a píxel de contenedores, márgenes y `grid` (flex vs. block layout) entre las vistas de Proyectos y Governance.
- **Exportaciones Unificadas**: Alineación de los botones de informe (PDF) y exportación a Excel dentro del header de los filtros principales en ambas vistas.

### Cambiado
- **Tema Dacsa (Accesibilidad)**: Refactorizado `index.css` de variables rgba() semitransparentes a colores sólidos HEX para mejorar el contraste del texto sobre fondos grises/blancos.

### Arreglado
- Corrección de `ReferenceError` en el Frontend provocado por estados React sin envolver en la migración al estado unificado `filters` en Governance.
- Corrección de la sintaxis `where` y los filtros `$Estado.nombre_estado$` en backend (SQLite), trasladando las condiciones directamente al array `include` de Sequelize.
- Corrección de variables (`projectsData` -> `projects`) que provocaban cuelgues visuales en `Dashboard.jsx`.

---

## [1.4.1] - 2026-06-12

### Añadido
- **Configuración de Entornos Frontend**:
  - Implementación de variables de entorno mediante Vite (`VITE_API_URL`).
  - Creación de `.env` base para entorno local y `.envRaspberry` para despliegues en Raspberry.
  - Refactorización de todos los endpoints hardcodeados a variables dinámicas en los componentes del frontend.

---

## [1.4.0] - 2026-06-11

### Añadido
- **Exportación de Datos a Excel**:
  - Incorporación de la biblioteca `exceljs` en el backend para generar archivos Excel en el servidor y transmitirlos directamente al cliente.
  - Creación del endpoint `GET /api/projects/export` que calcula dinámicamente las variables financieras y de tiempos (Budget Actualizado, Consumo Real, Presupuesto Disponible, Fecha Fin Estimada) para cada proyecto basado en facturas y cambios de alcance.
  - Diseño estructurado en el reporte Excel con cabeceras temáticas oscuras (`#1A1A2E`) y formato adecuado para columnas de moneda (€) y fechas.
  - Botón interactivo "Exportar a Excel" en la vista de **Proyectos** (`Dashboard.jsx`), aplicando de manera directa los filtros de búsqueda técnica y RAG activos.
  - Botón interactivo "Excel de Portfolio" en **KPIs de Portfolio** (`GovernanceDashboard.jsx`), permitiendo exportar el conjunto de datos acotado por filtros temporales y gestor PM.

---

## [1.3.0] - 2026-06-11

### Añadido
- **Ordenación por Columnas en CRUDs**:
  - Implementación de ordenación dinámica e interactiva en todas las tablas y listados CRUD del frontend.
  - Ordenación alfabética para columnas de texto (usando `localeCompare` para soporte de acentos), numérica para valores y monedas, e ISO para campos de fechas.
  - Creación de una utilidad centralizada de ordenación `frontend/src/utils/sorting.js` con soporte para resolver rutas anidadas en objetos de datos (ej: `PM.nombre`, `calculations.budget_actualizado`).
  - Indicadores visuales premium en las cabeceras de las tablas (`ArrowUp` ⬆️, `ArrowDown` ⬇️ y `ArrowUpDown` ⇅ de Lucide Icons) para reflejar de forma intuitiva el estado y la dirección de la ordenación activa.
  - Tablas afectadas:
    - **Dashboard de Proyectos**: Código, Nombre, Estado, RAG, Partner, PM, Sede, Presupuesto, Progreso de Gasto y Próximo Hito.
    - **Cuadrícula Ejecutiva**: Código, Proyecto, PM, RAG, Alerta de Tiempo, Alerta de Dinero y Próximo Hito.
    - **Panel de Administración**: Orden, Estado, Icono y Tipo (Workflow); Nombre, Correo, Perfil y Estado (Usuarios).
    - **Directorio de Socios**: Código, Razón Social, Teléfono y Correo.
    - **Ficha 360 de Partner**: Proyectos Administrados e Incidencias Históricas.
    - **Ficha de Detalle de Proyecto**: Facturas, Cambios de Alcance, Incidencias, Riesgos y Checklist de Tareas.

---

## [1.2.1] - 2026-06-11


### Solucionado
- **🐛 Bug de importación en `seed.js`**: Corregido el nombre incorrecto del modelo `ProyectoSteerCoKU` → `ProyectoComSteerCoKU` que impedía la re-inicialización correcta de la base de datos.
- **🗄️ Recreación de BD con esquema completo**: Ejecutado el seed con `force: true` para generar las tablas con todos los campos definidos en los modelos (`es_importante` en `Comentarios_Proyecto`, `proyecto_cerrado` en `Estados_Proyecto`), incluyendo datos de prueba realistas con comentarios marcados como importantes para el motor de reportes.

---

## [1.2.0] - 2026-06-11

### Añadido
- **Motor de Reportes Atómicos y Concatenados**:
  - Botón `📄 Generar Informe` en la cabecera de la ficha de detalle de cada proyecto.
  - Genera un HTML estructurado con estilos CSS de impresión (`@media print`) para exportar limpiamente a PDF.
  - Estructura del informe: KPIs de Control (fechas, presupuesto, desviaciones), Tabla de Hitos (últimos 3 completados + próximos 3 pendientes) y Muro Ejecutivo (solo comentarios importantes).
  - Botón `📊 Exportar Informe de Portfolio` en el Dashboard de Control Ejecutivo.
  - Recorre todos los proyectos filtrados, consulta la API para obtener el detalle completo, y concatena los bloques HTML con `page-break-after: always` entre cada proyecto.
  - Portada generada automáticamente con conteo de proyectos incluidos y fecha/hora de generación.
- **Flag de Importancia en Comentarios (`es_importante`)**:
  - Nuevo campo booleano `es_importante` en el modelo `Comentarios_Proyecto`.
  - Checkbox/toggle visual junto al botón de publicación: `⭐ Marcar como Importante (Incluir en Informe)`.
  - Resaltado visual premium para comentarios importantes: borde dorado/ámbar lateral, fondo cálido tintado y badge `⭐ Informe`.
  - El flag se mantiene editable al modificar un comentario existente.
  - Solo los comentarios con `es_importante = true` aparecen en los informes ejecutivos generados por el motor de reportes.
- **Campo `proyecto_cerrado` en `Estados_Proyecto`**:
  - Nuevo campo booleano para marcar los estados que representan un proyecto cerrado (ej: Cierre, Cancelado).
  - Editable en el Panel de Administración junto al nombre, icono y orden del estado.
  - Se persiste correctamente en la base de datos.
- **Multi-selección de Estados en Control Ejecutivo**:
  - Los botones de segmentación por estado ahora permiten seleccionar múltiples estados simultáneamente.
  - Botón rápido `📂 Proyectos abiertos` que selecciona automáticamente todos los estados donde `proyecto_cerrado = false`.
  - Botón `🧹 Limpiar selección` para restablecer la vista completa.

### Modificado
- **Muro de Comunicación** reubicado a la pestaña **Ficha General** del proyecto (anteriormente en la pestaña de Comunicaciones) ya que no está directamente relacionado con los planes de comunicación.
- Ampliada la paleta de colores del editor WYSIWYG con verde, azul y morado.
- Mejorado el selector de colores del editor para aplicar correctamente los colores seleccionados.

### Solucionado
- **🐛 Bug `SQLITE_MISMATCH` al crear tareas**: Corregida la limpieza del payload de creación de tareas para evitar enviar campos no válidos al modelo.
- **🐛 Bug de persistencia de `proyecto_cerrado`**: Corregido el reinicio del servidor backend necesario para cargar cambios de esquema de base de datos.

---

## [1.1.0] - 2026-06-10

### Añadido
- **Módulo Multiperfil y Autenticación**:
  - Pantalla de login formal en el frontend con soporte para perfiles `ADMINISTRADOR`, `PM` y `DIRECTOR`.
  - Hashing SHA-256 de contraseñas nativo en el backend para seguridad de cuentas.
  - Gestión de sesiones persistentes en `localStorage` con inyección automática de cabecera de autenticación (`x-pm-id`).
  - Tarjeta de usuario en el menú lateral de navegación con avatar, nombre, rol y botón de "Cerrar Sesión".
- **Maestro de Estados Configurable (`Estados_Proyecto`)**:
  - Tabla maestra en la base de datos que sustituye a los estados hardcodeados en código.
  - Mantenimiento CRUD para estados en el Panel de Administración que permite configurar nombres, emojis y el orden secuencial del flujo.
  - Sincronización automática de conteos de estados y filtros dinámicos en los cuadros de mando del Dashboard y Governance Dashboard.
- **Panel de Administración (`AdminPanel.jsx`)**:
  - Vistas y CRUDs para gestión total de usuarios del sistema (nombre, correo, perfil, contraseña y estado activo/inactivo).
  - Vistas y CRUDs para la gestión del maestro de estados.
  - Acceso restringido estrictamente a usuarios con perfil de permisos `ADMINISTRADOR`.
- **Selector Autocomplete de Key Users (`SearchableKeyUserSelect.jsx`)**:
  - Componente de búsqueda predictiva en tiempo real (Combobox).
  - Agrupación visual de los Key Users por su empresa/proveedor correspondiente.
  - Ordenación prioritaria y badge destacando a usuarios pertenecientes a **Dacsa** en la parte superior.
  - Soporte flexible para modo selección simple (como Sponsor) y selección múltiple (para participantes en planes de comunicación y KU involucrados).
- **Muro de Comentarios con WYSIWYG y Auditoría (`RichTextEditor.jsx`)**:
  - Feed cronológico inverso de comentarios por proyecto bajo la pestaña de *Comunicaciones*.
  - Editor enriquecido con controles de negrita, cursiva, listas ordenadas/desordenadas y colores.
  - Conversión automática de imágenes copiadas en el portapapeles a Base64 e inserción directa.
  - Sanitización en el evento de pegado para remover etiquetas y clases de formato pesadas y excedentes provenientes de Microsoft Word y Outlook.
  - Incorporación de estilos CSS en línea (`list-style-type: disc`) en elementos de listas para mantener la correcta visualización al copiar comentarios a Outlook.
  - Sistema de logs de auditoría visualizado como tooltip: `"Editado por [Nombre Apellidos] el [Fecha] a las [Hora]"`.

### Modificado
- **Renombrado de Empresa**: Sustituida la nomenclatura genérica `"Mi Empresa"` por el nombre oficial de la organización: **`"Dacsa"`** en base de datos, semillas de configuración y vistas.

### Solucionado
- **🐛 Bug de Formato de Fechas en Hitos/Tareas**:
  - Añadido middleware en el backend que valida estrictamente que las fechas de las tareas tengan el formato estándar ISO-8601 (`YYYY-MM-DD`).
  - Estandarización de inputs en el frontend e inserción controlada de datos, evitando bloqueos por parseos y discrepancias de zonas horarias.

---

## [1.0.0] - 2026-06-08

### Añadido
- **Lanzamiento Inicial**:
  - Dashboard técnico interactivo con listado de proyectos y barra de filtros rápidos por RAG, PM y Partner.
  - Vista ejecutiva de gobernanza consolidada con métricas financieras (Budget Actualizado, Consumo Real, Presupuesto Disponible) y alertas de desvíos en CAPEX e inactividad.
  - Panel Vendor 360º de socios tecnológicos externos con historial de incidencias registradas y base de datos de Lecciones Aprendidas asociadas.
  - CRUDs de Facturas, Riesgos, Incidencias, Hitos/Tareas y Cambios de Alcance (CR) integrados en el detalle del proyecto.
  - Base de datos local SQLite y script de semilla inicial con datos de prueba realistas.
