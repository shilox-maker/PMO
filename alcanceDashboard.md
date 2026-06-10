# 🛠️ DEVELOPMENT SPECIFICATION: PORTFOLIO DASHBOARD & ALERTS

## 1. OBJETIVO DEL COMPONENTE
Implementar la vista principal del Dashboard del PPM enfocada en la macro-gestión preventiva. El objetivo es identificar de un solo vistazo qué proyectos abiertos tienen desviaciones críticas en tiempos o costes (facturación prevista/real por encima del presupuesto inicial), permitiendo filtrar dinámicamente la información.

---

## 2. FILTROS GLOBALES (CONTROLES DE CABECERA)
El componente debe reaccionar en tiempo real a los siguientes filtros combinables:

1. **Filtro de Estado (Multi-selección):**
   * **Control UI:** Componente Dropdown con Checkboxes o Tags.
   * **Origen de datos:** Valores únicos de `Proyectos.estado_proyecto`.
   * **Comportamiento por defecto:** Pre-seleccionar todos los estados activos (ej. Kickoff, Desarrollo), excluyendo estados finales como 'Cierre' o 'Pausado'.

2. **Filtro de Project Manager:**
   * **Control UI:** Selector simple o con buscador.
   * **Origen de datos:** Lista de usuarios asignados como `id_pm`.

---

## 3. VISTA PRINCIPAL: GRID DE CONTROL DE PORTFOLIO

Estructura de tabla de alta densidad para monitorizar los proyectos que cumplan con los criterios de los filtros globales.

### Columnas Requeridas y Lógica de Negocio:

* **ID / Proyecto:** Muestra `id_proyecto` (PRJ-YYYY-XXX) y `nombre_proyecto`.
* **PM:** Nombre del Project Manager asignado (`id_pm`).
* **RAG:** Indicador visual basado en el ENUM `indicador_rag` (VERDE, AMARILLO, ROJO). Entrada manual directa de base de datos.
* **Alerta de Tiempo (Retraso Real):**
  * **Lógica:** Calcular `Fecha Fin Estimada`.
    * *Fórmula:* `fecha_fin_inicial` + SUMA de `Cambios_Alcance.dias_impacto` (donde `estado_cambio == 'APROBADO'`).
  * **Regla UI:** * Si `Fecha Fin Estimada > fecha_fin_inicial`, calcular la diferencia en días y pintar en **ROJO** (Ej: `+15 días de retraso`).
    * Si hay algún Hito (`Tareas.es_hito == True` y `Tareas.estado == 'PENDIENTE'`) cuya `fecha_limite` sea menor que la fecha actual, añadir un flag de **Hito Vencido**.
    * En caso contrario, mostrar en **VERDE** (`En plazo`).
* **Alerta de Dinero (Riesgo Presupuestario):**
  * **Lógica:** Comparar el volumen de facturación total esperada/recibida contra el coste de partida.
    * *Gasto Comprometido:* SUMA de `Facturas.importe` (donde `estado` es 'PENDIENTE_DE_RECIBIR' o 'PAGADA').
    * *Baseline de Partida:* `Proyectos.budget_inicial`.
  * **Regla UI:**
    * Si `Gasto Comprometido > budget_inicial`, calcular el porcentaje de desviación y mostrar la celda con fondo o texto **ROJO / ALERTA** (Ej: `⚠️ Excede en X% al inicial`).
    * *Nota operativa:* El estado 'PENDIENTE_DE_RECIBIR' se utilizará de forma preventiva para registrar estimaciones de facturas futuras; el sistema debe sumarlas siempre para anticipar el desborde financiero.
    * En caso contrario, mostrar **OK** en color neutro/verde.
* **Hitos Próximos:**
  * Muestra la `fecha_limite` y `titulo_tarea` del próximo hito pendiente (`es_hito == True`, `estado == 'PENDIENTE'`) ordenado por fecha más cercana.

---

## 4. TARJETAS DE ALERTA FINANCIERA (KPI WIDGETS)
Justo encima del grid, se deben renderizar dos tarjetas de métricas agregadas (afectadas por los filtros de cabecera):

### Tarjeta 1: Proyectos en Desborde de Baseline
* **Métrica:** Conteo de proyectos donde `SUM(Facturas.importe) > Proyectos.budget_inicial`.
* **Acción:** Al hacer clic, debe filtrar el grid inferior para mostrar únicamente estos proyectos en riesgo financiero.

### Tarjeta 2: Alerta Preventiva CAPEX
* **Métrica:** Conteo de proyectos donde `Proyectos.es_capex == True` AND `SUM(Facturas.importe) >= (Proyectos.budget_inicial * 0.90)`.
* **Objetivo:** Avisar cuando un proyecto CAPEX ha consumido o espera consumir el 90% o más de su asignación inicial antes de que entren nuevas facturas.

---

## 5. WIDGET LATERAL: COMPLIANCE DE GOBERNANZA

Un panel lateral o sección compacta para asegurar que los PMs mantienen el control del Plan de Comunicación.

* **Porcentaje de Cobertura Activa:**
  * Calcular cuántos proyectos del portfolio filtrado tienen al menos uno de los tres booleanos en `True`: `com_semanal_activo`, `com_mensual_activo`, o `com_steerco_activo`.
* **Alertas de Desactualización:**
  * Mostrar un listado de proyectos con planes activos (`_activo == True`) que **no hayan registrado cambios** en su `indicador_rag` o en sus tablas transaccionales en los últimos 30 días. Esto previene proyectos "fantasma" sin actualización real.

---

## 6. REQUISITOS TÉCNICOS DE BACKEND / QUERIES

Para optimizar la carga del Grid principal, realizar una query agregada que calcule el estado financiero por proyecto en un solo paso:

```sql
SELECT 
    p.id_proyecto,
    p.nombre_proyecto,
    p.budget_inicial,
    p.fecha_fin_inicial,
    p.indicador_rag,
    -- Cálculo de días de impacto aprobados
    COALESCE(SUM(CASE WHEN ca.estado_cambio = 'APROBADO' THEN ca.dias_impacto ELSE 0 END), 0) as dias_retraso_aprobados,
    -- Consumo total (Facturado + Previsto)
    COALESCE(SUM(f.importe), 0) as gasto_total_facturas
FROM Proyectos p
LEFT JOIN Cambios_Alcance ca ON p.id_proyecto = ca.id_proyecto
LEFT JOIN Facturas f ON p.id_proyecto = f.id_proyecto AND f.estado IN ('PENDIENTE_DE_RECIBIR', 'PAGADA')
WHERE p.estado_proyecto IN (:estados_seleccionados)
  AND (:pm_seleccionado IS NULL OR p.id_pm = :pm_seleccionado)
GROUP BY p.id_proyecto;