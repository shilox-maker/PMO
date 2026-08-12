# Roadmap de Funcionalidades

## 🎈 0. Ideas Felices
## 💡 1. Bandeja de Entrada (Ideas en bruto)
*(Sin ideas pendientes de análisis)*

## 🔍 2. En Análisis / Especificación
*(Sin especificaciones en análisis)*


## 📋 3. Listas para Codificar (Tú les has dado el OK)
*(Sin tareas pendientes de codificación)*

## 📦 4. Implementadas
*(Sin tareas recién implementadas)*

## 🧪 5. En Testeo / Pruebas
*(Sin pruebas pendientes)*


## 🚀 6. Pendiente de Subir (Listo para Git)
*(Sin tareas pendientes de subir)*


## 📦 7. Completado e Integrado (Historial)
- [x] **FEATURE-56 (IDEA-56): Segregación por Ámbito / Unidad de Negocio (Multi-tenancy con Maestros Compartidos)** (2026-08-12)
  - **Descripción:** Implementación de arquitectura multi-ámbito/multi-departamento para aislar la gestión de proyectos, presupuestos y portafolios entre diferentes equipos/unidades de negocio, iniciando con el ámbito **"IT Corporate"** y manteniendo compartidos los catálogos globales (**Proveedores**, **Sedes/Sites**, **Tipos de Capex/Subtipos**, **Tipos de Factura** y moneda única en **€**).
- [x] **FEATURE-64 (IDEA-64): Panel Lateral Colapsable de Asistente de Pendientes (Tareas y Comunicaciones)** (2026-08-12)
  - **Descripción**: Asistente lateral tipo sidebar a la derecha (sticky) que recuerda al Project Manager sus tareas pendientes y planes de comunicación a ejecutar en ventanas configurables (7d, 15d, 30d), filtrado strictly por proyectos donde el usuario es el PM asignado (`id_pm`). Integración fluida con `EmailReportModal` cargando contactos participantes.
- [x] **REFACTOR-03 (IDEA-61): Limpieza de dependencias y scripts heredados de IIS / Windows Server / Raspberry Pi tras migraciÃ³n a Azure PaaS** (2026-08-11)
  - **DescripciÃ³n:** EliminaciÃ³n limpia de scripts de despliegue heredados para Windows Server 2022 / IIS (`setup-iis.ps1`, `setup-server.ps1`, `deploy-pre.ps1`, `deploy-pro.ps1`), configuraciones de `iisnode`, `web.config`, certificados `win-acme`, y archivos de entorno Raspberry Pi (`.envRaspberry`), consolidando la infraestructura exclusivamente en desarrollo local y Azure App Service (`build-azure-zip.ps1`).
- [x] **FEATURE-63 (IDEA-63): MigraciÃ³n global de Claves Primarias y ForÃ¡neas de Entidades a UUIDv7 sin pÃ©rdida de datos ni relaciones** (2026-08-11)
  - **DescripciÃ³n:** TransformaciÃ³n del esquema de la base de datos de claves autoincrementales enteras (`INT`/`INTEGER`) a identificadores Ãºnicos universales temporales (**UUIDv7** RFC 9562) en las entidades transaccionales y de negocio (Proyectos, Tareas, Hitos, Riesgos, Portfolios, Facturas, Pedidos, Comentarios, etc.), manteniendo el rendimiento B-Tree e imprevistibilidad de datos. Se conservan como enteros/cÃ³digos las tablas maestras de catÃ¡logo (`status`, `roles`, etc.).
- [x] **FEATURE-60 (IDEA-62): Timeline Gantt interactivo desplegable por tareas y sincronizaciÃ³n de filtros con Proyectos** (2026-08-10)
  - **DescripciÃ³n:** Al hacer clic en una fila/proyecto del Gantt, se expande colapsable mostrando las tareas e hitos individuales del proyecto situados temporalmente en la barra Gantt. Los filtros de la vista Timeline se homologan con los de la pestaÃ±a Proyectos (buscador de texto, estado, RAG, PM/Lead, patrocinador, rango de fechas), conservando el selector de zoom temporal (Semanal, Mensual, Trimestral).
