# Roadmap de Funcionalidades

## 🎈 0. Ideas Felices
## 💡 1. Bandeja de Entrada (Ideas en bruto)

## 🔍 2. En Análisis / Especificación
- [ ] **FEATURE-56 (IDEA-56): Segregación por Ámbito / Unidad de Negocio (Multi-tenancy con Maestros Compartidos)**
  - **Descripción:** Implementación de arquitectura multi-ámbito/multi-departamento para aislar la gestión de proyectos, presupuestos y portafolios entre diferentes equipos/unidades de negocio, iniciando con el ámbito **"IT Corporate"** y manteniendo compartidos los catálogos globales (**Proveedores**, **Sedes/Sites**, **Tipos de Capex/Subtipos**, **Tipos de Factura** y moneda única en **€**).
  - **Análisis Técnico y Especificación Acordada:**
    1. **Nuevos Modelos en Base de Datos (Sequelize):**
       - `Ambitos`: Modelo maestro (`id_ambito`, `nombre`, `code`, `descripcion`, `activo`).
       - `Usuario_Ambitos`: Modelo de asociación N:M (`id_usuario`, `id_ambito`, `rol_ambito`).
    2. **Modelos Segregados (Clave foránea `id_ambito`):**
       - `Proyectos`: Añadir columna `id_ambito` (FK -> `Ambitos`).
       - `Portfolios`: Añadir columna `id_ambito` (FK -> `Ambitos`). Cada ámbito gestiona sus propios Portfolios y Presupuestos de Portfolio (`Portfolio_Budgets`).
    3. **Modelos Heredados (Segregados indirectamente vía `id_proyecto` / `portfolio_id`):**
       - Facturas, Pedidos, Riesgos, Hitos, Tareas, Lecciones Aprendidas, Solicitudes de Cambio (CR), Planes de Comunicación.
    4. **Maestros Compartidos Globalmente (Sin `id_ambito`):**
       - `Proveedores` y `Contactos_Proveedor` (Grupo Dacsa / Externos).
       - `Sedes` (Sites).
       - `Tipos_Capex` y `Subtipos_Capex`.
       - `Tipos_Factura` y `Estados_Proyecto`.
    5. **Backend Middleware & Control de Permisos en Servidor (`tenantScope`):**
       - Middleware `scopeMiddleware.js`: Valida el Token JWT y comprueba los ámbitos autorizados del usuario en la tabla `Usuario_Ambitos`.
       - **Anti-Manipulación (Zero-Trust):** Si un cliente o la IA intenta enviar un `X-Ambito-Id` al que no tiene acceso, el servidor rechaza la petición con un `HTTP 403 Forbidden`. La opción `ALL` solo se autoriza si el perfil del JWT es `ADMINISTRADOR` o `DIRECTOR`.
    6. **Frontend UI/UX (Conmutador de Ámbito):**
       - `AuthContext`: Estado `selectedAmbito` con almacenamiento local (`localStorage`).
       - Selector de Ámbito activo en `UserMenuDropdown` / NavigationRail (incluye opción "Todos los Ámbitos (Vista Global)" para Admins/Directores).
       - Interceptor en `api.js` para inyectar automáticamente la cabecera `X-Ambito-Id` en cada llamada.
    7. **Seguridad Inmutable en el Servidor MCP (Model Context Protocol):**
       - **Mapa de Claves en `.env` (`MCP_KEYS_CONFIG`):** Se admitirá en `.env` un JSON con el mapa de claves API y sus ámbitos autorizados (ej: `[{"key":"key-admin","ambitos":["ALL"],"default":"IT_CORP"},{"key":"key-it","ambitos":["IT_CORP"],"default":"IT_CORP"}]`).
       - **Fallback Retrocompatible:** Si solo existe `MCP_API_KEY`, el servidor le asigna por defecto el ámbito `IT_CORP`.
       - **Validación de Cabecera:** Si el cliente MCP envía `X-Ambito-Code`, el middleware verifica si esa API Key en el mapa JSON tiene autorización para dicho ámbito. Si no tiene autorización, rechaza la conexión con `HTTP 403 Forbidden`.
       - **Seguridad en Tools:** El `id_ambito` **no es un argumento de las herramientas MCP JSON**; se inyecta desde la sesión validada del servidor en Sequelize (`projects.js`, `lessons.js`, `search.js`).
    8. **Estrategia de Migración Inicial:**
       - Se crea la migración SQL (`node migrate.js up`) que inserta automáticamente el ámbito inicial **"IT Corporate"** (`code: IT_CORP`).
       - Se migran todos los proyectos, portfolios y usuarios existentes asignándoles `id_ambito = 1` (IT Corporate).
  - **Archivos Afectados:**
    - Backend: `backend/models/index.js`, `backend/migrations/20260807_create_ambitos_and_scope.js`, `backend/middlewares/auth.js`, `backend/middlewares/scopeMiddleware.js`, `backend/controllers/proyectosController.js`, `backend/controllers/portfoliosController.js`, `backend/controllers/dashboardController.js`, `backend/controllers/usuariosController.js`, `backend/mcp/http.js`, `backend/mcp/serverFactory.js`, `backend/mcp/tools/projects.js`, `backend/mcp/tools/lessons.js`, `backend/mcp/tools/search.js`.
    - Frontend: `frontend/src/context/AuthContext.jsx`, `frontend/src/services/api.js`, `frontend/src/components/UserMenuDropdown.jsx`, `frontend/src/pages/admin/AdminUsuariosPage.jsx`.
  - **Impacto Estimado:** Alto. Requerirá ejecutar `node migrate.js up` y verificar la integridad de las consultas en Backend, el servidor MCP y el selector en Frontend.

