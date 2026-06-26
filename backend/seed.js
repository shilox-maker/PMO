const { 
  sequelize, Sedes, Proveedores, ContactosProveedor, Usuarios,
  Proyectos, Incidencias, Riesgos, LeccionesAprendidas, Facturas,
  CambiosAlcance, Tareas, ProyectoContactosProveedor, ProyectoComSemanalContacto, 
  ProyectoComMensualContacto, ProyectoComSteerCoContacto, EstadosProyecto, ComentariosProyecto 
} = require('./models/index');

const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  try {
    console.log('Synchronizing database models...');
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.sync({ force: true });
    await sequelize.query('PRAGMA foreign_keys = ON;');
    console.log('Database synced. Seeding tables...');

    // ==========================================
    // 1. SEDES
    // ==========================================
    const sedes = await Sedes.bulkCreate([
      { nombre_sede: 'Valencia' },
      { nombre_sede: 'Madrid' },
      { nombre_sede: 'Buñol' },
      { nombre_sede: 'Barcelona' },
      { nombre_sede: 'Sevilla' }
    ]);
    console.log('Sedes seeded.');
    const [sedValencia, sedMadrid, sedBunol, sedBarcelona, sedSevilla] = sedes;

    // ==========================================
    // 2. PROVEEDORES
    // ==========================================
    const proveedores = await Proveedores.bulkCreate([
      { nombre_razon_social: 'Dacsa', telefono_general: '910000000', email_general: 'contacto@dacsa.com' },
      { nombre_razon_social: 'Sopra Steria', telefono_general: '960000001', email_general: 'info@soprasteria.com' },
      { nombre_razon_social: 'Indra Minsait', telefono_general: '960000002', email_general: 'info@minsait.com' },
      { nombre_razon_social: 'Accenture', telefono_general: '960000003', email_general: 'info@accenture.com' },
      { nombre_razon_social: 'Capgemini', telefono_general: '960000004', email_general: 'info@capgemini.com' },
      { nombre_razon_social: 'NTT Data', telefono_general: '910000005', email_general: 'info@nttdata.com' },
      { nombre_razon_social: 'Deloitte Tech', telefono_general: '910000006', email_general: 'info@deloittetech.com' }
    ]);
    console.log('Proveedores seeded.');
    const [dacsa, sopra, indra, accenture, capgemini, nttData, deloitte] = proveedores;

    // ==========================================
    // 3. CONTACTOS PROVEEDOR
    // ==========================================
    await ContactosProveedor.bulkCreate([
      { id_proveedor: sopra.id_proveedor, nombre: 'Ana', apellidos: 'García', puesto: 'Account Executive', telefono: '600111222', email: 'agarcia@sopra.com' },
      { id_proveedor: sopra.id_proveedor, nombre: 'Luis', apellidos: 'López', puesto: 'Technical Lead', telefono: '600333444', email: 'llopez@sopra.com' },
      { id_proveedor: indra.id_proveedor, nombre: 'Javier', apellidos: 'Sanz', puesto: 'Service Manager', telefono: '610555666', email: 'jsanz@minsait.com' },
      { id_proveedor: indra.id_proveedor, nombre: 'Carmen', apellidos: 'Ruiz', puesto: 'Arquitecta Cloud', telefono: '610777888', email: 'cruiz@minsait.com' },
      { id_proveedor: accenture.id_proveedor, nombre: 'Beatriz', apellidos: 'Gómez', puesto: 'Client Partner', telefono: '620777888', email: 'b.gomez@accenture.com' },
      { id_proveedor: capgemini.id_proveedor, nombre: 'Rodrigo', apellidos: 'Peña', puesto: 'Cybersecurity Lead', telefono: '630888999', email: 'r.pena@capgemini.com' },
      { id_proveedor: nttData.id_proveedor, nombre: 'Irina', apellidos: 'Molina', puesto: 'Data Engineer', telefono: '640999111', email: 'i.molina@nttdata.com' },
      { id_proveedor: deloitte.id_proveedor, nombre: 'Sergio', apellidos: 'Blanco', puesto: 'SAP Functional', telefono: '650111333', email: 's.blanco@deloittetech.com' }
    ]);
    console.log('ContactosProveedor seeded.');

    // ==========================================
    // 4. ESTADOS PROYECTO (16 estados)
    // ==========================================
    const statesData = [
      { nombre_estado: 'Petición', icono: '📩', orden: 1, proyecto_cerrado: false },
      { nombre_estado: 'Estudio de viabilidad', icono: '📋', orden: 2, proyecto_cerrado: false },
      { nombre_estado: 'Buscar propuestas', icono: '🔍', orden: 3, proyecto_cerrado: false },
      { nombre_estado: 'Tener aprobación', icono: '⏳', orden: 4, proyecto_cerrado: false },
      { nombre_estado: 'Planificar', icono: '📅', orden: 5, proyecto_cerrado: false },
      { nombre_estado: 'Kickoff', icono: '🚀', orden: 6, proyecto_cerrado: false },
      { nombre_estado: 'Ejecución', icono: '🛠️', orden: 7, proyecto_cerrado: false },
      { nombre_estado: 'Go Live', icono: '📦', orden: 8, proyecto_cerrado: false },
      { nombre_estado: 'Estabilización', icono: '🛡️', orden: 9, proyecto_cerrado: false },
      { nombre_estado: 'Cierre', icono: '🏁', orden: 10, proyecto_cerrado: true },
      { nombre_estado: 'Descartado', icono: '🗑️', orden: 11, proyecto_cerrado: true },
      { nombre_estado: 'Cancelado', icono: '❌', orden: 12, proyecto_cerrado: true }
    ];
    const seededStates = await EstadosProyecto.bulkCreate(statesData);
    const sm = {};
    seededStates.forEach(s => { sm[s.nombre_estado] = s.id_estado; });
    console.log('EstadosProyecto seeded.');

    // ==========================================
    // 5. USUARIOS
    // ==========================================
    const users = await Usuarios.bulkCreate([
      { nombre: 'Jaime',        apellidos: 'Martínez',  correo: 'jmartinez@dacsa.com',  password: hashPassword('123'),   perfil: 'PM',             activo: true },
      { nombre: 'Marta',        apellidos: 'Sánchez',   correo: 'msanchez@dacsa.com',   password: hashPassword('123'),   perfil: 'PM',             activo: true },
      { nombre: 'Carlos',       apellidos: 'Gómez',     correo: 'cgomez@dacsa.com',     password: hashPassword('123'),   perfil: 'PM',             activo: true },
      { nombre: 'Lucía',        apellidos: 'Fernández', correo: 'lfernandez@dacsa.com', password: hashPassword('123'),   perfil: 'DIRECTOR',       activo: true },
      { nombre: 'Administrador',apellidos: 'Sistema',   correo: 'admin@dacsa.com',      password: hashPassword('admin'), perfil: 'ADMINISTRADOR',  activo: true },
      { nombre: 'Rafael',       apellidos: 'Moreno',    correo: 'rmoreno@dacsa.com',    password: hashPassword('123'),   perfil: 'PM',             activo: true }
    ]);
    const [pmJaime, pmMarta, pmCarlos, dirLucia, adminSys, pmRafael] = users;
    console.log('Usuarios seeded.');

    // ==========================================
    // 6. KEY USERS
    // ==========================================
    const keyUsers = await ContactosProveedor.bulkCreate([
      // Dacsa internos (stakeholders)
      { nombre: 'Roberto',  apellidos: 'Ramos',    email: 'rramos@dacsa.com',    id_proveedor: dacsa.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Elena',    apellidos: 'Vargas',   email: 'evargas@dacsa.com',   id_proveedor: dacsa.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Diego',    apellidos: 'Torres',   email: 'dtorres@dacsa.com',   id_proveedor: dacsa.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Patricia', apellidos: 'Campos',   email: 'pcampos@dacsa.com',   id_proveedor: dacsa.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Álvaro',   apellidos: 'Reyes',    email: 'areyes@dacsa.com',    id_proveedor: dacsa.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      // Vendor KUs
      { nombre: 'Pedro',    apellidos: 'Gutiérrez',email: 'pgutierrez@sopra.com',id_proveedor: sopra.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Sofía',    apellidos: 'Nieto',    email: 'snieto@minsait.com',  id_proveedor: indra.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Tomás',    apellidos: 'Marín',    email: 'tmarin@accenture.com',id_proveedor: accenture.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Iván',     apellidos: 'Cano',     email: 'icano@capgemini.com', id_proveedor: capgemini.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Nuria',    apellidos: 'Esteve',   email: 'nesteve@nttdata.com', id_proveedor: nttData.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' },
      { nombre: 'Marcos',   apellidos: 'Pardo',    email: 'mpardo@deloitte.com', id_proveedor: deloitte.id_proveedor, puesto: 'Stakeholder', telefono: '600000000' }
    ]);
    const [kuRoberto, kuElena, kuDiego, kuPatricia, kuAlvaro, kuPedro, kuSofia, kuTomas, kuIvan, kuNuria, kuMarcos] = keyUsers;
    console.log('ContactosProveedor seeded.');

    // ==========================================
    // 7. PROYECTOS (15 proyectos)
    // ==========================================
    const proyectosData = [
      {
        id_proyecto: 'PRJ-2026-001', nombre_proyecto: 'Renovación ERP Valencia',
        descripcion: 'Migración del sistema ERP local a la plataforma en la nube para mejorar la gestión comercial y financiera.',
        id_pm: pmJaime.id_usuario, id_proveedor: sopra.id_proveedor, id_sede: sedValencia.id_sede,
        id_sponsor: kuRoberto.id_contacto, id_estado: sm['Ejecución'], indicador_rag: 'VERDE',
        fecha_inicio: '2026-01-10', fecha_fin_inicial: '2026-10-31', es_capex: true, codigo_capex: 'CPX-998822', budget_inicial: 250000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Seguimiento técnico de sprints y bloqueos.',
        com_mensual_activo: true, com_mensual_finalidad: 'Comité directivo de hitos y facturación.',
        com_steerco_activo: true, com_steerco_finalidad: 'SteerCo trimestral con Dirección de Operaciones.',
        fecha_peticion: '2026-01-10', fecha_kickoff: '2026-01-10'
      },
      {
        id_proyecto: 'PRJ-2026-002', nombre_proyecto: 'Portal de Clientes Centralizado',
        descripcion: 'Desarrollo de un portal unificado para gestión de clientes a nivel nacional con SSO corporativo.',
        id_pm: pmMarta.id_usuario, id_proveedor: indra.id_proveedor, id_sede: sedMadrid.id_sede,
        id_sponsor: kuElena.id_contacto, id_estado: sm['Ejecución'], indicador_rag: 'AMARILLO',
        fecha_inicio: '2026-02-01', fecha_fin_inicial: '2026-09-30', es_capex: false, budget_inicial: 120000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Sincronización de requerimientos de diseño.',
        com_mensual_activo: true, com_mensual_finalidad: 'Revisión de avance con el Comité de Clientes.',
        com_steerco_activo: false,
        fecha_peticion: '2026-02-01', fecha_kickoff: '2026-02-01'
      },
      {
        id_proyecto: 'PRJ-2026-003', nombre_proyecto: 'Automatización Almacén Buñol',
        descripcion: 'Implementación de lectores RFID y software de control logístico en planta. Primera fase de industria 4.0.',
        id_pm: pmJaime.id_usuario, id_proveedor: accenture.id_proveedor, id_sede: sedBunol.id_sede,
        id_sponsor: kuDiego.id_contacto, id_estado: sm['Ejecución'], indicador_rag: 'AMARILLO',
        fecha_inicio: '2026-02-15', fecha_fin_inicial: '2026-08-30', es_capex: true, codigo_capex: 'CPX-443311', budget_inicial: 340000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Revisión técnica de despliegue en campo.',
        com_mensual_activo: true, com_mensual_finalidad: 'Revisión de consumo de presupuesto.',
        com_steerco_activo: true, com_steerco_finalidad: 'Reunión ejecutiva por desviación presupuestaria.',
        fecha_peticion: '2026-02-15', fecha_kickoff: '2026-02-15'
      },
      {
        id_proyecto: 'PRJ-2026-004', nombre_proyecto: 'Ciberseguridad Infraestructura Crítica',
        descripcion: 'Auditoría y fortificación perimetral de servidores centrales y endpoints corporativos.',
        id_pm: pmCarlos.id_usuario, id_proveedor: capgemini.id_proveedor, id_sede: sedMadrid.id_sede,
        id_sponsor: kuRoberto.id_contacto, id_estado: sm['Ejecución'], indicador_rag: 'ROJO',
        fecha_inicio: '2026-03-01', fecha_fin_inicial: '2026-07-15', es_capex: false, budget_inicial: 95000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Actualización semanal de parches críticos.',
        com_mensual_activo: true, com_mensual_finalidad: 'Presentación de informe de vulnerabilidades.',
        com_steerco_activo: false,
        fecha_peticion: '2026-03-01', fecha_kickoff: '2026-03-01'
      },
      {
        id_proyecto: 'PRJ-2026-005', nombre_proyecto: 'Plataforma Analítica Big Data',
        descripcion: 'Implementación de arquitectura de datos moderna sobre Databricks y Power BI para reporting ejecutivo.',
        id_pm: pmJaime.id_usuario, id_proveedor: nttData.id_proveedor, id_sede: sedBarcelona.id_sede,
        id_sponsor: kuElena.id_contacto, id_estado: sm['Cierre'], indicador_rag: 'VERDE',
        fecha_inicio: '2025-06-01', fecha_fin_inicial: '2026-04-30', es_capex: true, codigo_capex: 'CPX-556677', budget_inicial: 420000.00,
        com_semanal_activo: false,
        com_mensual_activo: true, com_mensual_finalidad: 'Cierre formal y entrega a operaciones.',
        com_steerco_activo: false,
        fecha_peticion: '2025-06-01', fecha_kickoff: '2025-06-01', fecha_go_live: '2026-04-30', fecha_cierre: '2026-04-30'
      },
      {
        id_proyecto: 'PRJ-2026-006', nombre_proyecto: 'Migración Telefonía IP',
        descripcion: 'Actualización de centralitas y despliegue de telefonía sobre IP para todas las sedes nacionales.',
        id_pm: pmMarta.id_usuario, id_proveedor: indra.id_proveedor, id_sede: sedValencia.id_sede,
        id_sponsor: kuDiego.id_contacto, id_estado: sm['Ejecución'], indicador_rag: 'AMARILLO',
        fecha_inicio: '2025-11-01', fecha_fin_inicial: '2026-05-30', es_capex: false, budget_inicial: 80000.00,
        com_semanal_activo: false, com_mensual_activo: false, com_steerco_activo: false,
        fecha_peticion: '2025-11-01', fecha_kickoff: '2025-11-01'
      },
      {
        id_proyecto: 'PRJ-2026-007', nombre_proyecto: 'SAP S/4HANA Rise Migration',
        descripcion: 'Migración del core SAP on-premise a la edición cloud Rise with SAP con adaptación de módulos FI y MM.',
        id_pm: pmRafael.id_usuario, id_proveedor: deloitte.id_proveedor, id_sede: sedValencia.id_sede,
        id_sponsor: kuAlvaro.id_contacto, id_estado: sm['Planificar'], indicador_rag: 'VERDE',
        fecha_inicio: '2026-04-01', fecha_fin_inicial: '2027-03-31', es_capex: true, codigo_capex: 'CPX-112244', budget_inicial: 680000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Control del cronograma de cargas de trabajo.',
        com_mensual_activo: true, com_mensual_finalidad: 'Presentación de avance a la dirección financiera.',
        com_steerco_activo: true, com_steerco_finalidad: 'Comité trimestral de dirección con CGO y CFO.',
        fecha_peticion: '2026-04-01'
      },
      {
        id_proyecto: 'PRJ-2026-008', nombre_proyecto: 'Digitalización RRHH y Nóminas',
        descripcion: 'Implantación de SuccessFactors para la gestión del ciclo de vida del empleado y automatización de nóminas.',
        id_pm: pmMarta.id_usuario, id_proveedor: sopra.id_proveedor, id_sede: sedBarcelona.id_sede,
        id_sponsor: kuPatricia.id_contacto, id_estado: sm['Planificar'], indicador_rag: 'VERDE',
        fecha_inicio: '2026-03-15', fecha_fin_inicial: '2026-11-30', es_capex: false, budget_inicial: 175000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Revisión de integraciones con sistemas de RRHH legacy.',
        com_mensual_activo: true, com_mensual_finalidad: 'Informe de progreso a Dirección de Personas.',
        com_steerco_activo: false,
        fecha_peticion: '2026-03-15'
      },
      {
        id_proyecto: 'PRJ-2026-009', nombre_proyecto: 'Modernización App Comercial Móvil',
        descripcion: 'Rediseño de la aplicación móvil de ventas para iOS y Android con capacidades offline y geolocalización.',
        id_pm: pmCarlos.id_usuario, id_proveedor: nttData.id_proveedor, id_sede: sedMadrid.id_sede,
        id_sponsor: kuElena.id_contacto, id_estado: sm['Ejecución'], indicador_rag: 'VERDE',
        fecha_inicio: '2026-04-01', fecha_fin_inicial: '2026-12-15', es_capex: false, budget_inicial: 145000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Daily de progreso de sprints de desarrollo.',
        com_mensual_activo: false,
        com_steerco_activo: false,
        fecha_peticion: '2026-04-01', fecha_kickoff: '2026-04-01'
      },
      {
        id_proyecto: 'PRJ-2026-010', nombre_proyecto: 'Centro de Datos Buñol DC2',
        descripcion: 'Construcción y equipamiento del segundo CPD de la compañía con redundancia N+1 y conectividad Dark Fiber.',
        id_pm: pmRafael.id_usuario, id_proveedor: capgemini.id_proveedor, id_sede: sedBunol.id_sede,
        id_sponsor: kuAlvaro.id_contacto, id_estado: sm['Tener aprobación'], indicador_rag: 'AMARILLO',
        fecha_inicio: '2026-05-01', fecha_fin_inicial: '2027-06-30', es_capex: true, codigo_capex: 'CPX-889900', budget_inicial: 1200000.00,
        com_semanal_activo: false,
        com_mensual_activo: true, com_mensual_finalidad: 'Comité de infraestructura y seguimiento de obra.',
        com_steerco_activo: true, com_steerco_finalidad: 'Presentación mensual a Consejo de Administración.',
        fecha_peticion: '2026-05-01'
      },
      {
        id_proyecto: 'PRJ-2026-011', nombre_proyecto: 'Integración API Marketplace',
        descripcion: 'Desarrollo del hub de integraciones para conectar el ERP con plataformas de marketplace Amazon y Mercadona.',
        id_pm: pmJaime.id_usuario, id_proveedor: sopra.id_proveedor, id_sede: sedValencia.id_sede,
        id_sponsor: kuRoberto.id_contacto, id_estado: sm['Ejecución'], indicador_rag: 'VERDE',
        fecha_inicio: '2026-02-01', fecha_fin_inicial: '2026-08-31', es_capex: false, budget_inicial: 98000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Revisión de integraciones y errores de mapeo.',
        com_mensual_activo: false, com_steerco_activo: false,
        fecha_peticion: '2026-02-01', fecha_kickoff: '2026-02-01'
      },
      {
        id_proyecto: 'PRJ-2026-012', nombre_proyecto: 'Plataforma E-Commerce B2B',
        descripcion: 'Creación de portal de ventas online exclusivo para clientes corporativos con catálogo configurable por segmento.',
        id_pm: pmMarta.id_usuario, id_proveedor: accenture.id_proveedor, id_sede: sedSevilla.id_sede,
        id_sponsor: kuDiego.id_contacto, id_estado: sm['Estudio de viabilidad'], indicador_rag: 'VERDE',
        fecha_inicio: '2026-05-15', fecha_fin_inicial: '2026-12-31', es_capex: false, budget_inicial: 210000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Revisión de wireframes y maquetas de UX.',
        com_mensual_activo: true, com_mensual_finalidad: 'Checkpoint mensual con el área comercial.',
        com_steerco_activo: false,
        fecha_peticion: '2026-05-15'
      },
      {
        id_proyecto: 'PRJ-2026-013', nombre_proyecto: 'IoT Smart Factory Buñol',
        descripcion: 'Despliegue de sensores IoT en líneas de producción para monitorización en tiempo real y mantenimiento predictivo.',
        id_pm: pmCarlos.id_usuario, id_proveedor: nttData.id_proveedor, id_sede: sedBunol.id_sede,
        id_sponsor: kuPatricia.id_contacto, id_estado: sm['Kickoff'], indicador_rag: 'VERDE',
        fecha_inicio: '2026-06-01', fecha_fin_inicial: '2027-02-28', es_capex: true, codigo_capex: 'CPX-334455', budget_inicial: 380000.00,
        com_semanal_activo: false,
        com_mensual_activo: true, com_mensual_finalidad: 'Seguimiento del plan de despliegue de sensores.',
        com_steerco_activo: false,
        fecha_peticion: '2026-06-01', fecha_kickoff: '2026-06-01'
      },
      {
        id_proyecto: 'PRJ-2026-014', nombre_proyecto: 'Cumplimiento DORA & NIS2',
        descripcion: 'Programa de adecuación normativa al reglamento DORA de resiliencia digital y directiva NIS2 en toda la organización.',
        id_pm: pmRafael.id_usuario, id_proveedor: deloitte.id_proveedor, id_sede: sedMadrid.id_sede,
        id_sponsor: kuAlvaro.id_contacto, id_estado: sm['Estudio de viabilidad'], indicador_rag: 'ROJO',
        fecha_inicio: '2026-04-01', fecha_fin_inicial: '2026-12-31', es_capex: false, budget_inicial: 155000.00,
        com_semanal_activo: true, com_semanal_finalidad: 'Control de entregables de análisis de brecha.',
        com_mensual_activo: true, com_mensual_finalidad: 'Informe de cumplimiento al Comité de Riesgos.',
        com_steerco_activo: true, com_steerco_finalidad: 'Presentación trimestral al Consejo (obligación regulatoria).',
        fecha_peticion: '2026-04-01'
      },
      {
        id_proyecto: 'PRJ-2026-015', nombre_proyecto: 'BI Corporativo Reporting Ejecutivo',
        descripcion: 'Construcción del data warehouse corporativo y cuadros de mando ejecutivos sobre Power BI Premium.',
        id_pm: pmJaime.id_usuario, id_proveedor: indra.id_proveedor, id_sede: sedBarcelona.id_sede,
        id_sponsor: kuElena.id_contacto, id_estado: sm['Estabilización'], indicador_rag: 'VERDE',
        fecha_inicio: '2025-09-01', fecha_fin_inicial: '2026-06-30', es_capex: true, codigo_capex: 'CPX-778899', budget_inicial: 290000.00,
        com_semanal_activo: false,
        com_mensual_activo: true, com_mensual_finalidad: 'Validación de informes con los usuarios de dirección.',
        com_steerco_activo: true, com_steerco_finalidad: 'Presentación del portafolio de dashboards a la alta dirección.',
        fecha_peticion: '2025-09-01', fecha_kickoff: '2025-09-01', fecha_go_live: '2026-06-30'
      }
    ];

    const proyectos = [];
    for (const data of proyectosData) {
      const proj = await Proyectos.create(data);
      proyectos.push(proj);
    }
    const [p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15] = proyectos;
    console.log('Proyectos seeded (15).');

    // ==========================================
    // 8. RELACIONES MANY-TO-MANY (KUs)
    // ==========================================
    await p1.addInvolvedContacts([kuRoberto.id_contacto, kuElena.id_contacto, kuPedro.id_contacto]);
    await p1.addComSemanalContactos([kuRoberto.id_contacto, kuPedro.id_contacto]);
    await p1.addComMensualContactos([kuRoberto.id_contacto, kuElena.id_contacto]);
    await p1.addComSteerCoContactos([kuRoberto.id_contacto]);

    await p2.addInvolvedContacts([kuElena.id_contacto, kuSofia.id_contacto, kuDiego.id_contacto]);
    await p2.addComSemanalContactos([kuSofia.id_contacto]);
    await p2.addComMensualContactos([kuElena.id_contacto, kuDiego.id_contacto]);

    await p3.addInvolvedContacts([kuDiego.id_contacto, kuTomas.id_contacto, kuPatricia.id_contacto]);
    await p3.addComSemanalContactos([kuTomas.id_contacto]);
    await p3.addComMensualContactos([kuDiego.id_contacto, kuTomas.id_contacto]);
    await p3.addComSteerCoContactos([kuDiego.id_contacto]);

    await p4.addInvolvedContacts([kuRoberto.id_contacto, kuIvan.id_contacto]);
    await p4.addComSemanalContactos([kuIvan.id_contacto]);
    await p4.addComMensualContactos([kuRoberto.id_contacto]);

    await p5.addInvolvedContacts([kuElena.id_contacto, kuNuria.id_contacto, kuAlvaro.id_contacto]);
    await p5.addComMensualContactos([kuElena.id_contacto]);

    await p7.addInvolvedContacts([kuAlvaro.id_contacto, kuMarcos.id_contacto, kuRoberto.id_contacto]);
    await p7.addComSemanalContactos([kuMarcos.id_contacto]);
    await p7.addComMensualContactos([kuAlvaro.id_contacto, kuMarcos.id_contacto]);
    await p7.addComSteerCoContactos([kuAlvaro.id_contacto]);

    await p8.addInvolvedContacts([kuPatricia.id_contacto, kuPedro.id_contacto]);
    await p8.addComSemanalContactos([kuPedro.id_contacto]);
    await p8.addComMensualContactos([kuPatricia.id_contacto]);

    await p10.addInvolvedContacts([kuAlvaro.id_contacto, kuIvan.id_contacto]);
    await p10.addComMensualContactos([kuAlvaro.id_contacto]);
    await p10.addComSteerCoContactos([kuAlvaro.id_contacto]);

    await p14.addInvolvedContacts([kuAlvaro.id_contacto, kuMarcos.id_contacto, kuRoberto.id_contacto, kuElena.id_contacto]);
    await p14.addComSemanalContactos([kuMarcos.id_contacto]);
    await p14.addComMensualContactos([kuAlvaro.id_contacto, kuMarcos.id_contacto]);
    await p14.addComSteerCoContactos([kuAlvaro.id_contacto]);

    await p15.addInvolvedContacts([kuElena.id_contacto, kuSofia.id_contacto]);
    await p15.addComMensualContactos([kuElena.id_contacto]);
    await p15.addComSteerCoContactos([kuElena.id_contacto]);

    console.log('Relaciones Many-to-Many configuradas.');

    // ==========================================
    // 9. INCIDENCIAS
    // ==========================================
    await Incidencias.bulkCreate([
      { id_incidencia: 'INC-2026-001', id_proyecto: 'PRJ-2026-003', titulo: 'Retraso entrega lectores RFID', descripcion: 'El proveedor de hardware indica rotura de stock internacional, aplazando la entrega 4 semanas.', tipo_incidencias: 'PROVEEDOR_DESAPARECIDO', criticidad: 'ALTA', estado: 'EN_PROCESO', fecha_apertura: '2026-03-01' },
      { id_incidencia: 'INC-2026-002', id_proyecto: 'PRJ-2026-004', titulo: 'Bloqueo de puertos de red críticos', descripcion: 'El firewall central bloquea accesos legítimos de la aplicación de producción principal.', tipo_incidencias: 'TECNICA', criticidad: 'BLOQUEANTE', estado: 'ABIERTA', fecha_apertura: '2026-04-10' },
      { id_incidencia: 'INC-2026-003', id_proyecto: 'PRJ-2026-001', titulo: 'Inconsistencia de datos en migración', descripcion: 'Las facturas históricas del año 2020 no cuadran sus sumas acumuladas.', tipo_incidencias: 'TECNICA', criticidad: 'MEDIA', estado: 'RESUELTA', fecha_apertura: '2026-02-10', fecha_cierre: '2026-02-18', solucion_aplicada: 'Se aplicó un script SQL corrector para recalcular totales históricos en la tabla de facturación del ERP origen.' },
      { id_incidencia: 'INC-2026-004', id_proyecto: 'PRJ-2026-007', titulo: 'Fallo en carga masiva de maestros SAP', descripcion: 'La herramienta LSMW falla al importar el catálogo de materiales por conflicto de caracteres especiales (ñ, acentos).', tipo_incidencias: 'TECNICA', criticidad: 'ALTA', estado: 'EN_PROCESO', fecha_apertura: '2026-05-10' },
      { id_incidencia: 'INC-2026-005', id_proyecto: 'PRJ-2026-002', titulo: 'Rendimiento degradado en ambiente de QA', descripcion: 'El portal responde con latencia > 8 segundos en búsquedas avanzadas. Inaceptable para UAT.', tipo_incidencias: 'TECNICA', criticidad: 'ALTA', estado: 'EN_PROCESO', fecha_apertura: '2026-05-20' },
      { id_incidencia: 'INC-2026-006', id_proyecto: 'PRJ-2026-014', titulo: 'Desacuerdo en interpretación de alcance DORA', descripcion: 'Deloitte y el equipo jurídico interno discrepan en qué sistemas internos son considerados "críticos" bajo el reglamento.', tipo_incidencias: 'PRESUPUESTARIA', criticidad: 'ALTA', estado: 'ABIERTA', fecha_apertura: '2026-04-20' },
      { id_incidencia: 'INC-2026-007', id_proyecto: 'PRJ-2026-010', titulo: 'Retraso licencia municipal de obra', descripcion: 'El Ayuntamiento de Buñol ha paralizado la tramitación de la licencia de obra mayor por documentación incompleta.', tipo_incidencias: 'RETRASO_PLAZOS', criticidad: 'BLOQUEANTE', estado: 'ABIERTA', fecha_apertura: '2026-05-15' },
      { id_incidencia: 'INC-2026-008', id_proyecto: 'PRJ-2026-011', titulo: 'API Amazon rechaza tokens de autenticación', descripcion: 'Los tokens OAuth2 generados por el hub de integración son rechazados por Amazon SP-API en ambiente de producción.', tipo_incidencias: 'TECNICA', criticidad: 'BLOQUEANTE', estado: 'RESUELTA', fecha_apertura: '2026-04-05', fecha_cierre: '2026-04-08', solucion_aplicada: 'Actualización de la librería de firma de peticiones a la versión 4.2.1 que soporta el algoritmo SigV4 requerido por Amazon.' },
      { id_incidencia: 'INC-2026-009', id_proyecto: 'PRJ-2026-015', titulo: 'Corrupción de datos en ETL nocturna', descripcion: 'El proceso ETL de carga del data warehouse introdujo duplicados en la tabla de ventas de los últimos 90 días.', tipo_incidencias: 'TECNICA', criticidad: 'ALTA', estado: 'RESUELTA', fecha_apertura: '2026-03-22', fecha_cierre: '2026-03-25', solucion_aplicada: 'Se identificó un JOIN sin clave única en el proceso de staging. Se añadió un DISTINCT y se re-ejecutó la carga completa del periodo afectado.' },
      { id_incidencia: 'INC-2026-010', id_proyecto: 'PRJ-2026-008', titulo: 'Integración SSO falla con Active Directory', descripcion: 'La autenticación federated con Azure AD falla para usuarios de Barcelona por política de conditional access incompatible.', tipo_incidencias: 'TECNICA', criticidad: 'MEDIA', estado: 'EN_PROCESO', fecha_apertura: '2026-05-28' }
    ]);
    console.log('Incidencias seeded (10).');

    // ==========================================
    // 10. RIESGOS
    // ==========================================
    await Riesgos.bulkCreate([
      { id_riesgo: 'RSG-2026-001', id_proyecto: 'PRJ-2026-001', titulo_riesgo: 'Resistencia al cambio de usuarios finales', descripcion: 'Los usuarios de administración pueden rechazar el nuevo flujo de facturas.', probabilidad: 'ALTA', impacto: 'MEDIA', plan_mitigacion: 'Talleres semanales de capacitación práctica de 2 horas desde 2 meses antes del despliegue.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-07-15' },
      { id_riesgo: 'RSG-2026-002', id_proyecto: 'PRJ-2026-003', titulo_riesgo: 'Desviación presupuestaria por fluctuación EUR/USD', descripcion: 'Los sensores importados cotizan en USD y la tasa puede incrementarse.', probabilidad: 'MEDIA', impacto: 'ALTA', plan_mitigacion: 'Cobertura de divisas en contrato o adquisición prioritaria de todo el lote.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-07-01' },
      { id_riesgo: 'RSG-2026-003', id_proyecto: 'PRJ-2026-001', titulo_riesgo: 'Fuga de perfiles clave del partner técnico', descripcion: 'Rotación del arquitecto de software asignado por Sopra Steria.', probabilidad: 'BAJA', impacto: 'ALTA', plan_mitigacion: 'SLA con penalización si el relevo tarda más de 10 días laborables.', estado_riesgo: 'MITIGADO', fecha_proxima_revision: '2026-08-10' },
      { id_riesgo: 'RSG-2026-004', id_proyecto: 'PRJ-2026-007', titulo_riesgo: 'Subestimación de la complejidad de customizaciones SAP', descripcion: 'El inventario inicial de ABAP Z puede ocultar desarrollos no documentados que deben migrarse.', probabilidad: 'ALTA', impacto: 'ALTA', plan_mitigacion: 'Ejecutar un análisis de código con herramienta especializada (SNP Transformation) antes de fijar el roadmap.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-06-30' },
      { id_riesgo: 'RSG-2026-005', id_proyecto: 'PRJ-2026-010', titulo_riesgo: 'Sobrecosto en equipamiento de infraestructura', descripcion: 'Los precios de hardware de red y servidores han subido un 15% respecto a la oferta inicial.', probabilidad: 'ALTA', impacto: 'ALTA', plan_mitigacion: 'Solicitar actualización de cotización y revisar el alcance del contrato con Capgemini.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-07-01' },
      { id_riesgo: 'RSG-2026-006', id_proyecto: 'PRJ-2026-014', titulo_riesgo: 'Fecha límite regulatoria DORA inamovible', descripcion: 'La fecha de cumplimiento del reglamento es enero 2025 para entidades críticas.', probabilidad: 'MEDIA', impacto: 'ALTA', plan_mitigacion: 'Priorizar los controles técnicos obligatorios (Artículo 9-13) antes que los organizativos.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-07-15' },
      { id_riesgo: 'RSG-2026-007', id_proyecto: 'PRJ-2026-002', titulo_riesgo: 'Integración con CRM legado problemática', descripcion: 'El CRM antiguo (Dynamics 2013) no soporta REST API modernas y requiere conector SOAP complejo.', probabilidad: 'ALTA', impacto: 'MEDIA', plan_mitigacion: 'Desarrollar un middleware adaptador o forzar la migración del CRM a una versión mínima online.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-06-30' },
      { id_riesgo: 'RSG-2026-008', id_proyecto: 'PRJ-2026-009', titulo_riesgo: 'App Store Review rechaza la aplicación', descripcion: 'Apple tiene políticas estrictas sobre privacidad que pueden bloquear la publicación de la app.', probabilidad: 'BAJA', impacto: 'ALTA', plan_mitigacion: 'Auditoría previa de privacidad con experto certificado Apple Developer antes de la publicación.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-09-01' },
      { id_riesgo: 'RSG-2026-009', id_proyecto: 'PRJ-2026-013', titulo_riesgo: 'Interferencia electromagnética en sensores IoT', descripcion: 'La maquinaria de producción genera interferencias que pueden degradar la señal de los sensores LoRaWAN.', probabilidad: 'MEDIA', impacto: 'MEDIA', plan_mitigacion: 'Prueba piloto en 2 líneas de producción antes del despliegue masivo.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-08-01' },
      { id_riesgo: 'RSG-2026-010', id_proyecto: 'PRJ-2026-015', titulo_riesgo: 'Calidad de datos origen insuficiente', descripcion: 'Los sistemas origen tienen datos duplicados y con nulos que afectan la calidad del reporting.', probabilidad: 'ALTA', impacto: 'ALTA', plan_mitigacion: 'Implementar capa de Data Quality con Great Expectations antes de cargar al DWH.', estado_riesgo: 'MITIGADO', fecha_proxima_revision: '2026-07-30' }
    ]);
    console.log('Riesgos seeded (10).');

    // ==========================================
    // 11. LECCIONES APRENDIDAS
    // ==========================================
    await LeccionesAprendidas.bulkCreate([
      { id_leccion: 'LEA-2026-001', tipo_leccion: 'BUENA_PRACTICA', id_proyecto: 'PRJ-2026-005', id_proveedor: nttData.id_proveedor, titulo: 'Uso de entorno sandbox previo a migración', contexto: 'Crear réplicas aisladas de datos para pruebas disminuyó los errores productivos un 90%.', recomendacion_futura: 'Exigir al proveedor la habilitación de sandbox antes de cualquier desarrollo final.' },
      { id_leccion: 'LEA-2026-002', tipo_leccion: 'ERROR_A_EVITAR', id_proyecto: null, id_proveedor: indra.id_proveedor, titulo: 'Evitar presupuestos sin desglose de hardware', contexto: 'En una licitación no se especificaron marcas y hubo incompatibilidades de red.', recomendacion_futura: 'En RFP de redes incluir anexo técnico de compatibilidad homologada.' },
      { id_leccion: 'LEA-2026-003', tipo_leccion: 'BUENA_PRACTICA', id_proyecto: 'PRJ-2026-011', id_proveedor: sopra.id_proveedor, titulo: 'Contratos de integración con sandbox de API', contexto: 'Disponer de un entorno de pruebas real del marketplace aceleró la validación 3 semanas.', recomendacion_futura: 'Contractualmente exigir acceso a sandbox del partner en el primer hito del proyecto.' },
      { id_leccion: 'LEA-2026-004', tipo_leccion: 'ERROR_A_EVITAR', id_proyecto: 'PRJ-2026-006', id_proveedor: null, titulo: 'No pausar proyectos sin acuerdo de retomada escrito', contexto: 'La pausa de la telefonía IP se prolongó 6 meses sin fecha formal de reanudación.', recomendacion_futura: 'Cualquier pausa debe ir acompañada de un acta con fecha de revisión y condiciones de reanudación.' }
    ]);
    console.log('LeccionesAprendidas seeded.');

    // ==========================================
    // 12. FACTURAS
    // ==========================================
    await Facturas.bulkCreate([
      // PRJ-2026-001 ERP Valencia
      { id_interno_factura: 'FAC-2026-001', id_proyecto: 'PRJ-2026-001', id_proveedor: sopra.id_proveedor, numero_factura: 'FR-2026-8891', concepto: 'Hito 1: Análisis de procesos y diseño conceptual', fecha_factura: '2026-02-15', importe: 45000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-002', id_proyecto: 'PRJ-2026-001', id_proveedor: sopra.id_proveedor, numero_factura: 'FR-2026-9044', concepto: 'Hito 2: Configuración core financiero y compras', fecha_factura: '2026-04-30', importe: 60000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-003', id_proyecto: 'PRJ-2026-001', id_proveedor: sopra.id_proveedor, numero_factura: 'FR-2026-9501', concepto: 'Hito 3: Desarrollo módulo de inventarios', fecha_factura: '2026-06-30', importe: 55000.00, estado: 'PENDIENTE_DE_RECIBIR' },
      // PRJ-2026-002 Portal Clientes
      { id_interno_factura: 'FAC-2026-004', id_proyecto: 'PRJ-2026-002', id_proveedor: indra.id_proveedor, numero_factura: 'MNS-2026-1101', concepto: 'Fase 1: Diseño UX/UI y arquitectura del portal', fecha_factura: '2026-03-01', importe: 28000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-005', id_proyecto: 'PRJ-2026-002', id_proveedor: indra.id_proveedor, numero_factura: 'MNS-2026-1250', concepto: 'Fase 2: Desarrollo backend y APIs de integración', fecha_factura: '2026-05-01', importe: 42000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-006', id_proyecto: 'PRJ-2026-002', id_proveedor: indra.id_proveedor, numero_factura: 'MNS-2026-1390', concepto: 'Fase 3: Pruebas QA y corrección de defectos', fecha_factura: '2026-06-15', importe: 35000.00, estado: 'PENDIENTE_DE_RECIBIR' },
      // PRJ-2026-003 Almacén RFID
      { id_interno_factura: 'FAC-2026-007', id_proyecto: 'PRJ-2026-003', id_proveedor: accenture.id_proveedor, numero_factura: 'FAC-ACN-3011', concepto: 'Adquisición y licenciamiento software logístico', fecha_factura: '2026-03-10', importe: 110000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-008', id_proyecto: 'PRJ-2026-003', id_proveedor: accenture.id_proveedor, numero_factura: 'FAC-ACN-3080', concepto: 'Hardware RFID: 200 lectores y antenas', fecha_factura: '2026-04-20', importe: 85000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-009', id_proyecto: 'PRJ-2026-003', id_proveedor: accenture.id_proveedor, numero_factura: 'FAC-ACN-3155', concepto: 'Implantación y configuración en planta (Fase 1)', fecha_factura: '2026-06-10', importe: 70000.00, estado: 'PENDIENTE_DE_RECIBIR' },
      // PRJ-2026-004 Ciberseguridad
      { id_interno_factura: 'FAC-2026-010', id_proyecto: 'PRJ-2026-004', id_proveedor: capgemini.id_proveedor, numero_factura: 'FAC-CAP-998', concepto: 'Auditoría inicial de intrusión física y lógica', fecha_factura: '2026-03-25', importe: 35000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-011', id_proyecto: 'PRJ-2026-004', id_proveedor: capgemini.id_proveedor, numero_factura: 'FAC-CAP-1040', concepto: 'Implementación de soluciones SIEM y XDR', fecha_factura: '2026-05-20', importe: 48000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-012', id_proyecto: 'PRJ-2026-004', id_proveedor: capgemini.id_proveedor, numero_factura: 'FAC-CAP-1122', concepto: 'Licencias anuales Crowdstrike Falcon', fecha_factura: '2026-06-01', importe: 22000.00, estado: 'PENDIENTE_DE_RECIBIR' },
      // PRJ-2026-005 Big Data (cerrado)
      { id_interno_factura: 'FAC-2026-013', id_proyecto: 'PRJ-2026-005', id_proveedor: nttData.id_proveedor, numero_factura: 'NTT-2025-0890', concepto: 'Fase 1: Diseño de arquitectura Databricks', fecha_factura: '2025-08-01', importe: 95000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-014', id_proyecto: 'PRJ-2026-005', id_proveedor: nttData.id_proveedor, numero_factura: 'NTT-2026-0120', concepto: 'Fase 2: Desarrollo ETL y cuadros de mando', fecha_factura: '2026-01-15', importe: 130000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-015', id_proyecto: 'PRJ-2026-005', id_proveedor: nttData.id_proveedor, numero_factura: 'NTT-2026-0380', concepto: 'Fase 3: Despliegue y formación usuarios clave', fecha_factura: '2026-04-10', importe: 80000.00, estado: 'RECIBIDA' },
      // PRJ-2026-007 SAP S/4HANA
      { id_interno_factura: 'FAC-2026-016', id_proyecto: 'PRJ-2026-007', id_proveedor: deloitte.id_proveedor, numero_factura: 'DLT-2026-0441', concepto: 'Hito 1: Blueprint y mapeo de procesos To-Be', fecha_factura: '2026-05-01', importe: 120000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-017', id_proyecto: 'PRJ-2026-007', id_proveedor: deloitte.id_proveedor, numero_factura: 'DLT-2026-0520', concepto: 'Licencias SAP Rise - primer año', fecha_factura: '2026-05-15', importe: 180000.00, estado: 'PENDIENTE_DE_RECIBIR' },
      // PRJ-2026-008 RRHH
      { id_interno_factura: 'FAC-2026-018', id_proyecto: 'PRJ-2026-008', id_proveedor: sopra.id_proveedor, numero_factura: 'FR-2026-9200', concepto: 'Consultoría de implementación SuccessFactors HCM', fecha_factura: '2026-04-15', importe: 55000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-019', id_proyecto: 'PRJ-2026-008', id_proveedor: sopra.id_proveedor, numero_factura: 'FR-2026-9355', concepto: 'Licencias SuccessFactors (200 usuarios, 1 año)', fecha_factura: '2026-05-01', importe: 38000.00, estado: 'RECIBIDA' },
      // PRJ-2026-009 App Móvil
      { id_interno_factura: 'FAC-2026-020', id_proyecto: 'PRJ-2026-009', id_proveedor: nttData.id_proveedor, numero_factura: 'NTT-2026-0450', concepto: 'Sprint 1-4: Core de la app y diseño de UX', fecha_factura: '2026-05-15', importe: 42000.00, estado: 'RECIBIDA' },
      // PRJ-2026-010 CPD
      { id_interno_factura: 'FAC-2026-021', id_proyecto: 'PRJ-2026-010', id_proveedor: capgemini.id_proveedor, numero_factura: 'FAC-CAP-1200', concepto: 'Diseño y proyecto ejecutivo del CPD', fecha_factura: '2026-06-01', importe: 85000.00, estado: 'RECIBIDA' },
      // PRJ-2026-011 API Marketplace
      { id_interno_factura: 'FAC-2026-022', id_proyecto: 'PRJ-2026-011', id_proveedor: sopra.id_proveedor, numero_factura: 'FR-2026-8990', concepto: 'Desarrollo del API Gateway y conectores base', fecha_factura: '2026-03-15', importe: 32000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-023', id_proyecto: 'PRJ-2026-011', id_proveedor: sopra.id_proveedor, numero_factura: 'FR-2026-9100', concepto: 'Integración Amazon SP-API y pruebas E2E', fecha_factura: '2026-05-20', importe: 28000.00, estado: 'RECIBIDA' },
      // PRJ-2026-014 DORA/NIS2
      { id_interno_factura: 'FAC-2026-024', id_proyecto: 'PRJ-2026-014', id_proveedor: deloitte.id_proveedor, numero_factura: 'DLT-2026-0380', concepto: 'Análisis de brecha y hoja de ruta DORA/NIS2', fecha_factura: '2026-05-01', importe: 45000.00, estado: 'RECIBIDA' },
      // PRJ-2026-015 BI Corporativo
      { id_interno_factura: 'FAC-2026-025', id_proyecto: 'PRJ-2026-015', id_proveedor: indra.id_proveedor, numero_factura: 'MNS-2025-0900', concepto: 'Diseño del Data Warehouse y modelo dimensional', fecha_factura: '2025-10-01', importe: 65000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-026', id_proyecto: 'PRJ-2026-015', id_proveedor: indra.id_proveedor, numero_factura: 'MNS-2026-0110', concepto: 'Desarrollo ETLs y dashboards ejecutivos Power BI', fecha_factura: '2026-02-01', importe: 90000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-027', id_proyecto: 'PRJ-2026-015', id_proveedor: indra.id_proveedor, numero_factura: 'MNS-2026-0330', concepto: 'Licencias Power BI Premium P1 (12 meses)', fecha_factura: '2026-04-01', importe: 48000.00, estado: 'RECIBIDA' }
    ]);
    console.log('Facturas seeded (27).');

    // ==========================================
    // 13. CAMBIOS DE ALCANCE (CRs)
    // ==========================================
    await CambiosAlcance.bulkCreate([
      // PRJ-2026-001
      { id_cambio: 'CR-2026-001', id_proyecto: 'PRJ-2026-001', fecha_solicitud: '2026-03-15', fecha_resolucion: '2026-03-22', id_solicitante_contacto: kuRoberto.id_contacto, id_aprobador_contacto: kuElena.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Inclusión de flujos contables para filial europea no contemplada inicialmente.', impacta_importe: true, importe_impacto: 30000.00, impacta_tiempo: true, dias_impacto: 45 },
      { id_cambio: 'CR-2026-002', id_proyecto: 'PRJ-2026-001', fecha_solicitud: '2026-05-10', id_solicitante_contacto: kuPedro.id_contacto, id_aprobador_contacto: kuRoberto.id_contacto, estado_cambio: 'SOLICITADO', descripcion_motivo: 'Integración API con courier logístico local no prevista en el alcance original.', impacta_importe: true, importe_impacto: 12500.00, impacta_tiempo: true, dias_impacto: 15 },
      // PRJ-2026-002
      { id_cambio: 'CR-2026-003', id_proyecto: 'PRJ-2026-002', fecha_solicitud: '2026-04-01', fecha_resolucion: '2026-04-08', id_solicitante_contacto: kuElena.id_contacto, id_aprobador_contacto: kuDiego.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Añadir módulo de gestión de reclamaciones de clientes al portal.', impacta_importe: true, importe_impacto: 18000.00, impacta_tiempo: true, dias_impacto: 20 },
      { id_cambio: 'CR-2026-004', id_proyecto: 'PRJ-2026-002', fecha_solicitud: '2026-05-20', id_solicitante_contacto: kuSofia.id_contacto, id_aprobador_contacto: kuElena.id_contacto, estado_cambio: 'EN_REVISION', descripcion_motivo: 'Integración con la nueva app móvil (PRJ-2026-009) para compartir sesión de usuario.', impacta_importe: true, importe_impacto: 9500.00, impacta_tiempo: true, dias_impacto: 10 },
      // PRJ-2026-003
      { id_cambio: 'CR-2026-005', id_proyecto: 'PRJ-2026-003', fecha_solicitud: '2026-04-01', fecha_resolucion: '2026-04-08', id_solicitante_contacto: kuDiego.id_contacto, id_aprobador_contacto: kuRoberto.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Soporte IP-67 para lectores logísticos expuestos a humedad y temperatura extrema.', impacta_importe: true, importe_impacto: 15000.00, impacta_tiempo: false, dias_impacto: 0 },
      { id_cambio: 'CR-2026-006', id_proyecto: 'PRJ-2026-003', fecha_solicitud: '2026-05-15', fecha_resolucion: '2026-05-22', id_solicitante_contacto: kuTomas.id_contacto, id_aprobador_contacto: kuDiego.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Ampliación del número de zonas monitorizadas de 4 a 6 por petición de operaciones.', impacta_importe: true, importe_impacto: 22000.00, impacta_tiempo: true, dias_impacto: 30 },
      // PRJ-2026-004
      { id_cambio: 'CR-2026-007', id_proyecto: 'PRJ-2026-004', fecha_solicitud: '2026-03-20', fecha_resolucion: '2026-03-25', id_solicitante_contacto: kuIvan.id_contacto, id_aprobador_contacto: kuRoberto.id_contacto, estado_cambio: 'RECHAZADO', descripcion_motivo: 'Ampliación de auditoría a dispositivos móviles corporativos. Rechazado por priorizar servidores.', impacta_importe: true, importe_impacto: 25000.00, impacta_tiempo: true, dias_impacto: 20 },
      // PRJ-2026-007
      { id_cambio: 'CR-2026-008', id_proyecto: 'PRJ-2026-007', fecha_solicitud: '2026-05-15', fecha_resolucion: '2026-05-25', id_solicitante_contacto: kuMarcos.id_contacto, id_aprobador_contacto: kuAlvaro.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Añadir integración del módulo de Gestión de Calidad (QM) no contemplada en blueprint inicial.', impacta_importe: true, importe_impacto: 45000.00, impacta_tiempo: true, dias_impacto: 30 },
      { id_cambio: 'CR-2026-009', id_proyecto: 'PRJ-2026-007', fecha_solicitud: '2026-06-01', id_solicitante_contacto: kuAlvaro.id_contacto, id_aprobador_contacto: kuRoberto.id_contacto, estado_cambio: 'EN_REVISION', descripcion_motivo: 'Extensión del alcance a plantas internacionales (Portugal y Rumanía).', impacta_importe: true, importe_impacto: 95000.00, impacta_tiempo: true, dias_impacto: 90 },
      // PRJ-2026-008
      { id_cambio: 'CR-2026-010', id_proyecto: 'PRJ-2026-008', fecha_solicitud: '2026-05-10', fecha_resolucion: '2026-05-18', id_solicitante_contacto: kuPatricia.id_contacto, id_aprobador_contacto: kuRoberto.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Añadir módulo de onboarding digital para nuevas incorporaciones.', impacta_importe: true, importe_impacto: 22000.00, impacta_tiempo: true, dias_impacto: 25 },
      // PRJ-2026-010
      { id_cambio: 'CR-2026-011', id_proyecto: 'PRJ-2026-010', fecha_solicitud: '2026-05-20', id_solicitante_contacto: kuIvan.id_contacto, id_aprobador_contacto: kuAlvaro.id_contacto, estado_cambio: 'SOLICITADO', descripcion_motivo: 'Incrementar la capacidad de refrigeración a 500kW en lugar de 350kW previsto.', impacta_importe: true, importe_impacto: 180000.00, impacta_tiempo: true, dias_impacto: 60 },
      // PRJ-2026-014
      { id_cambio: 'CR-2026-012', id_proyecto: 'PRJ-2026-014', fecha_solicitud: '2026-05-05', fecha_resolucion: '2026-05-12', id_solicitante_contacto: kuMarcos.id_contacto, id_aprobador_contacto: kuAlvaro.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Ampliar el programa a filiales de Portugal y Marruecos por requerimiento del regulador europeo.', impacta_importe: true, importe_impacto: 35000.00, impacta_tiempo: true, dias_impacto: 30 },
      // PRJ-2026-015
      { id_cambio: 'CR-2026-013', id_proyecto: 'PRJ-2026-015', fecha_solicitud: '2026-02-15', fecha_resolucion: '2026-02-20', id_solicitante_contacto: kuElena.id_contacto, id_aprobador_contacto: kuRoberto.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Añadir 5 cuadros de mando adicionales para áreas de Compras y Producción.', impacta_importe: true, importe_impacto: 18000.00, impacta_tiempo: true, dias_impacto: 20 }
    ]);
    console.log('CambiosAlcance seeded (13 CRs).');

    // ==========================================
    // 14. TAREAS E HITOS
    // ==========================================
    await Tareas.bulkCreate([
      // PRJ-2026-001 ERP Valencia
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Kickoff formal y acta de constitución', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-01-20' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Taller de relevamiento de procesos (AS-IS)', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-02-10' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Definir Plan de Migración de datos', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-03-31' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Despliegue entorno sandbox y carga de datos históricos', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-04-15' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Aprobación diseño funcional módulo Finanzas', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-05-15' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'UAT módulos de Compras y Logística', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-08-15' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Go-Live en producción', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-10-15' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Cierre formal y acta de aceptación', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-10-31' },

      // PRJ-2026-002 Portal Clientes
      { id_proyecto: 'PRJ-2026-002', titulo_tarea: 'Kickoff y definición del product backlog', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-02-10' },
      { id_proyecto: 'PRJ-2026-002', titulo_tarea: 'Entrega de mockups y validación de UX', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-03-15' },
      { id_proyecto: 'PRJ-2026-002', titulo_tarea: 'Desarrollo backend: autenticación y API REST', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-04-30' },
      { id_proyecto: 'PRJ-2026-002', titulo_tarea: 'Ciclo completo de pruebas QA (700 casos)', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-31' },
      { id_proyecto: 'PRJ-2026-002', titulo_tarea: 'UAT con usuarios piloto de clientes reales', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-08-31' },
      { id_proyecto: 'PRJ-2026-002', titulo_tarea: 'Lanzamiento en producción', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-09-30' },

      // PRJ-2026-003 Almacén RFID
      { id_proyecto: 'PRJ-2026-003', titulo_tarea: 'Diseño de layout de zonas RFID', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-03-01' },
      { id_proyecto: 'PRJ-2026-003', titulo_tarea: 'Recepción e inventario de hardware RFID', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-04-10' },
      { id_proyecto: 'PRJ-2026-003', titulo_tarea: 'Montaje de racks y puntos de lectura en almacén', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-06-30' },
      { id_proyecto: 'PRJ-2026-003', titulo_tarea: 'Integración RFID con ERP (WMS)', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-31' },
      { id_proyecto: 'PRJ-2026-003', titulo_tarea: 'Pruebas de carga con flujo real de producción', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-08-15' },

      // PRJ-2026-004 Ciberseguridad
      { id_proyecto: 'PRJ-2026-004', titulo_tarea: 'Entrega de informe de auditoría inicial', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-04-15' },
      { id_proyecto: 'PRJ-2026-004', titulo_tarea: 'Instalación SIEM (Splunk) y conectores base', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-05-15' },
      { id_proyecto: 'PRJ-2026-004', titulo_tarea: 'Mitigación de riesgos nivel CRÍTICO y ALTO', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-06-15' },
      { id_proyecto: 'PRJ-2026-004', titulo_tarea: 'Entrega del informe final de remediación', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-15' },

      // PRJ-2026-005 Big Data (cerrado)
      { id_proyecto: 'PRJ-2026-005', titulo_tarea: 'Diseño del modelo dimensional del DWH', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2025-09-30' },
      { id_proyecto: 'PRJ-2026-005', titulo_tarea: 'Carga histórica de 5 años de ventas', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-01-31' },
      { id_proyecto: 'PRJ-2026-005', titulo_tarea: 'Validación con usuarios de dirección (UAT)', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-03-31' },
      { id_proyecto: 'PRJ-2026-005', titulo_tarea: 'Pase a producción y entrega formal', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-04-30' },

      // PRJ-2026-007 SAP
      { id_proyecto: 'PRJ-2026-007', titulo_tarea: 'Kickoff y establecimiento del PMO SAP', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-04-15' },
      { id_proyecto: 'PRJ-2026-007', titulo_tarea: 'Entrega del Blueprint funcional completo', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-05-31' },
      { id_proyecto: 'PRJ-2026-007', titulo_tarea: 'Configuración del sistema baseline (Realizacion)', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-09-30' },
      { id_proyecto: 'PRJ-2026-007', titulo_tarea: 'UAT final con usuarios clave de todos los módulos', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-12-15' },
      { id_proyecto: 'PRJ-2026-007', titulo_tarea: 'Cutover y Go-Live S/4HANA', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2027-01-15' },

      // PRJ-2026-008 RRHH
      { id_proyecto: 'PRJ-2026-008', titulo_tarea: 'Mapeo de procesos HR (AS-IS vs TO-BE)', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-04-15' },
      { id_proyecto: 'PRJ-2026-008', titulo_tarea: 'Configuración módulo Employee Central', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-05-31' },
      { id_proyecto: 'PRJ-2026-008', titulo_tarea: 'Integración con nóminas (SAP legacy)', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-08-31' },
      { id_proyecto: 'PRJ-2026-008', titulo_tarea: 'Formación a responsables de RRHH', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-10-15' },
      { id_proyecto: 'PRJ-2026-008', titulo_tarea: 'Go-Live y migración de datos de empleados', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-11-30' },

      // PRJ-2026-009 App Móvil
      { id_proyecto: 'PRJ-2026-009', titulo_tarea: 'Definición del MVP y backlog de producto', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-04-15' },
      { id_proyecto: 'PRJ-2026-009', titulo_tarea: 'Entrega del diseño UI/UX aprobado', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-05-15' },
      { id_proyecto: 'PRJ-2026-009', titulo_tarea: 'Demo Sprint 3 con comerciales piloto', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-31' },
      { id_proyecto: 'PRJ-2026-009', titulo_tarea: 'Publicación en App Store y Google Play', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-11-30' },

      // PRJ-2026-010 CPD
      { id_proyecto: 'PRJ-2026-010', titulo_tarea: 'Aprobación del diseño de arquitectura del CPD', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-05-31' },
      { id_proyecto: 'PRJ-2026-010', titulo_tarea: 'Obtención de licencia municipal de obra', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-31' },
      { id_proyecto: 'PRJ-2026-010', titulo_tarea: 'Inicio de obras civiles', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-09-01' },
      { id_proyecto: 'PRJ-2026-010', titulo_tarea: 'Instalación de infraestructura eléctrica y cooling', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2027-02-28' },
      { id_proyecto: 'PRJ-2026-010', titulo_tarea: 'Prueba de certificación Uptime Tier III', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2027-05-31' },

      // PRJ-2026-011 API Marketplace
      { id_proyecto: 'PRJ-2026-011', titulo_tarea: 'Diseño del API Gateway y contrato de API', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-02-28' },
      { id_proyecto: 'PRJ-2026-011', titulo_tarea: 'Integración con Amazon SP-API completada', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-04-30' },
      { id_proyecto: 'PRJ-2026-011', titulo_tarea: 'Integración con Mercadona EDI completada', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-31' },
      { id_proyecto: 'PRJ-2026-011', titulo_tarea: 'Pruebas de volumen y stress testing', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-08-15' },

      // PRJ-2026-012 E-Commerce
      { id_proyecto: 'PRJ-2026-012', titulo_tarea: 'Research de mercado y benchmarking', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-05-31' },
      { id_proyecto: 'PRJ-2026-012', titulo_tarea: 'Aprobación del diseño conceptual y UX', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-15' },
      { id_proyecto: 'PRJ-2026-012', titulo_tarea: 'Desarrollo del catálogo y carrito de compra', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-09-30' },
      { id_proyecto: 'PRJ-2026-012', titulo_tarea: 'Beta con clientes corporativos piloto', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-11-30' },

      // PRJ-2026-013 IoT
      { id_proyecto: 'PRJ-2026-013', titulo_tarea: 'Kickoff y selección de tecnología LoRaWAN vs WiFi', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-06-15' },
      { id_proyecto: 'PRJ-2026-013', titulo_tarea: 'Prueba piloto en 2 líneas de producción', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-09-30' },
      { id_proyecto: 'PRJ-2026-013', titulo_tarea: 'Despliegue masivo (12 líneas)', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-12-31' },
      { id_proyecto: 'PRJ-2026-013', titulo_tarea: 'Integración con dashboard predictivo Power BI', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2027-02-28' },

      // PRJ-2026-014 DORA/NIS2
      { id_proyecto: 'PRJ-2026-014', titulo_tarea: 'Análisis de brecha DORA: Artículos 5-20', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-05-01' },
      { id_proyecto: 'PRJ-2026-014', titulo_tarea: 'Entrega del plan de remediación aprobado', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-01' },
      { id_proyecto: 'PRJ-2026-014', titulo_tarea: 'Implementación controles técnicos prioritarios', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-10-01' },
      { id_proyecto: 'PRJ-2026-014', titulo_tarea: 'Auditoría final de cumplimiento regulatorio', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-12-01' },

      // PRJ-2026-015 BI Corporativo
      { id_proyecto: 'PRJ-2026-015', titulo_tarea: 'Diseño del modelo de datos DWH', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2025-10-31' },
      { id_proyecto: 'PRJ-2026-015', titulo_tarea: 'Desarrollo ETL ventas y finanzas', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2025-12-31' },
      { id_proyecto: 'PRJ-2026-015', titulo_tarea: 'Entrega dashboards ejecutivos v1.0', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-02-28' },
      { id_proyecto: 'PRJ-2026-015', titulo_tarea: 'Validación con Dirección y ajustes finales', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-05-31' },
    ], { individualHooks: true });
    console.log('Tareas seeded (70+).');

    // ==========================================
    // 15. COMENTARIOS DEL MURO (con es_importante)
    // ==========================================
    await ComentariosProyecto.bulkCreate([
      // PRJ-2026-001 ERP Valencia
      { id_proyecto: 'PRJ-2026-001', id_usuario: pmJaime.id_usuario, texto_comentario: '<p><strong>Reunión de alineación completada.</strong> Las interfaces del ERP están validadas por el equipo de operaciones de Dacsa. Se confirma la viabilidad técnica del módulo financiero.</p>', fecha_registro: new Date('2026-02-15T10:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-001', id_usuario: pmMarta.id_usuario, texto_comentario: '<p><em>Nota interna:</em> Se ha identificado una pequeña demora en la entrega de las credenciales de prueba por parte de Sopra Steria. Se está revisando con el account manager.</p>', fecha_registro: new Date('2026-03-01T15:30:00Z'), editado: false, es_importante: false },
      { id_proyecto: 'PRJ-2026-001', id_usuario: pmJaime.id_usuario, texto_comentario: '<p><strong>Decisión ejecutiva:</strong> Se aprueba la extensión de alcance para incluir el módulo de nóminas en la fase 2. El presupuesto adicional ha sido validado por Dirección Financiera. <strong style="color:#dc2626;">Impacto: +30.000€ y +45 días.</strong></p>', fecha_registro: new Date('2026-04-20T11:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-001', id_usuario: pmCarlos.id_usuario, texto_comentario: '<p>Revisión de los procesos de compra con el equipo de Sopra. Se detectaron 3 gaps funcionales menores que se resolverán en la próxima iteración sin impacto en el cronograma.</p>', fecha_registro: new Date('2026-05-10T09:00:00Z'), editado: false, es_importante: false },
      { id_proyecto: 'PRJ-2026-001', id_usuario: pmJaime.id_usuario, texto_comentario: '<p><strong>⚠️ Alerta de presupuesto:</strong> El CR-2026-002 pendiente de aprobación podría elevar el gasto comprometido por encima del budget inicial. Se requiere decisión de Dirección antes del 30 de junio.</p>', fecha_registro: new Date('2026-06-01T08:30:00Z'), editado: false, es_importante: true },

      // PRJ-2026-002 Portal Clientes
      { id_proyecto: 'PRJ-2026-002', id_usuario: pmMarta.id_usuario, texto_comentario: '<p>Kickoff completado con éxito. El equipo de Indra ha presentado el plan de proyecto y la arquitectura propuesta. Todos los stakeholders están alineados con el roadmap.</p>', fecha_registro: new Date('2026-02-12T11:00:00Z'), editado: false, es_importante: false },
      { id_proyecto: 'PRJ-2026-002', id_usuario: pmMarta.id_usuario, texto_comentario: '<p><strong>HITO COMPLETADO:</strong> Los mockups de UX han sido aprobados por el Comité de Clientes en reunión del 15/03. El diseño es moderno y accesible (WCAG 2.1 nivel AA). <strong>Se autoriza el inicio del desarrollo.</strong></p>', fecha_registro: new Date('2026-03-15T16:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-002', id_usuario: pmCarlos.id_usuario, texto_comentario: '<p>Las pruebas de rendimiento muestran tiempos de respuesta de 8+ segundos en búsquedas avanzadas. Se ha abierto la incidencia INC-2026-005. Indra tiene un plan de optimización para las próximas 2 semanas.</p>', fecha_registro: new Date('2026-05-22T10:30:00Z'), editado: false, es_importante: true },

      // PRJ-2026-003 Almacén RFID
      { id_proyecto: 'PRJ-2026-003', id_usuario: pmJaime.id_usuario, texto_comentario: '<p>Se ha revisado el plan de mitigación para la adquisición de sensores. Estamos pendientes de recibir la confirmación de la cotización final en USD del proveedor asiático.</p>', fecha_registro: new Date('2026-04-05T09:15:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-003', id_usuario: pmJaime.id_usuario, texto_comentario: '<p>El CR-2026-006 para ampliar de 4 a 6 zonas ha sido aprobado por Diego Torres. Esto supone 22.000€ adicionales y 30 días de extensión. El proveedor Accenture ha confirmado disponibilidad del equipo.</p>', fecha_registro: new Date('2026-05-25T12:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-003', id_usuario: pmMarta.id_usuario, texto_comentario: '<p>Reunión en planta: los operarios han dado feedback muy positivo sobre la interfaz de los terminales de mano. Se han anotado 5 mejoras de usabilidad menores para incluir en la siguiente versión.</p>', fecha_registro: new Date('2026-05-28T15:00:00Z'), editado: false, es_importante: false },

      // PRJ-2026-004 Ciberseguridad
      { id_proyecto: 'PRJ-2026-004', id_usuario: pmCarlos.id_usuario, texto_comentario: '<p><strong>⚠️ Alerta crítica:</strong> Se han detectado 3 vulnerabilidades de severidad ALTA en los servidores del datacenter de Madrid. CVE-2026-14872 (CVSS 9.1). Se requiere acción inmediata del equipo de Capgemini antes del viernes.</p>', fecha_registro: new Date('2026-04-12T08:30:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-004', id_usuario: pmCarlos.id_usuario, texto_comentario: '<p>Reunión de crisis con Capgemini y el CISO corporativo. Se establece un war-room para resolver las vulnerabilidades críticas en 72 horas. Rodrigo Peña (Capgemini) liderará el equipo de respuesta.</p>', fecha_registro: new Date('2026-04-13T10:00:00Z'), editado: false, es_importante: false },
      { id_proyecto: 'PRJ-2026-004', id_usuario: pmCarlos.id_usuario, texto_comentario: '<p><strong>Resolución:</strong> Las 3 vulnerabilidades críticas han sido parchadas y verificadas en 48 horas. El SIEM ya está en producción y monitorizando en tiempo real. El informe de remediación estará listo para el 30/06.</p>', fecha_registro: new Date('2026-05-10T09:00:00Z'), editado: false, es_importante: true },

      // PRJ-2026-005 Big Data (cerrado)
      { id_proyecto: 'PRJ-2026-005', id_usuario: pmJaime.id_usuario, texto_comentario: '<p><strong>PROYECTO COMPLETADO EXITOSAMENTE.</strong> El sistema de reporting está en producción desde el 30/04. La Dirección ha validado todos los cuadros de mando. Tiempo de acceso a datos < 3 segundos. <strong>NPS del proyecto: 9/10.</strong></p>', fecha_registro: new Date('2026-04-30T18:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-005', id_usuario: pmJaime.id_usuario, texto_comentario: '<p>Los usuarios directivos están haciendo un uso intensivo de los dashboards. En la primera semana se registraron más de 200 sesiones. La adopción está siendo muy superior a lo esperado.</p>', fecha_registro: new Date('2026-05-07T09:00:00Z'), editado: false, es_importante: false },

      // PRJ-2026-007 SAP S/4HANA
      { id_proyecto: 'PRJ-2026-007', id_usuario: pmRafael.id_usuario, texto_comentario: '<p><strong>HITO COMPLETADO - Blueprint SAP:</strong> Deloitte ha entregado el Blueprint funcional para módulos FI, CO, MM y SD. Aprobado por el Comité de Dirección el 31/05. Se autoriza el inicio de la fase de Realización.</p>', fecha_registro: new Date('2026-05-31T17:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-007', id_usuario: pmRafael.id_usuario, texto_comentario: '<p><em>Riesgo identificado:</em> El inventario de ABAP Z es 40% mayor del estimado. Hay más de 800 programas Z que deben evaluarse. Se está analizando cuáles son prescindibles para reducir el impacto en el cronograma.</p>', fecha_registro: new Date('2026-06-05T11:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-007', id_usuario: pmMarta.id_usuario, texto_comentario: '<p>Reunión con el equipo de Deloitte para priorizar el inventario de ABAP Z. Se ha clasificado 450 programas como prescindibles y 350 que requieren migración o refactorización. Impacto en cronograma en análisis.</p>', fecha_registro: new Date('2026-06-08T10:00:00Z'), editado: false, es_importante: false },

      // PRJ-2026-008 RRHH
      { id_proyecto: 'PRJ-2026-008', id_usuario: pmMarta.id_usuario, texto_comentario: '<p>El mapeo AS-IS de procesos HR revela que hay 12 procesos manuales que SuccessFactors automatizará directamente. Esto supone un ahorro estimado de 3 FTEs de gestión administrativa.</p>', fecha_registro: new Date('2026-04-18T10:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-008', id_usuario: pmMarta.id_usuario, texto_comentario: '<p>Incidencia con el SSO de Azure AD para usuarios de Barcelona. El equipo técnico de Sopra está investigando la causa raíz. Estimación de resolución: 5 días laborables.</p>', fecha_registro: new Date('2026-05-30T09:30:00Z'), editado: false, es_importante: false },

      // PRJ-2026-009 App Móvil
      { id_proyecto: 'PRJ-2026-009', id_usuario: pmCarlos.id_usuario, texto_comentario: '<p><strong>MVP aprobado.</strong> Los 15 usuarios de ventas piloto han valorado con 8.5/10 la experiencia de uso. El modo offline funciona correctamente en zonas de baja cobertura. Se aprueba continuar con el desarrollo completo.</p>', fecha_registro: new Date('2026-05-20T16:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-009', id_usuario: pmCarlos.id_usuario, texto_comentario: '<p>La integración con el ERP para sincronización de pedidos está en un 80%. Pendiente de resolver la gestión de conflictos cuando hay edición offline y online simultánea del mismo pedido.</p>', fecha_registro: new Date('2026-06-02T11:00:00Z'), editado: false, es_importante: false },

      // PRJ-2026-010 CPD
      { id_proyecto: 'PRJ-2026-010', id_usuario: pmRafael.id_usuario, texto_comentario: '<p><strong>ALERTA BLOQUEO:</strong> El Ayuntamiento de Buñol ha paralizado la tramitación de la licencia por documentación incompleta de impacto medioambiental. El equipo jurídico ya está actuando. Riesgo de desplazamiento del cronograma 2-3 meses.</p>', fecha_registro: new Date('2026-05-18T09:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-010', id_usuario: pmRafael.id_usuario, texto_comentario: '<p>Reunión con Capgemini y el departamento de Facilities. Se va a contratar una empresa especializada en permisos de obra para acelerar la tramitación. Coste estimado del asesoramiento: 8.000€ (no impacta en presupuesto de TI).</p>', fecha_registro: new Date('2026-05-22T11:00:00Z'), editado: false, es_importante: false },

      // PRJ-2026-011 API Marketplace
      { id_proyecto: 'PRJ-2026-011', id_usuario: pmJaime.id_usuario, texto_comentario: '<p><strong>INTEGRACIÓN AMAZON COMPLETADA.</strong> Los pedidos fluyen correctamente desde el marketplace a nuestro ERP en menos de 2 minutos. Tasa de error < 0.1% en pruebas de volumen con 10.000 pedidos/hora.</p>', fecha_registro: new Date('2026-05-01T17:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-011', id_usuario: pmJaime.id_usuario, texto_comentario: '<p>En proceso de negociación del contrato de integración con Mercadona. Su EDI es diferente al estándar EDIFACT que habíamos planificado. Se necesita un análisis técnico adicional de 2 semanas.</p>', fecha_registro: new Date('2026-05-25T10:00:00Z'), editado: false, es_importante: false },

      // PRJ-2026-012 E-Commerce
      { id_proyecto: 'PRJ-2026-012', id_usuario: pmMarta.id_usuario, texto_comentario: '<p>El benchmarking de competidores (Makro B2B, Sysco, Brakes) ha identificado 3 funcionalidades diferenciadoras a incorporar: pricing dinámico por volumen, catálogo segmentado por tipo de cliente y reorden automático.</p>', fecha_registro: new Date('2026-06-02T10:00:00Z'), editado: false, es_importante: true },

      // PRJ-2026-013 IoT
      { id_proyecto: 'PRJ-2026-013', id_usuario: pmCarlos.id_usuario, texto_comentario: '<p><strong>Kickoff completado.</strong> Después de evaluar LoRaWAN, WiFi 6 y LTE privado, el comité técnico ha decidido apostar por <strong>LoRaWAN con gateway Kerlink</strong> por su mejor relación cobertura/consumo en entorno industrial.</p>', fecha_registro: new Date('2026-06-15T16:00:00Z'), editado: false, es_importante: true },

      // PRJ-2026-014 DORA/NIS2
      { id_proyecto: 'PRJ-2026-014', id_usuario: pmRafael.id_usuario, texto_comentario: '<p><strong>ALERTA REGULATORIA:</strong> El análisis de brecha identifica que somos entidad ESENCIAL bajo NIS2 (art. 3.1b), no importante. Esto implica obligaciones más estrictas y plazos de notificación de incidentes de 24h en lugar de 72h. Se requiere revisar el plan de proyecto.</p>', fecha_registro: new Date('2026-05-10T09:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-014', id_usuario: pmRafael.id_usuario, texto_comentario: '<p>Reunión con el equipo jurídico y Deloitte para clarificar la clasificación de sistemas críticos. El desacuerdo con la interpretación del reglamento (INC-2026-006) sigue abierto. Se va a solicitar consulta formal al regulador (CNMC).</p>', fecha_registro: new Date('2026-05-20T11:00:00Z'), editado: false, es_importante: false },
      { id_proyecto: 'PRJ-2026-014', id_usuario: pmRafael.id_usuario, texto_comentario: '<p>El CR-2026-012 para extender el programa a filiales de Portugal y Marruecos ha sido aprobado por Álvaro Reyes. Esto supone +35.000€ y +30 días. Deloitte incorporará 2 consultores adicionales especializados en DORA.</p>', fecha_registro: new Date('2026-05-25T14:00:00Z'), editado: false, es_importante: true },

      // PRJ-2026-015 BI Corporativo
      { id_proyecto: 'PRJ-2026-015', id_usuario: pmJaime.id_usuario, texto_comentario: '<p><strong>ENTREGA v1.0 APROBADA.</strong> Lucía Fernández (Directora) y el comité de dirección han aprobado los 15 dashboards de la primera versión. El tiempo medio de acceso es 2.1 segundos. Nivel de satisfacción: MUY ALTO.</p>', fecha_registro: new Date('2026-02-28T18:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-015', id_usuario: pmJaime.id_usuario, texto_comentario: '<p>Se ha completado la resolución del problema de duplicados en ETL (INC-2026-009). Los datos de ventas de los últimos 90 días han sido recargados y verificados. Los 5 informes afectados están ahora correctos.</p>', fecha_registro: new Date('2026-03-26T10:00:00Z'), editado: false, es_importante: false },
      { id_proyecto: 'PRJ-2026-015', id_usuario: pmJaime.id_usuario, texto_comentario: '<p>Con el CR-2026-013 aprobado (5 cuadros adicionales para Compras y Producción), el proyecto cierra con <strong>20 dashboards ejecutivos en producción</strong>. El sistema procesa 2M de registros de ventas diarios sin degradación de rendimiento.</p>', fecha_registro: new Date('2026-05-31T17:00:00Z'), editado: false, es_importante: true }
    ]);
    console.log('Comentarios seeded (40+).');

    console.log('\n🎉 Seeding successfully completed!');
    console.log('📊 Summary:');
    console.log('  - 15 Proyectos');
    console.log('  - 11 ContactosProveedor');
    console.log('  - 27 Facturas');
    console.log('  - 13 Cambios de Alcance');
    console.log('  - 70+ Tareas e Hitos');
    console.log('  - 10 Riesgos');
    console.log('  - 10 Incidencias');
    console.log('  - 40+ Comentarios (con es_importante)');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
