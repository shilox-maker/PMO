# Roadmap de Funcionalidades

## 🎈 0. Ideas Felices
## 💡 1. Bandeja de Entrada (Ideas en bruto)
## 🔍 2. En Análisis / Especificación


## 🟩 3. Listas para Codificar (Tú les has dado el OK)


## 📦 4. Implementadas

## 🧪 5. En Testeo / Pruebas


## 🚀 6. Pendiente de Subir (Listo para Git)


## 📦 7. Completado e Integrado (Historial)
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
