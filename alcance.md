# 📑 PRODUCT REQUIREMENTS DOCUMENT (PRD) FOR LLM & DEVELOPMENT

## SYSTEM: Portfolio Management & Governance Dashboard (PPM)

### 1. SYSTEM OVERVIEW & ARCHITECTURE

* **Purpose:** High-level project portfolio governance platform for 4-5 Project Managers controlling ~60 parallel projects.
* **Core Philosophy:** Macro-management. The system isolates daily technical tasks to prevent visual noise. It focuses heavily on vendor control (Partners), risk mitigation, scope changes, and preventive budget tracking.
* **Target Users:** Internal PMs and Executive Direction. Vendors/Partners do NOT have access to this system (everything is logged internally by the PM).

---

### 2. RELATIONAL DATABASE SCHEMA & ENTITIES

#### 2.1 Entity: `Sedes` (Master)

* `id_sede` (UUID/Autonumeric, PK)
* `nombre_sede` (VARCHAR, Unique) - *e.g., "Valencia", "Madrid", "Buñol"*

#### 2.2 Entity: `Proveedores` (Master)

* `id_proveedor` (UUID/Autonumeric, PK)
* `nombre_razon_social` (VARCHAR, Unique) - *Note: "Mi Empresa" must be seeded as a vendor record.*
* `telefono_general` (VARCHAR, Nullable)
* `email_general` (VARCHAR, Nullable)

#### 2.3 Entity: `Contactos_Proveedor` (Transactional/Sub-table)

* `id_contacto` (UUID/Autonumeric, PK)
* `id_proveedor` (FK linking `Proveedores.id_proveedor`, On Delete Cascade)
* `nombre` (VARCHAR)
* `apellidos` (VARCHAR)
* `puesto` (VARCHAR)
* `telefono` (VARCHAR)
* `email` (VARCHAR)

#### 2.4 Entity: `Key_Users` (Master)

* `id_ku` (UUID/Autonumeric, PK)
* `nombre` (VARCHAR)
* `apellidos` (VARCHAR)
* `correo` (VARCHAR, Unique)
* `id_proveedor_empresa` (FK linking `Proveedores.id_proveedor`) - *Determines if the KU belongs to a vendor or to "Mi Empresa".*

#### 2.5 Entity: `Proyectos` (Main Core Entity)

* `id_proyecto` (VARCHAR, PK) - *Format: PRJ-YYYY-XXX*
* `nombre_proyecto` (VARCHAR)
* `descripcion` (TEXT)
* `id_pm` (FK linking User/Internal Staff)
* `id_proveedor` (FK linking `Proveedores.id_proveedor`)
* `id_sede` (FK linking `Sedes.id_sede`)
* `id_sponsor_ku` (FK linking `Key_Users.id_ku`)
* `estado_proyecto` (ENUM/VARCHAR) - *Linear workflow: e.g., Kickoff, Desarrollo, Cierre, Pausado...*
* `indicador_rag` (ENUM) - *Values: [VERDE, AMARILLO, ROJO]. Manual entry, no historical tracking required.*
* `fecha_inicio` (DATE)
* `fecha_fin_inicial` (DATE) - *Inmutable Baseline for calculations.*
* `es_capex` (BOOLEAN, Default False)
* `codigo_capex` (VARCHAR, Nullable) - *Required only if es_capex == True.*
* `budget_inicial` (NUMERIC/DECIMAL)
* **Plan de Comunicación Semanal:**
* `com_semanal_activo` (BOOLEAN, Default False)
* `com_semanal_finalidad` (TEXT, Nullable)


* **Plan de Comunicación Mensual:**
* `com_mensual_activo` (BOOLEAN, Default False)
* `com_mensual_finalidad` (TEXT, Nullable)


* **Plan de Comunicación SteerCo:**
* `com_steerco_activo` (BOOLEAN, Default False)
* `com_steerco_finalidad` (TEXT, Nullable)



##### Many-to-Many Relationships (Join Tables) for `Proyectos`:

1. `Proyecto_KeyUsers`: Links `id_proyecto` ↔ `id_ku` (Involved Key Users).
2. `Proyecto_ComSemanal_KU`: Links `id_proyecto` ↔ `id_ku` (Who participates in weekly communication).
3. `Proyecto_ComMensual_KU`: Links `id_proyecto` ↔ `id_ku` (Who participates in monthly communication).
4. `Proyecto_SteerCo_KU`: Links `id_proyecto` ↔ `id_ku` (Who participates in SteerCo).

#### 2.6 Entity: `Incidencias` (Transactional)

* `id_incidencia` (VARCHAR, PK) - *Format: INC-YYYY-XXX*
* `id_proyecto` (FK linking `Proyectos.id_proyecto`)
* `titulo` (VARCHAR)
* `descripcion` (TEXT)
* `tipo_incidencias` (ENUM) - *Values: [TECNICA, RETRASO_PLAZOS, PROVEEDOR_DESAPARECIDO, PRESUPUESTARIA]*
* `criticidad` (ENUM) - *Values: [BLOQUEANTE, ALTA, MEDIA, BAJA]*
* `estado` (ENUM) - *Values: [ABIERTA, EN_PROCESO, RESUELTA, CANCELADA]*
* `fecha_apertura` (DATE)
* `fecha_cierre` (DATE, Nullable)
* `solucion_aplicada` (TEXT, Nullable) - *Required when status transitions to RESUELTA.*

#### 2.7 Entity: `Riesgos` (Transactional)

