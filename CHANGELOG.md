# Changelog

Todas las novedades y cambios notables del sistema **Gobernanza PPM** se registrarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [SemVer (Versionado Semántico)](https://semver.org/spec/v2.0.0.html).

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