## 🟩 3. Listas para Codificar (Tú les has dado el OK)

## 📦 4. Implementadas

## 🧪 5. En Testeo / Pruebas

## 🚀 6. Pendiente de Subir (Listo para Git)

## 📦 7. Completado e Integrado (Historial)
- [x] **FEATURE-52 (IDEA-52): Homogeneización de KPIs y Salud del Proyecto en Informes (Generador HTML/PDF vs. Envío por Email de Comunicación)** (2026-08-07)
  - **Descripción:** Homogeneización integral de la sección "Resumen General, KPIs y Salud del Proyecto" para sincronizar la presentación de datos entre el informe ejecutivo HTML/PDF (`reportHtmlSections.js`) y el informe enviado por correo desde el Plan de Comunicación (`emailReportBuilder.js`). Incluye Estado (Badge), Salud General (%), Fechas Fin Inicial/Estimada, Días de Retraso, Avance de Tiempo (%), Presupuesto Inicial vs. Gasto Comprometido (€), Alerta de Sobrecosto, Próximo Hito (🎯) y Último Comentario PMO (💬).
- [x] **FEATURE-55 (IDEA-55): Agrupar perfil de usuario en submenú desplegable M3 y barra lateral colapsable (NavigationRail)** (2026-08-07)
  - **Descripción:** Rediseño del perfil de usuario en el menú lateral `NavigationRail` agrupando Cambio de Idioma (ES/EN/PT), Cambio de Tema (Oscuro/Dacsa), Cambiar Contraseña y Cerrar Sesión en un submenú desplegable Glassmorphic M3. Incluye soporte para colapsar/expandir el menú lateral izquierdo a `72px` con persistencia en `localStorage` y nombre completo multilínea sin truncar.
- [x] **FEATURE-54 (IDEA-54): Internacionalización y Localización Integral Multilenguaje (ES / EN / PT)** (2026-08-07)
  - **Descripción:** Implementación total de i18n reactivo multilenguaje en la plataforma con soporte para Español 🇪🇸, Inglés 🇬🇧 y Portugués 🇵🇹. Incluye preferencia guardada por usuario, conmutadores en NavigationRail y pantalla de Login, normalización de catalogos maestros en BBDD con campo `code`, e internacionalización al 100% de Proyectos, Dashboards, PIPs, Timeline, Partners 360, Lecciones Aprendidas y los 6 submódulos del Panel de Administración.
