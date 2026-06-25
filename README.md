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

### 3. Timeline / Gantt de Portfolio (`/timeline`)
Vista global interactiva que mapea todos los proyectos en un eje temporal horizontal:
* **Zoom Dinámico:** Permite alternar entre vistas de calendario Trimestral, Mensual y Semanal para analizar picos de carga.
* **Hitos Visuales:** Muestra las tareas clave (`es_hito`) como diamantes interactivos ubicados sobre las barras de los proyectos, con tooltips que detallan su estado y fecha.
* **Línea del Día "Hoy":** Ubica automáticamente el foco visual en el momento actual para evaluar el progreso en tiempo real.
* **Filtrado Múltiple:** Segmentación instantánea por RAG, PM y proyectos cerrados.

### 4. Motor de Reportes (Atómico y Concatenado)
* **Informe Atómico de Proyecto (`📄 Generar Informe`):** Desde la cabecera de la ficha de detalle del proyecto, genera un HTML estructurado con estilos CSS de impresión (`@media print`) para exportar limpiamente a PDF.
* **Estructura del bloque de proyecto:**
  * Cabecera con metadatos (ID, Nombre, PM, Partner, Sede, Estado con icono).
  * KPIs de Control: Comparativa Fecha Fin Inicial vs Estimada (retrasos en rojo) y Presupuesto Inicial vs Gasto Comprometido (sobrecostes en rojo).
  * Tabla de Hitos: Últimos 3 completados y próximos 3 pendientes.
  * **Muro Ejecutivo:** Solo los comentarios marcados como `es_importante = true` se imprimen en el informe. Los comentarios operativos ordinarios se omiten.
* **Informe de Portfolio Concatenado (`📊 Exportar Informe de Portfolio`):** Ejecuta el motor atómico para cada proyecto filtrado en la cuadrícula del Dashboard Ejecutivo, concatena los bloques HTML y aplica `page-break-after: always` entre cada uno.
* **Informe Consolidado de Seguimiento (`🖨️ Generar Informe`):** Desde el Dashboard (Seguimiento de Proyectos), genera un informe configurable de los proyectos filtrados. Permite seleccionar qué secciones incluir (Resumen, Alcance, Riesgos) y configurar la fecha "Remarcar a partir de" para añadir un distintivo rojo `A REVISAR` en los comentarios nuevos.

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
* **Visibilidad Limitada ("Para Dirección")**: Permite restringir comentarios para que únicamente sean visibles por los roles `ADMINISTRADOR` y `DIRECTOR` (tanto en la interfaz web como en los reportes e informes). Los comentarios de dirección se identifican con un fondo azul claro y la etiqueta `⭐ DIRECCIÓN`.


## Pruebas Funcionales (E2E y API)

La aplicación cuenta con una suite de pruebas para verificar el funcionamiento del Frontend (E2E) y Backend (API).

### 1. Pruebas de Backend (API)
Se utiliza **Jest** y **Supertest** contra una base de datos SQLite en memoria (`:memory:`).
```bash
cd backend
npm test
```

### 2. Pruebas de Frontend (E2E)
Se utiliza **Playwright** para simular la navegación en navegador real.
```bash
cd frontend
npx playwright test
```

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

## 🌍 Despliegue en Red Local / Servidor (Ej: Raspberry Pi)

Al desplegar en un servidor o Raspberry Pi accesible desde otros equipos de la red, es **obligatorio** configurar las variables de entorno para evitar errores de conexión o problemas de **CORS**.

1. **Backend (CORS configurado)**:
   - El backend ya cuenta con `cors()` explícitamente configurado para permitir cualquier origen (`origin: '*'`) y validar las cabeceras personalizadas necesarias como `x-pm-id`.

2. **Frontend (Archivo `.env`)**:
   - Debes crear o modificar el archivo `.env` dentro de la carpeta `frontend/`.
   - **Incorrecto (si se accede desde otro PC)**: `VITE_API_URL=http://localhost:5000/api`
   - **Correcto**: `VITE_API_URL=http://<IP_DEL_SERVIDOR>:5000/api` (ej: `192.168.0.33`).
   - *Nota: En Linux, los archivos que empiezan por punto (`.env`) están ocultos. Usa `ls -a` para verlos.*

3. **Recompilación Obligatoria**:
   - En Vite/React, las variables de entorno se inyectan en tiempo de compilación. **Siempre que cambies el `.env` debes recompilar** ejecutando:
     ```bash
      npm run build
      ```

## 🖥️ Despliegue en Windows Server 2022 (IIS + SSL + Azure SQL)

El proyecto está preparado para desplegarse de manera profesional en un entorno Windows Server 2022 compartiendo la máquina con otros sitios IIS activos:

* **IIS** actúa como Reverse Proxy (puertos 80/443), direccionando el tráfico a los puertos locales de Node.js mediante reglas de reescritura de URL (`URL Rewrite` y `ARR`).
* **Certificados SSL** generados de forma automática y gratuita mediante `win-acme` (Let's Encrypt).
* **PM2** gestiona las aplicaciones en segundo plano como servicios de Windows:
  - **PRE** (`prepmo.dacsa.com`): Puerto local `5000`, apuntando al esquema Azure SQL `PREPMO`.
  - **PRO** (`pmo.dacsa.com`): Puerto local `5100`, apuntando al esquema Azure SQL `PROPMO`.
* **Base de datos**: Alojada en Azure SQL Server utilizando esquemas lógicos separados para mayor seguridad y aislamiento.

### 🛠️ Scripts en Directorio `/scripts`

En la carpeta [/scripts](file:///c:/PruebasIA/Proyectos/PMO-1/scripts) se proporcionan las herramientas de automatización:
1. **[create-schemas.sql](file:///c:/PruebasIA/Proyectos/PMO-1/scripts/create-schemas.sql)**: Creación de esquemas y usuarios de base de datos en Azure SQL.
2. **[setup-server.ps1](file:///c:/PruebasIA/Proyectos/PMO-1/scripts/setup-server.ps1)**: Instalación automatizada de dependencias globales (Node, Git, PM2), creación de carpetas en `C:\Apps\PMO\` y clonado del repositorio.
3. **[setup-iis.ps1](file:///c:/PruebasIA/Proyectos/PMO-1/scripts/setup-iis.ps1)**: Configura ARR, URL Rewrite y crea los sitios IIS con bindings y certificados win-acme.
4. **[deploy-pre.ps1](file:///c:/PruebasIA/Proyectos/PMO-1/scripts/deploy-pre.ps1)**: Descarga la rama `develop`, realiza backup previo de la base de datos, ejecuta migraciones y recompila el frontend.
5. **[deploy-pro.ps1](file:///c:/PruebasIA/Proyectos/PMO-1/scripts/deploy-pro.ps1)**: Muestra commits pendientes, requiere confirmación explícita (`DEPLOY`), realiza backup, corre migraciones de producción y recompila.
6. **[promote-to-main.ps1](file:///c:/PruebasIA/Proyectos/PMO-1/scripts/promote-to-main.ps1)**: Realiza el merge seguro de `develop` a `main` desde el servidor.
7. **[health-check.ps1](file:///c:/PruebasIA/Proyectos/PMO-1/scripts/health-check.ps1)**: Diagnóstico general del estado de PM2, HTTP API y frontend dist.

### 💾 Utilidad de Copias de Seguridad (Rollback)

Se incluye la utilidad en [backup.js](file:///c:/PruebasIA/Proyectos/PMO-1/backend/utils/backup.js) (integrada de forma automática antes de cada migración de base de datos):
* **Hacer backup**: `node utils/backup.js export` (o `npm run db:backup`)
* **Listar backups**: `node utils/backup.js list` (o `npm run db:backups`)
* **Restaurar snapshot**: `node utils/backup.js restore <fichero.json>` (o `npm run db:restore <fichero.json>`)

---

## 🚀 Automatización de Despliegue en Linux/Raspberry Pi (`deploy.sh`)

La plataforma incluye un script maestro en la raíz (`deploy.sh`) para automatizar el ciclo de actualización en producción (ej: Raspberry Pi).

El script gestiona el ciclo de vida completo de forma segura:
1. `git pull` de los últimos cambios de la rama `main`.
2. Instalación de dependencias del backend.
3. Ejecución de **Migraciones de Base de Datos** de forma segura usando `umzug` (`npm run migrate`).
4. Instalación de dependencias y compilación para producción (`npm run build`) del frontend.
5. Reinicio automático de todos los servicios locales usando **PM2**.
6. Detección y muestreo automático de las URLs generadas por Cloudflared en caso de usar túneles públicos.

*Para actualizar la plataforma, simplemente ejecuta `./deploy.sh` por SSH en el servidor.*

---

## 🛠️ Comandos Útiles de Desarrollo

| Componente | Comando | Descripción |
| :--- | :--- | :--- |
| **Backend** | `npm run seed` | Reinicializa y puebla la base de datos `ppm_governance.db`. Destructivo (borra datos actuales). |
| **Backend** | `npm run migrate` | Ejecuta las migraciones de base de datos pendientes (`umzug`). |
| **Backend** | `npm start` | Inicia la API de Express (también ejecuta migraciones pendientes). |
| **Frontend** | `npm run dev` | Arranca el entorno interactivo de desarrollo de Vite. |
| **Frontend** | `npm run build` | Compila el bundle de frontend optimizado para producción en `/frontend/dist`. |