- [x] **BUG-05 (IDEA-57): Control de pÃ©rdida de sesiÃ³n / fallback visual y redirecciÃ³n al expirarse la sesiÃ³n o error de ruta** (2026-08-10)
  - **DescripciÃ³n:** A veces se pierde la sesiÃ³n o se produce un error de autenticaciÃ³n/ruta y la aplicaciÃ³n se queda en pantalla en blanco, obligando al usuario a refrescar o borrar la ruta manualmente para volver a la raÃ­z. Se requiere implementar un indicador visual claro del problema (p. ej. notificaciÃ³n/modal de sesiÃ³n expirada, Error Boundary global y fallback de redirecciÃ³n al login/raÃ­z) para que nunca se quede la pantalla en blanco.
- [x] **FEATURE-59 (IDEA-59): HomogeneizaciÃ³n de selectores y filtros en Timeline Portfolio segÃºn diseÃ±o estÃ¡ndar de Proyectos** (2026-08-10)
  - **DescripciÃ³n:** HomogeneizaciÃ³n visual de los desplegables de selecciÃ³n, inputs de fecha, checkboxes y caja de zoom en `TimelineToolbar.jsx` adaptÃ¡ndolos a la altura estÃ¡ndar de `38px`, bordes M3 de `12px` y colores de superficie de `index.css`.
- [x] **REFACTOR-02 (IDEA-60): AuditorÃ­a y refactorizaciÃ³n de CSS (MigraciÃ³n de estilos inline a index.css)** (2026-08-10)
  - **DescripciÃ³n:** AuditorÃ­a e inicio de migraciÃ³n de estilos inline (`style={{...}}`) a clases utilitarias centralizadas en `index.css` (`layout-col-gap-lg`, `tab-icon-inline`, etc.), comenzando por el mÃ³dulo `AdminPanel.jsx` y asegurando la adherencia a la paleta Glassmorphic M3.
- [x] **FEATURE-58 (IDEA-58): Ocultar Fecha de Inicio y Fecha Fin Base en Dashboard Portfolio** (2026-08-10)
  - **DescripciÃ³n:** En la vista de Dashboard Portfolio / Informe PIPs, ocultar por defecto las columnas/campos de Fecha de Inicio (`fecha_inicio`) y Fecha Fin Base (`fecha_fin_inicial`) para simplificar y limpiar la interfaz visual, manteniendo visible por defecto la Fecha Fin Estimada (`fecha_fin_estimada`).
- [x] **FEATURE-52 (IDEA-52): HomogeneizaciÃ³n de KPIs y Salud del Proyecto en Informes (Generador HTML/PDF vs. EnvÃ­o por Email de ComunicaciÃ³n)** (2026-08-07)
  - **DescripciÃ³n:** HomogeneizaciÃ³n integral de la secciÃ³n "Resumen General, KPIs y Salud del Proyecto" para sincronizar la presentaciÃ³n de datos entre el informe ejecutivo HTML/PDF (`reportHtmlSections.js`) y el informe enviado por correo desde el Plan de ComunicaciÃ³n (`emailReportBuilder.js`). Incluye Estado (Badge), Salud General (%), Fechas Fin Inicial/Estimada, DÃ­as de Retraso, Avance de Tiempo (%), Presupuesto Inicial vs. Gasto Comprometido (â‚¬), Alerta de Sobrecosto, PrÃ³ximo Hito (ðŸŽ¯) y Ãšltimo Comentario PMO (ðŸ’¬).
