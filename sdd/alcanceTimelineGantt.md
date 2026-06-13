# Documento de Alcance Funcional: Vista Timeline / Gantt de Portfolio

## 1. Objetivo
Proporcionar una vista global temporal de todos los proyectos activos en el portfolio para identificar solapamientos, hitos clave y dependencias a nivel visual, facilitando la toma de decisiones estratégicas.

## 2. Alcance del Desarrollo

### Backend
- Se implementa el endpoint `GET /api/timeline` que sirve un payload optimizado con los datos de fechas, semáforo RAG, PM asignado e hitos (tareas marcadas con `es_hito: true`) de cada proyecto.

### Frontend
- **Página Timeline**: Construcción de un diagrama de Gantt 100% nativo con React y CSS, sin dependencias externas pesadas, asegurando rendimiento y coherencia visual con el resto de la aplicación.
- **Elementos visuales**:
  - Barras horizontales por proyecto coloreadas según su indicador RAG.
  - Hitos representados como diamantes (◆) posicionados sobre la barra temporal.
  - Indicador vertical móvil que señala el día "Hoy".
  - Tooltip interactivo al hacer hover sobre los hitos con detalles de estado y fecha.
- **Controles de navegación y filtrado**:
  - Zoom dinámico en tres niveles: Trimestral, Mensual y Semanal.
  - Filtrado en tiempo real por RAG y por Project Manager.
  - Toggle para mostrar u ocultar proyectos en estado cerrado.

### UI/UX
- Animaciones fluidas en la barra de progreso y tooltips.
- Soporte nativo para los tres temas del sistema (Claro, Oscuro y Dacsa).
- Zebra striping (filas alternas) para mejorar la legibilidad en despliegues con numerosos proyectos paralelos.

## 3. Beneficios
- Permite a la Dirección Ejecutiva ver la carga temporal del portfolio con un solo vistazo.
- Identifica rápidamente cuellos de botella en meses específicos.
- Reduce el tiempo de análisis al agrupar visualmente la finalización de los proyectos con sus hitos clave.