- [x] **FEATURE-53 (IDEA-53): Servidor MCP (Model Context Protocol) para exponer el API de PMO Control Tower a Agentes de IA** (2026-08-05)
- [x] **FEATURE-51 (IDEA-51): Redimensionamiento dinámico de ancho de columnas en Tabla de Proyectos con persistencia local** (2026-08-05)
- [x] **FEATURE-31 (IDEA-31): Indicadores de Tendencia y Variación Temporal en KPIs (Velocity / Variance - Opción B Snapshots)** (2026-08-04)
- [x] **PERF-01: Lazy Loading de Pages y Optimización de Chunks (Vite)** (2026-08-04)
- [x] **FEATURE-50 (IDEA-50): Rediseño de Navegación de Pestañas en Ficha de Proyecto (Pestañas Principales + Menú Overflow "Más...")** (2026-08-04)
- [x] **FEATURE-48 (IDEA-48): UI/UX Premium: Skeletons Glassmorphic y Conmutador de Densidad de Información** (2026-08-04)
- [x] **FEATURE-49 (IDEA-49): Auto-guardado inteligente (Debounce) e Indicador de Estado en Editor WYSIWYG** (2026-08-04)
- [x] **FEATURE-45 (IDEA-45): Modo Mantenimiento Global de la Aplicación** (2026-07-31)
- [x] **FEATURE-46 (IDEA-46): Optimización del Protocolo Operativo del Agente (`agents.md`) y Herramientas de Calidad** (2026-08-03)
- [x] **FEATURE-47 (IDEA-47): Paleta de Comandos Rápida (`Ctrl + K`) para PMO Control Tower** (2026-08-03)
- [x] **FEATURE-44 (IDEA-44): Restricción estricta de políticas CORS sin comodín `*` en `server.js`** (2026-07-30)
- [x] **FEATURE-39 (IDEA-39): Endpoint dedicado de Health Check (`GET /api/health`) que verifica el estado del servidor Express y conectividad con la BBDD** (2026-07-30)
- [x] **FEATURE-38 (IDEA-38): Optimización Masiva de Rendimiento en Listados de Proyectos y Dashboards (Eliminación de Consultas N+1)** (2026-07-29)

