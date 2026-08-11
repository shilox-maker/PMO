# 🏛️ PMO Control Tower — Strategic Portfolio & Governance Dashboard

**PMO Control Tower** es la plataforma ejecutiva de gobernanza de cartera de proyectos diseñada para supervisar de forma macro **+60 proyectos simultáneos**, aislando el ruido operativo diario para enfocarse en la mitigación de riesgos, control presupuestario preventivo y dirección estratégica de proveedores.

---

## 🎯 Propuesta de Valor & Visión Estratégica

A diferencia de las herramientas de gestión de tareas tradicionales (Jira, Trello), este sistema opera en la capa directiva de la PMO:

* 📊 **Supervisión Macro Preventiva:** Control consolidado de estado RAG (Red-Amber-Green), alertas tempranas de desviación y consumo CAPEX/OPEX.
* 🛡️ **Control Presupuestario Anticipado:** Cómputo de gasto comprometido (facturas recibidas y pendientes) para prevenir sobrecostes antes de la emisión de pagos.
* 🤝 **Gobierno de Proveedores (Partners):** Evaluación continua del desempeño de socios tecnológicos externos.
* 📄 **Motor de Informes Ejecutivos:** Generación de dossiers ejecutivos PDF (atómicos por proyecto o concatenados por portfolio) compatibles con comités de dirección.
* 🔒 **Comandos Auditados y Privacidad:** Muro de comunicación auditado con permisos de visibilidad restringida para la Dirección.

---

## 🏗️ Arquitectura Técnica & Entornos

Diseñado bajo la filosofía **KISS** (Keep It Simple, Stupid) para maximizar la mantenibilidad y minimizar el coste de infraestructura.

| Capa | Tecnología | Características |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | UI de alta densidad en CSS Puro con glassmorphic dark mode, Combobox predictivos y editor WYSIWYG. |
| **Backend** | Node.js + Express | API REST modular, motor de cálculo financiero en tiempo real, sanitización estricta e integraciones JWT. |
| **Persistencia** | SQLite / Azure SQL | Entorno local ligero (`SQLite`) y entorno empresarial gestionado (`Azure SQL Server`). |
| **Servidor / Hosting** | Azure App Service (PaaS) | Servidor gestionado en Azure PaaS con HTTPS automatizado, CI/CD zip deploy y fallback de desarrollo local. |

---

## ⚡ Capacidades Destacadas del Sistema

### 1. 📈 Dashboard de Gobernanza & Timeline Interactivo
- **Visualización Temporal:** Gantt horizontal con zoom por Trimestre, Mes y Semana con marcas de hitos clave.
- **Filtrado Multi-Criterio:** Segmentación en tiempo real por RAG, PM asignado, sedes y estados del flujo de trabajo.
- **Alertas de Desborde CAPEX:** Indicadores visuales de consumo presupuestario superior al 90%.

### 2. 📝 Editor Enriquecido & Muro de Comunicación Auditado
- Integración nativa con **Microsoft Outlook** (limpieza automática de formato y compatibilidad con pegado de imágenes/Base64).
- Distintivo **⭐ Informe** para comentarios cualitativos clave y canal **⭐ DIRECCIÓN** exclusivo para administradores y directores.

### 3. 🛠️ Administración y Operaciones del Sistema (SysOps)
- **Modo Mantenimiento Centralizado:** Activación en tiempo real desde la consola de administración con paso transparente para Administradores.
- **Backups y Rotación Desatendida:** Generación automática de snapshots JSON y volcados físicos SQLite con retención de hasta 30 días.
- **Despliegues Idempotentes:** Scripts PowerShell y Zip Deploy para actualización segura en Azure App Service.

---

## 🛠️ Herramientas de Operación y Scripts (`/scripts`)

La infraestructura incluye un conjunto de automatizaciones para tareas de despliegue y mantenimiento:

| Script | Ámbito | Descripción Ejecutiva |
| :--- | :--- | :--- |
| `backupDB.ps1` | **Backups** | Ejecución desatendida programable en el *Programador de Tareas de Windows*. |
| `restoreDB.ps1` | **Mantenimiento** | Menú CLI interactivo para listar y restaurar snapshots de base de datos. |
| `build-azure-zip.ps1` | **DevOps** | Empaquetado optimizado del artefacto para despliegue en Azure App Service. |
| `deploy-azure.ps1` | **DevOps** | Despliegue automatizado vía Kudu / Azure CLI en Azure App Service (PaaS). |
| `health-check.ps1` | **Monitoreo** | Diagnóstico del estado del motor Node, endpoints API (`/api/health`) y dist web. |
| `check-line-limits.js` | **Calidad** | Verificación del límite de líneas por fichero (KISS/SRP audit). |

---

## 🚀 Guía Rápida de Inicio (Entorno de Desarrollo)

### Requisitos Previos
* **Node.js** v18+ y **npm** v9+

### Paso 1: Inicializar Backend
```bash
cd backend
npm install
npm run seed     # Inicializa base de datos local con datos de prueba
npm start        # Inicia API en http://localhost:5000
```

### Paso 2: Inicializar Frontend
```bash
cd frontend
npm install
npm run dev      # Inicia cliente Vite en http://localhost:5173
```

---

## 🧪 Calidad y Pruebas
- **Backend Tests:** `cd backend && npm test` (API REST, validación Joi, sanitización HTML y cálculos financieros).
- **Frontend E2E:** `cd frontend && npm run test:e2e` (Pruebas de navegación en Chromium, Firefox y WebKit con Playwright).

---

## 🔒 Seguridad y Cumplimiento
Consulte la [Guía de Seguridad y Hardening](file:///c:/PruebasIA/Proyectos/PMO-1/security.md) para detalles sobre autenticación, mitigación OWASP y hashing de contraseñas.
