# 📑 PPM - Portfolio Management & Governance Dashboard

Plataforma de gobernanza de cartera de proyectos de alto nivel diseñada para que **Project Managers (PMs)** controlen de forma macro alrededor de **60 proyectos paralelos**, con soporte multiperfil, estados de flujo de trabajo dinámicos, búsquedas ágiles de Key Users e historial de comentarios auditado compatible con Microsoft Outlook.

---

## 🚀 Filosofía del Sistema: Macro-Gestión Preventiva
A diferencia de los gestores de tareas cotidianos, este sistema aísla los detalles técnicos diarios para evitar el ruido visual. Se enfoca en:
* **Control de Proveedores (Partners):** Seguimiento del desempeño de socios tecnológicos externos.
* **Mitigación de Riesgos e Incidencias:** Detección temprana de bloqueos.
* **Control de Cambios:** Aprobación e impacto en coste y tiempo.
* **Control Presupuestario Preventivo:** Alertas antes de que ocurra una desviación financiera crítica.
* **Muro de Comunicación Auditado:** Muro de comunicación interna de proyectos con editor enriquecido.

> [!NOTE]
> Este sistema es de uso exclusivo para PMs internos y Dirección Ejecutiva. Los proveedores **no** tienen acceso a esta plataforma; toda la información se registra internamente.

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está estructurado en un monorepositorio con dos componentes principales:

1. **Backend (`/backend`):**
   * **Core:** Node.js con Express.
   * **Base de Datos:** SQLite (`ppm_governance.db`) para facilidad de uso local.
   * **ORM:** Sequelize.
   * **Seguridad:** Encriptación de contraseñas mediante hashing SHA-256 (nativo con Node `crypto`).
   * **Puerto por defecto:** `5000` (API accesible en `http://localhost:5000/api`).

2. **Frontend (`/frontend`):**
   * **Core:** React 19 (iniciado con Vite).
   * **Iconografía:** Lucide React.
   * **Estilos:** CSS puro / Diseño limpio, denso y con glassmorphic dark mode para un feeling premium.
   * **Componentes Custom:** Buscador agrupado autocomplete (Combobox) y Editor WYSIWYG personalizado.
   * **Puerto por defecto:** `5173` (Accesible en `http://localhost:5173`).

---

## 🗄️ Modelo de Datos y Entidades Principales

El backend gestiona las siguientes entidades relacionales claves en SQLite:
* **Sedes:** Sedes físicas de operación (ej. Valencia, Madrid, Buñol).
* **Proveedores:** Empresas proveedoras externas (con **Dacsa** como la empresa interna preferente).
* **Contactos_Proveedor:** Personas de contacto clave dentro de cada proveedor.
* **Estados_Proyecto (Maestro):** Flujo de trabajo configurable (por defecto con 16 estados secuenciales) con emoji y orden de flujo.
* **Usuarios (Maestro):** Registro de PMs, Directores y Administradores con contraseñas encriptadas, perfil de permisos y estado de cuenta (`activo` / `inactivo`).
* **Key_Users (KU):** Usuarios clave del negocio o del proveedor que participan en comités o solicitan cambios.
* **Proyectos:** Entidad central. Almacena metadatos del proyecto, presupuesto inicial, hitos de control, semáforo RAG (Rojo-Amarillo-Verde) y planes de comunicación.
* **Comentarios_Proyecto:** Muro de comunicación histórico en cada proyecto con control de auditoría de edición (autoría, editor y fecha). Incluye un campo `es_importante` (booleano) para filtrar comentarios cualitativos relevantes para los informes ejecutivos.
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

### 3. Validación de Fechas en Backend
* Para evitar errores en el parseo y discrepancias en los husos horarios locales, la API del backend valida estrictamente que la fecha límite de cualquier tarea o hito se envíe en formato **ISO 8601 (`YYYY-MM-DD`)**. Cualquier fecha mal formateada o inexistente es rechazada preventivamente con un código `400 Bad Request`.

---

## 🖥️ Vistas y Funcionalidades Clave