- [x] **FEATURE-55 (IDEA-55): Agrupar perfil de usuario en submenÃº desplegable M3 y barra lateral colapsable (NavigationRail)** (2026-08-07)
  - **DescripciÃ³n:** RediseÃ±o del perfil de usuario en el menÃº lateral `NavigationRail` agrupando Cambio de Idioma (ES/EN/PT), Cambio de Tema (Oscuro/Dacsa), Cambiar ContraseÃ±a y Cerrar SesiÃ³n en un submenÃº desplegable Glassmorphic M3. Incluye soporte para colapsar/expandir el menÃº lateral izquierdo a `72px` con persistencia en `localStorage` y nombre completo multilÃ­nea sin truncar.
- [x] **FEATURE-54 (IDEA-54): InternacionalizaciÃ³n y LocalizaciÃ³n Integral Multilenguaje (ES / EN / PT)** (2026-08-07)
  - **DescripciÃ³n:** ImplementaciÃ³n total de i18n reactivo multilenguaje en la plataforma con soporte para EspaÃ±ol ðŸ‡ªðŸ‡¸, InglÃ©s ðŸ‡¬ðŸ‡§ y PortuguÃ©s ðŸ‡µðŸ‡¹. Incluye preferencia guardada por usuario, conmutadores en NavigationRail y pantalla de Login, normalizaciÃ³n de catalogos maestros en BBDD con campo `code`, e internacionalizaciÃ³n al 100% de Proyectos, Dashboards, PIPs, Timeline, Partners 360, Lecciones Aprendidas y los 6 submÃ³dulos del Panel de AdministraciÃ³n.
- [x] **FEATURE-53 (IDEA-53): Servidor MCP (Model Context Protocol) para exponer el API de PMO Control Tower a Agentes de IA** (2026-08-05)
- [x] **FEATURE-51 (IDEA-51): Redimensionamiento dinÃ¡mico de ancho de columnas en Tabla de Proyectos con persistencia local** (2026-08-05)
- [x] **FEATURE-31 (IDEA-31): Indicadores de Tendencia y VariaciÃ³n Temporal en KPIs (Velocity / Variance - OpciÃ³n B Snapshots)** (2026-08-04)
- [x] **PERF-01: Lazy Loading de Pages y OptimizaciÃ³n de Chunks (Vite)** (2026-08-04)
- [x] **FEATURE-50 (IDEA-50): RediseÃ±o de NavegaciÃ³n de PestaÃ±as en Ficha de Proyecto (PestaÃ±as Principales + MenÃº Overflow "MÃ¡s...")** (2026-08-04)
- [x] **FEATURE-48 (IDEA-48): UI/UX Premium: Skeletons Glassmorphic y Conmutador de Densidad de InformaciÃ³n** (2026-08-04)
- [x] **FEATURE-49 (IDEA-49): Auto-guardado inteligente (Debounce) e Indicador de Estado en Editor WYSIWYG** (2026-08-04)
- [x] **FEATURE-45 (IDEA-45): Modo Mantenimiento Global de la AplicaciÃ³n** (2026-07-31)
- [x] **FEATURE-46 (IDEA-46): OptimizaciÃ³n del Protocolo Operativo del Agente (`agents.md`) y Herramientas de Calidad** (2026-08-03)
- [x] **FEATURE-47 (IDEA-47): Paleta de Comandos RÃ¡pida (`Ctrl + K`) para PMO Control Tower** (2026-08-03)
- [x] **FEATURE-44 (IDEA-44): RestricciÃ³n estricta de polÃ­ticas CORS sin comodÃ­n `*` en `server.js`** (2026-07-30)
- [x] **FEATURE-39 (IDEA-39): Endpoint dedicado de Health Check (`GET /api/health`) que verifica el estado del servidor Express y conectividad con la BBDD** (2026-07-30)
- [x] **FEATURE-38 (IDEA-38): OptimizaciÃ³n Masiva de Rendimiento en Listados de Proyectos y Dashboards (EliminaciÃ³n de Consultas N+1)** (2026-07-29)

