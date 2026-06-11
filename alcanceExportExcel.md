```markdown
Implementa la funcionalidad de exportación a Excel para el CRUD de Proyectos y el Executive Portfolio Dashboard en un monorepositorio con la siguiente arquitectura:

**Contexto Técnico:**
* Backend: Node.js, Express, Sequelize y SQLite (`ppm_governance.db`).
* Frontend: React 19, Vite, CSS puro (glassmorphic dark mode) y Lucide React para iconografía.

**Requerimientos del Backend (`/backend`):**
1. Instala la librería `exceljs` para generar los archivos `.xlsx` desde el servidor.
2. Crea un nuevo endpoint (ej. `GET /api/projects/export`) que consulte la entidad central `Proyectos` y sus relaciones (como `Facturas` y `Cambios_Alcance`).
3. El archivo Excel generado debe calcular e incluir las columnas del Motor Financiero y Temporal:
   - **Budget Actualizado:** Budget Inicial + ∑ (Importe de Cambios de Alcance APROBADOS).
   - **Consumo Real:** Suma preventiva de facturas PAGADAS y PENDIENTE_DE_RECIBIR.
   - **Presupuesto Disponible:** Budget Actualizado − Consumo Real.
   - **Fecha Fin Estimada:** Fecha Fin Inicial + ∑ (Días de Impacto de Cambios de Alcance APROBADOS).
4. Configura las cabeceras de respuesta de Express para forzar la descarga de un archivo `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

**Requerimientos del Frontend (`/frontend`):**
1. Añade un botón "Exportar a Excel" (usando un icono representativo de Lucide React) en las siguientes vistas:
   - CRUD principal de proyectos.
   - Panel `/governance` (Executive Portfolio Dashboard), ubicándolo junto a los Filtros Maestros (Rango de Fechas y Project Manager).
2. Configura el evento `onClick` del botón para hacer un fetch al nuevo endpoint del backend, procesar el blob resultante y disparar la descarga en el navegador del usuario.
3. Asegúrate de que el botón respete el diseño limpio y el estilo "glassmorphic dark mode" de la interfaz existente.
```