### 1. Control de Acceso y Sesión (Multi-Perfil)
* **Formulario de Login**: Autenticación para los perfiles `ADMINISTRADOR`, `PM` y `DIRECTOR`.
* **Panel de Administración**: Acceso restringido exclusivamente a usuarios con rol `ADMINISTRADOR`. Permite dar de alta/baja (inactivar) usuarios, reestablecer contraseñas, y configurar la ordenación/emojis de las fases del flujo de trabajo (`Estados_Proyecto`).

### 2. Executive Portfolio Dashboard (`/governance`)
Una pantalla exclusiva para la Dirección Ejecutiva enfocada en métricas consolidadas:
* **Filtros Maestros:** Filtrado dinámico por **Rango de Fechas** (intersección temporal con la vida del proyecto) y por **Project Manager**.
* **KPI Cards (Alertas Tempranas):**
  * *Proyectos en Desborde:* Conteo de proyectos donde el Gasto Comprometido supera al Budget Inicial.
  * *Alerta Preventiva CAPEX:* Conteo de proyectos de tipo CAPEX que han consumido $\ge 90\%$ de su presupuesto inicial.
* **Segmentación Dinámica por Estados:** Botones dinámicos que muestran el conteo de proyectos en cada estado del flujo de trabajo directamente leídos del maestro de la base de datos (con soporte de redimensionamiento automático para múltiples estados). Soporte para multi-selección de estados y un botón rápido "📂 Proyectos abiertos" que filtra automáticamente los estados donde `proyecto_cerrado = false`.
* **📊 Exportar Informe de Portfolio:** Botón prominente que genera un dossier ejecutivo PDF concatenando los informes atómicos de todos los proyectos filtrados actualmente, con saltos de página obligatorios entre cada proyecto.

### 5. Motor de Reportes (Atómico y Concatenado)
* **Informe Atómico de Proyecto (`📄 Generar Informe`):** Desde la cabecera de la ficha de detalle del proyecto, genera un HTML estructurado con estilos CSS de impresión (`@media print`) para exportar limpiamente a PDF.
* **Estructura del bloque de proyecto:**
  * Cabecera con metadatos (ID, Nombre, PM, Partner, Sede, Estado con icono).
  * KPIs de Control: Comparativa Fecha Fin Inicial vs Estimada (retrasos en rojo) y Presupuesto Inicial vs Gasto Comprometido (sobrecostes en rojo).
  * Tabla de Hitos: Últimos 3 completados y próximos 3 pendientes.
  * **Muro Ejecutivo:** Solo los comentarios marcados como `es_importante = true` se imprimen en el informe. Los comentarios operativos ordinarios se omiten.
* **Informe de Portfolio Concatenado (`📊 Exportar Informe de Portfolio`):** Ejecuta el motor atómico para cada proyecto filtrado en la cuadrícula del Dashboard Ejecutivo, concatena los bloques HTML y aplica `page-break-after: always` entre cada uno.

### 3. Buscador Predictivo Combobox de Key Users
* Reemplaza las listas de checkboxes e inputs obsoletos por un componente autocomplete con buscador predictivo.
* Agrupa visualmente a los Key Users según su empresa (Proveedor). Los pertenecientes a **Dacsa** aparecen en la parte superior con un badge destacado de **Preferente**.

### 4. Muro de Comentarios con Editor WYSIWYG
* **Editor Customizado**: Soporte para formatos básicos (Negrita, cursiva, listas, y colores de texto).
* **Integración con Microsoft Outlook**:
  * **Pegado Limpio**: Intercepta eventos de pegado convirtiendo imágenes de portapapeles a Base64 e ignorando XMLs/clases excedentes de Outlook.
  - **Copiado de Listas**: Genera etiquetas de lista con estilos en línea (`list-style-type: disc` / `decimal`) asegurando que el copiado directo de comentarios a correos electrónicos de Outlook no rompa el diseño.
* **Historial Auditado**: Muestra una marca `(Editado)` visible con un tooltip que expone el usuario editor y el timestamp exacto de la última modificación.
* **Flag de Importancia (`es_importante`)**: Checkbox/toggle visual junto al botón de publicación: `[ ] Marcar como Importante (Incluir en Informe)`. Los comentarios marcados como importantes se resaltan visualmente con un borde dorado/ámbar y un badge "⭐ Informe". Solo estos comentarios aparecen en los informes ejecutivos generados.

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