- [x] **FEATURE-37 (IDEA-37): OptimizaciÃ³n de Carga Diferida (Lazy Loading & On-Demand) en la Ficha del Proyecto** (2026-07-29)
- [x] **FEATURE-36: Ocultar por defecto Fecha de Inicio, Fecha Fin Base, Presupuesto y Progreso del Gasto en la tabla de proyectos** (2026-07-29)
- [x] **FEATURE-35 (IDEA-35): GestiÃ³n de Proyectos e Iniciativas Ligeras (Sin CAPEX / Sin Presupuesto)** (2026-07-29)
- [x] **FEATURE-34 (IDEA-34): Desacoplamiento del Dashboard en 2 vistas de menÃº independientes (Dashboard Proyectos y Dashboard Portfolio)** (2026-07-28)
- [x] **BUG-04: Soporte de endpoints anidados /api/projects/:id_proyecto/comments (POST, PUT, DELETE) para solucionar error HTTP 404 al publicar comentarios** (2026-07-28)
- [x] **FEATURE-33 (IDEA-33): Registro de PuntuaciÃ³n de Encuestas Cualitativas por Proyecto** (2026-07-28)
- [x] **FEATURE-32 (IDEA-32): Planes de ComunicaciÃ³n DinÃ¡micos y Registro de AuditorÃ­a de EnvÃ­os (Modelo Relacional Puro)** (2026-07-28)
- [x] **FEATURE-30 (IDEA-30): Drill-down interactivo en tarjetas de KPI del Dashboard** (2026-07-28)
- [x] **FEATURE-29 (IDEA-29): KPI de Volatilidad de Alcance (Scope Volatility / Scope Creep Rate)** (2026-07-28)
- [x] **FEATURE-28 (IDEA-28): KPI de Calidad del Dato e Ã�ndice de Adherencia PMO (Data Freshness)** (2026-07-28)
- [x] **FEATURE-27 (IDEA-27): Filtro en el muro de comentarios para comentarios importantes y de direcciÃ³n** (2026-07-24)
- [x] **BUG-03: Error "id_proyecto is required" al registrar un nuevo proyecto dejando el cÃ³digo auto-generado** (2026-07-24)
- [x] **FEATURE-26 (IDEA-26): BotÃ³n para enviar Informe de Proyecto por correo electrÃ³nico con selecciÃ³n de campos (cliente SO predeterminado)** (2026-07-24)
- [x] **FEATURE-25 (IDEA-25): Relacionar riesgos e incidencias con una tarea existente del mismo proyecto** (2026-07-24)
- [x] **FEATURE-24 (IDEA-24): Registro en lote de Facturas / Cobros Recurrentes** (2026-07-24)
- [x] **FEATURE-23 (IDEA-23): Campo URL del site de SharePoint de documentaciÃ³n en proyectos** (2026-07-24)
- [x] **FEATURE-22 (IDEA-22): Campo 'Tipo' en Facturas y mantenimiento administrable** (2026-07-24)
- [x] **FEATURE-21 (IDEA-21): Reorganizar pantalla de mantenimiento de estados (SeparaciÃ³n Vista Tabla / Detalle y Tareas)** (2026-07-24)
- [x] **FEATURE-20 (IDEA-20): Popup para aÃ±adir tareas preconfiguradas al cambiar de estado** (2026-07-24)
- [x] **REFACTOR-01: ModularizaciÃ³n arquitectÃ³nica KISS/SRP en Backend y Frontend para cumplir lÃ­mites de 200/300 lÃ­neas** (2026-07-22)
- [x] **IDEA-19: Resumen de Cartera y panel de alertas en el informe consolidado HTML/PDF, y remociÃ³n de PO de Excel** (2026-07-16)
- [x] **BUG-02: No funciona bien el filtro de Lecciones aprendidas al filtrar por Partner ni por proyecto** (2026-07-16)
- [x] **IDEA-18: BotÃ³n para eliminar proyectos** (2026-07-14)
- [x] **IDEA-15: Filtros en Lecciones Aprendidas (Buenas PrÃ¡cticas / Errores a evitar, Partner y Proyecto)** (2026-07-14)
- [x] **IDEA-16: Indicador de Nota Explicativa de Presupuesto en Reporte de Portfolios (Pips)** (2026-07-14)
- [x] **IDEA-14: RediseÃ±o de KPIs y GrÃ¡ficos PMO con OrdenaciÃ³n por Cambios de Alcance** (2026-07-14)
- [x] **IDEA-17: AÃ±adir columna con el Ãºltimo comentario completo al lado de PrÃ³ximo Hito** (2026-07-14)
- [x] **BUG-01**: Al intentar crear un tarea que no es hito, tiene unas validaciones que fallan y no tiene sentido que sean obligatorias: "fecha_original_cierre" is not allowed to be empty, "fecha_actual_cierre" is not allowed to be empty, "fecha_real_cierre" is not allowed to be empty. (2026-07-13)
- [x] **IDEA-13**: AÃ±adir un feedback cuando la aplicaciÃ³n estÃ© guardando o trabajando en segundo plano. Se pondrÃ¡ en el NavigationRail un indicador de que la aplicaciÃ³n estÃ¡ trabajando (activity indicator/spinner/pulse), interceptando las peticiones HTTP (`fetch`) de forma centralizada o a travÃ©s de un estado global en `AuthContext` o un interceptor personalizado para que cualquier peticiÃ³n asÃ­ncrona active visualmente el indicador. (2026-07-13)
- [x] **IDEA-09**: IntegraciÃ³n con Azure DevOps en lugar de GitHub (migrar URL del repositorio en scripts, reconfigurar origen remoto en el servidor de despliegue y gestionar autenticaciÃ³n mediante PAT o claves SSH). (2026-07-10)
- [x] **IDEA-10**: Que la aplicaciÃ³n permita usuarios con contraseÃ±a dentro de la aplicaciÃ³n o que se integren con Microsoft Entra ID. (2026-07-10)
- [x] **IDEA-12**: GestiÃ³n de presupuestos dentro de Portfolios e Informe de Control Presupuestario con Triple Variable (Aprobado, Reservado, Ejecutado). (2026-07-10)
- [x] **IDEA-11**: ClasificaciÃ³n CAPEX con Tipo y Subtipo administrables. (2026-07-09)
- [x] **IDEA-01**: Resaltado de hitos y proyectos vencidos (en rojo) (2026-06-26)
- [x] **IDEA-02**: Tareas e Hitos de Gobernanza del Proyecto (2026-06-26)
- [x] **IDEA-03**: Preparar un anÃ¡lisis tÃ©cnico para que el conocimiento de la herramienta no dependa de mÃ­ (Documento de requisitos funcionales, diagrama entidad-relaciÃ³n, arquitectura tÃ©cnica, etc.) (2026-07-06)
- [x] **IDEA-04**: Robustecer la sanitizaciÃ³n de seguridad en WYSIWYG sustituyendo la sanitizaciÃ³n manual XSS por una biblioteca especializada (como `sanitize-html` o validador robusto). (2026-07-06)
- [x] **IDEA-05**: Incrementar la cobertura de pruebas automatizadas aÃ±adiendo tests de integraciÃ³n para las reglas financieras en backend y tests de flujos E2E con Playwright en frontend. (2026-07-07)
- [x] **IDEA-06**: Implementar validaciÃ³n estricta de esquemas de entrada (payload validation) en el backend para todas las peticiones POST/PUT de proyectos, facturas, incidencias, etc. (2026-07-06)
- [x] **IDEA-07**: Centralizar el manejo de errores mediante un middleware global de Express y un wrapper asÃ­ncrono para eliminar la duplicaciÃ³n de bloques try/catch en los controladores. (2026-07-06)
- [x] **IDEA-08**: Optimizar el rendimiento de la base de datos definiendo Ã­ndices explÃ­citos en Sequelize para las llaves forÃ¡neas y limitando los campos recuperados en las consultas del dashboard. (2026-07-06)
