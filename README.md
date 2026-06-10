# 📑 PPM - Portfolio Management & Governance Dashboard

Plataforma de gobernanza de cartera de proyectos de alto nivel diseñada para que **4-5 Project Managers (PMs)** controlen de forma macro alrededor de **60 proyectos paralelos**.

---

## 🚀 Filosofía del Sistema: Macro-Gestión Preventiva
A diferencia de los gestores de tareas cotidianos, este sistema aísla los detalles técnicos diarios para evitar el ruido visual. Se enfoca en:
* **Control de Proveedores (Partners):** Seguimiento del desempeño de socios tecnológicos externos.
* **Mitigación de Riesgos e Incidencias:** Detección temprana de bloqueos.
* **Control de Cambios:** Aprobación e impacto en coste y tiempo.
* **Control Presupuestario Preventivo:** Alertas antes de que ocurra una desviación financiera crítica.

> [!NOTE]
> Este sistema es de uso exclusivo para PMs internos y Dirección Ejecutiva. Los proveedores **no** tienen acceso a esta plataforma; toda la información se registra internamente.

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está estructurado en un monorepositorio con dos componentes principales:

1. **Backend (`/backend`):**
   * **Core:** Node.js con Express.
   * **Base de Datos:** SQLite (`ppm_governance.db`) para facilidad de uso local.
   * **ORM:** Sequelize.
   * **Puerto por defecto:** `5000` (API accesible en `http://localhost:5000/api`).

2. **Frontend (`/frontend`):**
   * **Core:** React 19 (iniciado con Vite).
   * **Iconografía:** Lucide React.
   * **Estilos:** CSS / Diseño limpio y denso de nivel profesional.
   * **Puerto por defecto:** `5173` (Accesible en `http://localhost:5173`).

---

## 🗄️ Modelo de Datos y Entidades Principales

El backend gestiona las siguientes entidades relacionales claves en SQLite:
* **Sedes:** Sedes físicas de operación (ej. Valencia, Madrid, Buñol).
* **Proveedores:** Empresas proveedoras externas (incluyendo "Mi Empresa" como registro base).
* **Contactos_Proveedor:** Personas de contacto clave dentro de cada proveedor.
* **Key_Users (KU):** Usuarios clave del negocio o del proveedor que participan en comités o solicitan cambios.
* **Proyectos:** Entidad central. Almacena metadatos del proyecto, presupuesto inicial, hitos de control, semáforo RAG (Rojo-Amarillo-Verde) y planes de comunicación.
* **Incidencias:** Problemas activos (Técnica, Retraso, Presupuesto, Proveedor desaparecido).
* **Riesgos:** Amenazas identificadas y planes de mitigación correspondientes.
* **Facturas:** Registro financiero. Cuenta con estados `PAGADA` y `PENDIENTE_DE_RECIBIR`.
* **Cambios_Alcance (Change Requests):** Modificaciones formales que impactan en coste (importe) y tiempo (días).
* **Tareas (Checklist Interno):** Tareas del PM interno. Las de alta importancia se marcan como `es_hito = True` para visualización en el dashboard principal.

---

## ⚙️ Reglas de Negocio y Automatizaciones

El motor del backend calcula dinámicamente el estado real de cada proyecto combinando sus entidades transaccionales:

### 1. Motor Financiero
* **Budget Actualizado:**
  $$\text{Budget Actualizado} = \text{Budget Inicial} + \sum (\text{Importe de Cambios de Alcance APROBADOS})$$
* **Consumo Real:**
  $$\text{Consumo Real} = \sum (\text{Importe de Facturas con estado PAGADA o PENDIENTE\_DE\_RECIBIR})$$
* **Presupuesto Disponible:**
  $$\text{Presupuesto Disponible} = \text{Budget Actualizado} - \text{Consumo Real}$$

> [!IMPORTANT]
> Las facturas en estado `PENDIENTE_DE_RECIBIR` se computan preventivamente para alertar de desbordes presupuestarios antes de que se efectúen los pagos.

### 2. Motor Temporal
* **Fecha Fin Estimada:**
  $$\text{Fecha Fin Estimada} = \text{Fecha Fin Inicial} + \sum (\text{Días de Impacto de Cambios de Alcance APROBADOS})$$

---

## 🖥️ Vistas y Cuadros de Mando Principales

### 1. Executive Portfolio Dashboard (`/portfolio-dashboard` o `/governance`)
Una pantalla exclusiva para la Dirección Ejecutiva enfocada en métricas consolidadas:
* **Filtros Maestros:** Filtrado dinámico por **Rango de Fechas** (intersección temporal con la vida del proyecto) y por **Project Manager**.
* **KPI Cards (Alertas Tempranas):**
  * *Proyectos en Desborde:* Conteo de proyectos donde el Gasto Comprometido supera al Budget Inicial.
  * *Alerta Preventiva CAPEX:* Conteo de proyectos de tipo CAPEX que han consumido $\ge 90\%$ de su presupuesto inicial.
* **Desglose de Estados:** Gráfico o tarjetas de conteo de proyectos agrupados por sus fases lineales (*Kickoff, Desarrollo, Cierre, Pausado*).
* **Grid de Alta Densidad:** Lista de proyectos con alertas visuales de tiempo (días de retraso acumulados), alertas financieras (desbordes de coste en **Rojo**) y banderas de **Hitos Vencidos** (hitos pendientes con fecha límite pasada).

### 2. Vista Vendor 360º
Permite seleccionar un proveedor y auditar toda su actividad de un vistazo:
* Proyectos activos e históricos asignados.
* Historial completo de incidencias técnicas o presupuestarias de sus proyectos.
* Base de conocimiento de **Lecciones Aprendidas** asociadas al proveedor o a sus proyectos.

### 3. Compliance de Gobernanza
Panel lateral que calcula la cobertura activa de los planes de comunicación (Semanal, Mensual, SteerCo) y lista proyectos con posible abandono (aquellos sin actualizaciones de estado ni registros transaccionales en los últimos 30 días).

---

## 🏃 Instrucciones de Arranque Local

Asegúrate de tener instalado **Node.js** (versión 18 o superior). No necesitas Docker para ejecutar esta configuración.

### Paso 1: Configurar e Inicializar el Backend

1. Ve a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Ejecuta el script de semilla (Seeding) para crear la base de datos SQLite con datos iniciales de prueba:
   ```bash
   npm run seed
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```
   El servidor backend arrancará en el puerto `5000` (`http://localhost:5000`).

---

### Paso 2: Configurar e Inicializar el Frontend

1. Abre una nueva terminal y ve a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias del cliente:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en la URL indicada por la terminal (normalmente `http://localhost:5173`).

---

## 📝 Comandos Útiles de Desarrollo

| Componente | Comando | Descripción |
| :--- | :--- | :--- |
| **Backend** | `npm run seed` | Reinicializa y puebla la base de datos `ppm_governance.db`. |
| **Backend** | `npm start` | Inicia la API de Express. |
| **Frontend** | `npm run dev` | Arranca el entorno interactivo de desarrollo de Vite. |
| **Frontend** | `npm run build` | Compila el bundle de frontend optimizado para producción en `/frontend/dist`. |