- [x] **FEATURE-37 (IDEA-37): Optimización de Carga Diferida (Lazy Loading & On-Demand) en la Ficha del Proyecto** (2026-07-29)
- [x] **FEATURE-36: Ocultar por defecto Fecha de Inicio, Fecha Fin Base, Presupuesto y Progreso del Gasto en la tabla de proyectos** (2026-07-29)
- [x] **FEATURE-35 (IDEA-35): Gestión de Proyectos e Iniciativas Ligeras (Sin CAPEX / Sin Presupuesto)** (2026-07-29)
- [x] **FEATURE-34 (IDEA-34): Desacoplamiento del Dashboard en 2 vistas de menú independientes (Dashboard Proyectos y Dashboard Portfolio)** (2026-07-28)
- [x] **BUG-04: Soporte de endpoints anidados /api/projects/:id_proyecto/comments (POST, PUT, DELETE) para solucionar error HTTP 404 al publicar comentarios** (2026-07-28)
- [x] **FEATURE-33 (IDEA-33): Registro de Puntuación de Encuestas Cualitativas por Proyecto** (2026-07-28)
- [x] **FEATURE-32 (IDEA-32): Planes de Comunicación Dinámicos y Registro de Auditoría de Envíos (Modelo Relacional Puro)** (2026-07-28)
- [x] **FEATURE-30 (IDEA-30): Drill-down interactivo en tarjetas de KPI del Dashboard** (2026-07-28)
- [x] **FEATURE-29 (IDEA-29): KPI de Volatilidad de Alcance (Scope Volatility / Scope Creep Rate)** (2026-07-28)
- [x] **FEATURE-28 (IDEA-28): KPI de Calidad del Dato e Índice de Adherencia PMO (Data Freshness)** (2026-07-28)
- [x] **FEATURE-27 (IDEA-27): Filtro en el muro de comentarios para comentarios importantes y de dirección** (2026-07-24)
- [x] **BUG-03: Error "id_proyecto is required" al registrar un nuevo proyecto dejando el código auto-generado** (2026-07-24)
- [x] **FEATURE-26 (IDEA-26): Botón para enviar Informe de Proyecto por correo electrónico con selección de campos (cliente SO predeterminado)** (2026-07-24)
- [x] **FEATURE-25 (IDEA-25): Relacionar riesgos e incidencias con una tarea existente del mismo proyecto** (2026-07-24)
- [x] **FEATURE-24 (IDEA-24): Registro en lote de Facturas / Cobros Recurrentes** (2026-07-24)
- [x] **FEATURE-23 (IDEA-23): Campo URL del site de SharePoint de documentación en proyectos** (2026-07-24)
- [x] **FEATURE-22 (IDEA-22): Campo 'Tipo' en Facturas y mantenimiento administrable** (2026-07-24)
- [x] **FEATURE-21 (IDEA-21): Reorganizar pantalla de mantenimiento de estados (Separación Vista Tabla / Detalle y Tareas)** (2026-07-24)
- [x] **FEATURE-20 (IDEA-20): Popup para añadir tareas preconfiguradas al cambiar de estado** (2026-07-24)
- [x] **REFACTOR-01: Modularización arquitectónica KISS/SRP en Backend y Frontend para cumplir límites de 200/300 líneas** (2026-07-22)
- [x] **IDEA-19: Resumen de Cartera y panel de alertas en el informe consolidado HTML/PDF, y remoción de PO de Excel** (2026-07-16)
- [x] **BUG-02: No funciona bien el filtro de Lecciones aprendidas al filtrar por Partner ni por proyecto** (2026-07-16)
- [x] **IDEA-18: Botón para eliminar proyectos** (2026-07-14)
- [x] **IDEA-15: Filtros en Lecciones Aprendidas (Buenas Prácticas / Errores a evitar, Partner y Proyecto)** (2026-07-14)
- [x] **IDEA-16: Indicador de Nota Explicativa de Presupuesto en Reporte de Portfolios (Pips)** (2026-07-14)
- [x] **IDEA-14: Rediseño de KPIs y Gráficos PMO con Ordenación por Cambios de Alcance** (2026-07-14)
- [x] **IDEA-17: Añadir columna con el último comentario completo al lado de Próximo Hito** (2026-07-14)
- [x] **BUG-01**: Al intentar crear un tarea que no es hito, tiene unas validaciones que fallan y no tiene sentido que sean obligatorias: "fecha_original_cierre" is not allowed to be empty, "fecha_actual_cierre" is not allowed to be empty, "fecha_real_cierre" is not allowed to be empty. (2026-07-13)
- [x] **IDEA-13**: Añadir un feedback cuando la aplicación esté guardando o trabajando en segundo plano. Se pondrá en el NavigationRail un indicador de que la aplicación está trabajando (activity indicator/spinner/pulse), interceptando las peticiones HTTP (`fetch`) de forma centralizada o a través de un estado global en `AuthContext` o un interceptor personalizado para que cualquier petición asíncrona active visualmente el indicador. (2026-07-13)
- [x] **IDEA-09**: Integración con Azure DevOps en lugar de GitHub (migrar URL del repositorio en scripts, reconfigurar origen remoto en el servidor de despliegue y gestionar autenticación mediante PAT o claves SSH). (2026-07-10)
- [x] **IDEA-10**: Que la aplicación permita usuarios con contraseña dentro de la aplicación o que se integren con Microsoft Entra ID. (2026-07-10)
- [x] **IDEA-12**: Gestión de presupuestos dentro de Portfolios e Informe de Control Presupuestario con Triple Variable (Aprobado, Reservado, Ejecutado). (2026-07-10)
- [x] **IDEA-11**: Clasificación CAPEX con Tipo y Subtipo administrables. (2026-07-09)
- [x] **IDEA-01**: Resaltado de hitos y proyectos vencidos (en rojo) (2026-06-26)
- [x] **IDEA-02**: Tareas e Hitos de Gobernanza del Proyecto (2026-06-26)
- [x] **IDEA-03**: Preparar un análisis técnico para que el conocimiento de la herramienta no dependa de mí (Documento de requisitos funcionales, diagrama entidad-relación, arquitectura técnica, etc.) (2026-07-06)
- [x] **IDEA-04**: Robustecer la sanitización de seguridad en WYSIWYG sustituyendo la sanitización manual XSS por una biblioteca especializada (como `sanitize-html` o validador robusto). (2026-07-06)
- [x] **IDEA-05**: Incrementar la cobertura de pruebas automatizadas añadiendo tests de integración para las reglas financieras en backend y tests de flujos E2E con Playwright en frontend. (2026-07-07)
- [x] **IDEA-06**: Implementar validación estricta de esquemas de entrada (payload validation) en el backend para todas las peticiones POST/PUT de proyectos, facturas, incidencias, etc. (2026-07-06)
- [x] **IDEA-07**: Centralizar el manejo de errores mediante un middleware global de Express y un wrapper asíncrono para eliminar la duplicación de bloques try/catch en los controladores. (2026-07-06)
- [x] **IDEA-08**: Optimizar el rendimiento de la base de datos definiendo índices explícitos en Sequelize para las llaves foráneas y limitando los campos recuperados en las consultas del dashboard. (2026-07-06)