* `id_riesgo` (VARCHAR, PK) - *Format: RSG-YYYY-XXX*
* `id_proyecto` (FK linking `Proyectos.id_proyecto`)
* `titulo_riesgo` (VARCHAR)
* `descripcion` (TEXT)
* `probabilidad` (ENUM) - *Values: [ALTA, MEDIA, BAJA]*
* `impacto` (ENUM) - *Values: [ALTA, MEDIA, BAJA]*
* `plan_mitigacion` (TEXT)
* `estado_riesgo` (ENUM) - *Values: [ACTIVO, MITIGADO, CERRADO]*
* `fecha_proxima_revision` (DATE)

#### 2.8 Entity: `Lecciones_Aprendidas` (Knowledge Base)

* `id_leccion` (VARCHAR, PK) - *Format: LEA-YYYY-XXX*
* `tipo_leccion` (ENUM) - *Values: [BUENA_PRACTICA, ERROR_A_EVITAR]*
* `id_proyecto` (FK linking `Proyectos.id_proyecto`, Nullable) - *Optional link.*
* `id_proveedor` (FK linking `Proveedores.id_proveedor`, Nullable) - *Optional link for general or cross-project vendor lessons.*
* `titulo` (VARCHAR)
* `contexto` (TEXT)
* `recomendacion_futura` (TEXT)

#### 2.9 Entity: `Facturas` (Financials)

* `id_interno_factura` (VARCHAR, PK) - *Format: FAC-YYYY-XXX*
* `id_proyecto` (FK linking `Proyectos.id_proyecto`)
* `id_proveedor` (FK linking `Proveedores.id_proveedor`) - *Explicit vendor selector, can differ from main project vendor.*
* `numero_factura` (VARCHAR) - *Official vendor invoice number.*
* `concepto` (TEXT)
* `fecha_factura` (DATE)
* `importe` (NUMERIC/DECIMAL)
* `estado` (ENUM) - *Values: [PENDIENTE_DE_RECIBIR, PAGADA]. Crucial note: Both statuses subtract from budget.*

#### 2.10 Entity: `Cambios_Alcance` (Scope Change Control)

* `id_cambio` (VARCHAR, PK) - *Format: CR-YYYY-XXX*
* `id_proyecto` (FK linking `Proyectos.id_proyecto`)
* `fecha_solicitud` (DATE)
* `fecha_resolucion` (DATE, Nullable)
* `id_solicitante_ku` (FK linking `Key_Users.id_ku`)
* `id_aprobador_ku` (FK linking `Key_Users.id_ku`)
* `estado_cambio` (ENUM) - *Values: [SOLICITADO, EN_REVISION, APROBADO, RECHAZADO]*
* `descripcion_motivo` (TEXT)
* `impacta_importe` (BOOLEAN)
* `importe_impacto` (NUMERIC/DECIMAL, Signed +/-) - *Value is 0 if impacta_importe is False.*
* `impacta_tiempo` (BOOLEAN)
* `dias_impacto` (INTEGER, Signed +/-) - *Value is 0 if impacta_tiempo is False.*

#### 2.11 Entity: `Tareas` (PM Internal Checklist)

* `id_tarea` (UUID/Autonumeric, PK)
* `id_proyecto` (FK linking `Proyectos.id_proyecto`)
* `titulo_tarea` (VARCHAR)
* `descripcion` (TEXT, Nullable)
* `es_hito` (BOOLEAN, Default False) - *If True, flag for high-level dashboard display.*
* `estado` (ENUM) - *Values: [PENDIENTE, COMPLETADA]*
* `fecha_limite` (DATE)
* *Note: Responsibility is implicitly inherited from `Proyectos.id_pm`.*

---

### 3. BUSINESS LOGIC & DYNAMIC FIELDS (AUTOMATIONS)

The backend/ORM must dynamically calculate or update fields in the `Proyectos` table based on transactional entities:

#### 3.1 Financial Engine

1. **Budget Actualizado:**

$$\text{Budget Actualizado} = \text{budget\_inicial} + \sum (\text{Cambios\_Alcance.importe\_impacto WHERE estado\_cambio} == \text{'APROBADO'})$$


2. **Consumo Real:**

$$\text{Consumo Real} = \sum (\text{Facturas.importe WHERE estado IN ['PENDIENTE\_DE\_RECIBIR', 'PAGADA']})$$


3. **Presupuesto Disponible:**

$$\text{Presupuesto Disponible} = \text{Budget Actualizado} - \text{Consumo Real}$$



#### 3.2 Timeline Engine

1. **Fecha Fin Estimada:**

$$\text{Fecha Fin Estimada} = \text{fecha\_fin\_inicial} + \sum (\text{Cambios\_Alcance.dias\_impacto WHERE estado\_cambio} == \text{'APROBADO'})$$



---

### 4. REQUIRED VIEWS & RELATED QUERIES (DASHBOARD LOGIC)

* **Vendor 360º View:** Selecting a record inside `Proveedores` must query and display in a dedicated UI block:
* All linked `Proyectos` (active and historical).
* All historical `Incidencias` triggered by projects tied to this vendor.
* All `Lecciones_Aprendidas` explicitly assigned to this `id_proveedor` or its projects.


* **Portfolio Dashboard:** High-level grid or Kanban view displaying exclusively the 60 rows of `Proyectos` displaying metadata: *ID, Name, PM, Vendor, RAG Status, Budget Actualizado, Presupuesto Disponible, and upcoming Tareas labeled as `es_hito == True*`. No micro-tasks allowed on this viewport.