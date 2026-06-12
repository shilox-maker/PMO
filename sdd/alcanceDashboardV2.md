```python
md_content = """# 🔄 REFACTOR SPECIFICATION: DASHBOARD SEPARATION & FILTER REFINEMENT

## 1. RESUMEN DEL CAMBIO
Se debe reestructurar la especificación previa del Dashboard de Portfolio. El panel de KPIs y control macro ya no compartirá espacio ni controles directos con la vista de lista técnica general; se traslada a una **nueva pantalla independiente**. Además, se modifican los criterios de filtrado global para priorizar el control temporal (rango de fechas) y se añade una sección de desglose estructural por estado del proyecto.

---

## 2. QUÉ DESHACER (REMOVER / MODIFICAR)

* **❌ ELIMINAR Filtro Global de Estado (Multiselección) de la Cabecera:** Ya no se filtrará el dashboard completo desde un selector de estados en el header. El estado pasa a ser un elemento de segmentación visual dentro de la propia pantalla.
* **❌ DESHACER Integración en Vista Existente:** Eliminar cualquier intento de acoplar este grid/panel dentro de la vista principal de proyectos actuales. Debe limpiarse esa ruta.

---

## 3. QUÉ REHACER (NUEVA IMPLEMENTACIÓN)

### 3.1 Estructura y Navegación
* **Nueva Pantalla Dedicada:** Crear una nueva ruta/pantalla independiente en el sistema (ej. `/portfolio-dashboard` o `/governance`). Esta pantalla estará optimizada para la Dirección Ejecutiva y consumirá exclusivamente métricas de macro-gestión.

### 3.2 Nuevos Filtros Globales (Cabecera de la Pantalla)
Toda la pantalla responderá dinámicamente a dos únicos filtros maestros combinados:
1.  **Filtro por Rango de Fechas:** * **Control UI:** Selector de fecha "Desde / Hasta" (Date Range Picker).
    * **Lógica:** Filtrará los proyectos cuya duración (`fecha_inicio` hasta `Fecha Fin Estimada`) se solape total o parcialmente con el rango seleccionado.
2.  **Filtro por Project Manager:** * **Control UI:** Desplegable de selección de usuarios (`id_pm`).

---

### 3.3 Nuevos Componentes de la Pantalla (Layout de Arriba a Abajo)

#### BLOQUE 1: Tarjetas de KPIs Centrales (Financieros)
Mantener las dos tarjetas de alerta temprana calculadas dinámicamente según el rango de fechas y PM seleccionado:
* **KPI 1: Proyectos en Desborde de Baseline:** Conteo de proyectos abiertos en el periodo donde `SUM(Facturas.importe) > Proyectos.budget_inicial`.
* **KPI 2: Alerta Preventiva CAPEX:** Conteo de proyectos con `es_capex == True` que han consumido o esperan consumir (facturas recibidas + pendientes) $\ge 90\%$ de su `budget_inicial`.

#### BLOQUE 2: Desglose de Proyectos por Estado
* **Control UI:** Panel visual intermedio (pueden ser mini-tarjetas contenedoras o un gráfico de distribución).
* **Función:** Mostrar el conteo exacto de proyectos distribuidos por cada flujo lineal (`Kickoff`, `Desarrollo`, `Cierre`, `Pausado`) que estén activos en el rango de fechas y pertenezcan al PM filtrado.
* **Interactividad (Opcional):** Hacer clic en un estado actuará como un filtro rápido secundario para el grid inferior.

#### BLOQUE 3: Grid de Control Filtrado por Tiempo y PM
Tabla de alta densidad que lista los proyectos resultantes del filtro de fechas y PM, mostrando obligatoriamente:
* `id_proyecto` y `nombre_proyecto`.
* `id_pm` asignado.
* Semáforo manual `indicador_rag` (VERDE/AMARILLO/ROJO).
* **Alerta de Tiempo:** Días de retraso real acumulados por Cambios de Alcance aprobados (`Fecha Fin Estimada > fecha_fin_inicial`) o alerta de **Hito Vencido** si aplica.
* **Alerta de Dinero:** Texto resaltado en **ROJO** si el total de facturas (recibidas + pendientes de recibir) supera al `budget_inicial` del proyecto.

---

## 4. ACTUALIZACIÓN DE QUERY LOGIC (BACKEND)

Modificar la lógica de extracción de datos para sustituir el filtro IN de estados por la cláusula de intersección de fechas:


```

```text
File created successfully.

```sql
SELECT 
    p.id_proyecto,
    p.nombre_proyecto,
    p.budget_inicial,
    p.fecha_inicio,
    p.fecha_fin_inicial,
    p.indicador_rag,
    p.estado_proyecto,
    COALESCE(SUM(CASE WHEN ca.estado_cambio = 'APROBADO' THEN ca.dias_impacto ELSE 0 END), 0) as dias_retraso_aprobados,
    COALESCE(SUM(f.importe), 0) as gasto_total_facturas
FROM Proyectos p
LEFT JOIN Cambios_Alcance ca ON p.id_proyecto = ca.id_proyecto
LEFT JOIN Facturas f ON p.id_proyecto = f.id_proyecto AND f.estado IN ('PENDIENTE_DE_RECIBIR', 'PAGADA')
WHERE 
    -- Filtro por Project Manager
    (:pm_seleccionado IS NULL OR p.id_pm = :pm_seleccionado)
    -- Filtro por Rango de Fechas (Intersección de periodos)
    AND (p.fecha_inicio <= :fecha_hasta AND (p.fecha_fin_inicial + INTERVAL COALESCE(ca.dias_impacto, 0) DAY) >= :fecha_desde)
GROUP BY p.id_proyecto, p.estado_proyecto;

```

"""

with open("dashboard_refine_instructions.md", "w", encoding="utf-8") as f:
f.write(md_content)

print("File created successfully.")

```
Your Markdown file is ready
[file-tag: code-generated-file-0-1780612836298484442]

He preparado el documento de especificación técnica de refactorización (`dashboard_refine_instructions.md`) optimizado para que un entorno de desarrollo o agente de IA pueda procesar exactamente los cambios estructurales.

### Resumen de las instrucciones incluidas en el archivo:

1. **Qué deshacer/eliminar:**
   * Se elimina el filtro global multiselección por Estado de la cabecera (pasa a ser un componente interno de desglose).
   * Se deshace cualquier acoplamiento con la vista o lista técnica general de proyectos del sistema actual.

2. **Qué rehacer/implementar:**
   * **Nueva Pantalla Independiente:** Una vista o ruta exclusiva (`/portfolio-dashboard`) pensada para la Dirección Ejecutiva.
   * **Filtros de Cabecera Renovados:** Filtro por **Rango de Fechas** (intersección temporal con la vida del proyecto) y filtro por **Project Manager**.
   * **Componente de Desglose por Estado:** Un bloque visual (tarjetas de conteo rápido o gráfico) que muestra cuántos proyectos hay en cada fase (*Kickoff, Desarrollo, Cierre, Pausado*) dentro del periodo y PM seleccionados.
   * **Panel de KPIs Financieros:** Mantiene el foco en el control preventivo mapeando los desbordes contra el *budget/capex inicial* a partir de facturas recibidas y estimadas (`PENDIENTE_DE_RECIBIR`).
   * **Grid de Control Filtrado:** La tabla de alta densidad que se actualiza dinámicamente según las fechas y el PM seleccionado.
   * **Query de Backend Actualizada:** Estructura SQL base ajustada para calcular la intersección temporal de fechas en lugar del filtro plano de estados.

```