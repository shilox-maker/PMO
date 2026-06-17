# Alcance: Desacoplamiento de Dashboard, KPIs PMO y Filtro Estratégico

## 1. Objetivo
Separar el Executive Portfolio Dashboard en dos vistas especializadas ("Seguimiento de proyectos" para control operativo y "KPIs PMO" para análisis gráfico). Adicionalmente, se introduce la capacidad de clasificar proyectos como "Estratégicos", incorporando esta bandera como un Filtro Maestro global que permitirá a la Dirección analizar el rendimiento exclusivo de las iniciativas críticas del negocio.

## 2. Impacto y Conflictos
*   **Modifica (BBDD):** Entidad `Proyectos`. Se requiere script de migración (`umzug`).
*   **Modifica (UI/Navegación):** Renombra el dashboard actual a "Seguimiento de proyectos" (limpiando sus KPIs) y crea la nueva ruta `/kpis-pmo`.
*   **Extiende (UI/Filtros):** El componente de "Filtros Maestros" añade un tercer criterio ("Estratégico").
*   **Extiende (UI/Proyecto):** La ficha de detalle del proyecto recibe un nuevo control para editar el valor estratégico.
*   **Añade (Lógica Frontend):** Inyección de librería de gráficos (ej. Recharts) para la vista analítica.

## 3. Modelo de Datos / Estructura
*   **Base de Datos (SQLite):** 
    *   `Proyectos`: `ADD COLUMN es_estrategico BOOLEAN DEFAULT FALSE`.
*   **Vista 1: `/seguimiento` (Seguimiento de proyectos):**
    *   Filtros Maestros (Fechas, PM, **Estratégico**).
    *   Botones de Segmentación por Estados.
    *   Tabla/Grid de Proyectos.
*   **Vista 2: `/kpis-pmo` (KPIs PMO):**
    *   Filtros Maestros sincronizados.
    *   **5 KPI Cards:** Proyectos en Desborde, Alerta Preventiva CAPEX, Gobernanza, Planes Inactivos y Distribución RAG.
    *   **4 Gráficos Analíticos:** Proyectos por Estado, Proyectos por PM, Salud Financiera y Carga por Proveedor.

## 4. Criterios de Aceptación (BDD)

**Escenario 1: Marcado de un Proyecto como Estratégico**
*   **Dado que** un Project Manager o Director edita los metadatos de un proyecto...
*   **Cuando** visualiza la cabecera principal...
*   **Entonces** debe existir un interruptor/checkbox etiquetado como "Proyecto Estratégico".
*   **Y Cuando** lo activa y guarda...
*   **Entonces** el backend actualiza el campo `es_estrategico` a `TRUE` en la base de datos.

**Escenario 2: Limpieza de la Vista "Seguimiento de proyectos"**
*   **Dado que** el usuario accede a la vista operativa (`/seguimiento`)...
*   **Cuando** la pantalla carga...
*   **Entonces** visualiza los Filtros Maestros y la lista de proyectos, pero las KPI Cards superiores han sido retiradas de esta vista.

**Escenario 3: Funcionamiento del Nuevo Filtro Maestro**
*   **Dado que** el usuario se encuentra en `/seguimiento` o `/kpis-pmo`...
*   **Cuando** interactúa con el nuevo filtro maestro "Estratégico" y selecciona "Sí"...
*   **Entonces** el grid de proyectos, las tarjetas KPI y todos los gráficos deben recalcularse en tiempo real para excluir a los proyectos que tengan `es_estrategico = FALSE`.

**Escenario 4: Nueva Vista Analítica "KPIs PMO" y Distribución RAG**
*   **Dado que** el usuario navega a la nueva entrada de menú "KPIs PMO"...
*   **Cuando** observa la parte superior...
*   **Entonces** se muestran 5 KPI cards, incluyendo una nueva tarjeta "Distribución RAG" que indique visualmente cuántos proyectos filtrados están en Rojo, Amarillo y Verde.

**Escenario 5: Renderizado de Gráficos Analíticos**
*   **Dado que** el usuario hace scroll en la vista "KPIs PMO"...
*   **Cuando** visualiza la zona de gráficas...
*   **Entonces** debe interactuar con cuatro paneles gráficos:
    1. Gráfico Circular/Anillo: "Proyectos por Estado".
    2. Gráfico de Barras: "Proyectos por Project Manager".
    3. Gráfico de Anillo: "Salud Financiera" (Suma de Budget Actualizado vs Suma de Consumo Real).
    4. Gráfico de Barras: "Carga de trabajo por Proveedor".