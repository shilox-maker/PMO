const { 
  sequelize, Sedes, Proveedores, ContactosProveedor, Usuarios,
  Proyectos, Incidencias, Riesgos, LeccionesAprendidas, Facturas,
  CambiosAlcance, Tareas, EstadosProyecto, ComentariosProyecto,
  Portfolios, TiposCapex, SubtiposCapex, PortfolioBudgets, TiposFactura
} = require('./models/index');

const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  try {
    console.log('Synchronizing database models...');
    if (sequelize.options.dialect === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = OFF;');
    } else if (sequelize.options.dialect === 'mssql') {
      const schema = sequelize.options.define?.schema || 'dbo';
      const dropFKsQuery = `
        DECLARE @sql NVARCHAR(MAX) = N'';
        SELECT @sql += N'ALTER TABLE ' + QUOTENAME(SCHEMA_NAME(t.schema_id)) + '.' + QUOTENAME(t.name) + 
                       ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + ';'
        FROM sys.foreign_keys fk
        INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
        WHERE SCHEMA_NAME(t.schema_id) = '${schema}';
        IF @sql <> N'' EXEC sp_executesql @sql;
      `;
      await sequelize.query(dropFKsQuery);
    }
    await sequelize.sync({ force: true });
    if (sequelize.options.dialect === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = ON;');
    }
    console.log('Database synced. Seeding tables...');

    // ==========================================
    // 1. SEDES (Only those requested)
    // ==========================================
    const sedesData = [
      { nombre_sede: 'Corporate' },
      { nombre_sede: 'UK' },
      { nombre_sede: 'Sevilla' },
      { nombre_sede: 'Valencia' },
      { nombre_sede: 'Portugal' },
      { nombre_sede: 'Molendum' },
      { nombre_sede: 'Polonia' },
      { nombre_sede: 'Ucrania' }
    ];
    const seededSedes = await Sedes.bulkCreate(sedesData);
    console.log('Sedes seeded.');
    
    const sedesMap = {};
    seededSedes.forEach(s => {
      sedesMap[s.nombre_sede.toUpperCase()] = s.id_sede;
    });

    // ==========================================
    // 2. PROVEEDORES
    // ==========================================
    const proveedores = await Proveedores.bulkCreate([
      { nombre_razon_social: 'Dacsa', telefono_general: '910000000', email_general: 'contacto@dacsa.com', es_grupo_dacsa: true },
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
    const contacts = await ContactosProveedor.bulkCreate([
      { id_proveedor: sopra.id_proveedor, nombre: 'Ana', apellidos: 'García', puesto: 'Account Executive', telefono: '600111222', email: 'agarcia@sopra.com' },
      { id_proveedor: dacsa.id_proveedor, nombre: 'Roberto', apellidos: 'Ramos', puesto: 'Director Financiero', telefono: '600000000', email: 'rramos@dacsa.com' },
      { id_proveedor: dacsa.id_proveedor, nombre: 'Elena', apellidos: 'Vargas', puesto: 'Stakeholder', telefono: '600000000', email: 'evargas@dacsa.com' },
      { id_proveedor: dacsa.id_proveedor, nombre: 'Diego', apellidos: 'Torres', puesto: 'Stakeholder', telefono: '600000000', email: 'dtorres@dacsa.com' }
    ]);
    const [contactoAna, contactoRoberto, contactoElena, contactoDiego] = contacts;
    console.log('ContactosProveedor seeded.');

    // ==========================================
    // 4. ESTADOS PROYECTO (13 estados estándar)
    // ==========================================
    const statesData = [
      { nombre_estado: 'Petición', icono: '📩', orden: 1, proyecto_cerrado: false, descripcion: 'Fase inicial en la que se registra la solicitud o idea de proyecto para su evaluación.' },
      { nombre_estado: 'Estudio de viabilidad', icono: '📋', orden: 2, proyecto_cerrado: false, descripcion: 'Análisis detallado de los requisitos, costes, beneficios y viabilidad técnica del proyecto.' },
      { nombre_estado: 'Buscar propuestas', icono: '🔍', orden: 3, proyecto_cerrado: false, descripcion: 'Fase de solicitud y recepción de ofertas o propuestas de proveedores y partners tecnológicos.' },
      { nombre_estado: 'Tener aprobación', icono: '⏳', orden: 4, proyecto_cerrado: false, descripcion: 'Período de espera para la revisión y aprobación formal del proyecto por parte del comité de dirección o sponsor.' },
      { nombre_estado: 'Planificar', icono: '📅', orden: 5, proyecto_cerrado: false, descripcion: 'Elaboración del cronograma detallado, asignación de recursos y definición de entregables del proyecto.' },
      { nombre_estado: 'Kickoff', icono: '🚀', orden: 6, proyecto_cerrado: false, descripcion: 'Reunión de lanzamiento oficial del proyecto con todos los stakeholders y el equipo de trabajo.' },
      { nombre_estado: 'Ejecución', icono: '🛠️', orden: 7, proyecto_cerrado: false, descripcion: 'Fase de desarrollo, construcción e implementación de las soluciones definidas en la planificación.' },
      { nombre_estado: 'Pausado', icono: '⏸️', orden: 8, proyecto_cerrado: false, descripcion: 'El proyecto se encuentra temporalmente detenido por decisión de la dirección o causas externas.' },
      { nombre_estado: 'Go Live', icono: '📦', orden: 9, proyecto_cerrado: false, descripcion: 'Puesta en producción de la solución técnica o despliegue final a los usuarios finales.' },
      { nombre_estado: 'Estabilización', icono: '🛡️', orden: 10, proyecto_cerrado: false, descripcion: 'Período de soporte y resolución de incidencias iniciales tras la salida a producción.' },
      { nombre_estado: 'Cierre', icono: '🏁', orden: 11, proyecto_cerrado: true, descripcion: 'Formalización de la entrega, evaluación de resultados y cierre administrativo del proyecto.' },
      { nombre_estado: 'Descartado', icono: '🗑️', orden: 12, proyecto_cerrado: true, descripcion: 'Proyectos que tras el estudio de viabilidad o análisis inicial no se consideran viables o necesarios.' },
      { nombre_estado: 'Cancelado', icono: '❌', orden: 13, proyecto_cerrado: true, descripcion: 'Proyectos iniciados que se interrumpen y finalizan definitivamente antes de su conclusión planificada.' }
    ];
    const seededStates = await EstadosProyecto.bulkCreate(statesData);
    const sm = {};
    seededStates.forEach(s => { sm[s.nombre_estado] = s.id_estado; });
    console.log('EstadosProyecto seeded.');

    // ==========================================
    // 5. USUARIOS (Including new PMs)
    // ==========================================
    const usersData = [
      { nombre: 'Jaime', apellidos: 'Martínez', correo: 'jmartinez@dacsa.com', password: hashPassword('123'), perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' },
      { nombre: 'Alejandro', apellidos: 'Sanchis', correo: 'a.sanchis@dacsa.com', password: hashPassword('123'), perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' },
      { nombre: 'Héctor', apellidos: 'López', correo: 'h.lopez@dacsa.com', password: hashPassword('123'), perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' },
      { nombre: 'Yago', apellidos: 'Bofill', correo: 'y.bofill@dacsa.com', password: hashPassword('123'), perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' },
      { nombre: 'Raúl', apellidos: 'Aparicio', correo: 'r.aparicio@dacsa.com', password: hashPassword('123'), perfil: 'PM', activo: true, metodo_acceso: 'PASSWORD' },
      { nombre: 'Lucía', apellidos: 'Fernández', correo: 'lfernandez@dacsa.com', password: hashPassword('123'), perfil: 'DIRECTOR', activo: true, metodo_acceso: 'PASSWORD' },
      { nombre: 'Administrador', apellidos: 'Sistema', correo: 'admin@dacsa.com', password: hashPassword('admin'), perfil: 'ADMINISTRADOR', activo: true, metodo_acceso: 'PASSWORD' }
    ];
    const seededUsers = await Usuarios.bulkCreate(usersData);
    console.log('Usuarios seeded.');

    const pmsMap = {};
    seededUsers.forEach(u => {
      pmsMap[u.nombre.toUpperCase()] = u.id_usuario;
    });

    // ==========================================
    // 6. PORTFOLIOS, TIPOS CAPEX Y SUBTIPOS
    // ==========================================
    const portfolios = await Portfolios.bulkCreate([
      { nombre: 'Portfolio 2026', descripcion: 'Proyectos del plan operativo anual de la compañía para el año 2026.' }
    ]);
    const [port2026] = portfolios;
    console.log('Portfolios seeded.');

    const tCapex = await TiposCapex.bulkCreate([
      { nombre: 'Growth', orden: 1 },
      { nombre: 'Special', orden: 2 },
      { nombre: 'Operational', orden: 3 }
    ]);
    const [tGrowth, tSpecial, tOperational] = tCapex;
    console.log('Tipos CAPEX seeded.');

    const stCapex = await SubtiposCapex.bulkCreate([
      { id_tipo_capex: tSpecial.id, nombre: 'Dynamics', orden: 1 },
      { id_tipo_capex: tSpecial.id, nombre: 'AI', orden: 2 },
      { id_tipo_capex: tSpecial.id, nombre: 'Industry 4.0', orden: 3 }
    ]);
    const [stDynamics, stAI, stIndustry4] = stCapex;
    console.log('Subtipos CAPEX seeded.');

    // Seed budgets for Portfolio 2026
    await PortfolioBudgets.bulkCreate([
      { portfolio_id: port2026.id, id_tipo_capex: tGrowth.id, id_subtipo_capex: null, importe: 200000.00 },
      { portfolio_id: port2026.id, id_tipo_capex: tSpecial.id, id_subtipo_capex: stIndustry4.id, importe: 600000.00 },
      { portfolio_id: port2026.id, id_tipo_capex: tOperational.id, id_subtipo_capex: null, importe: 250000.00 }
    ]);
    console.log('PortfolioBudgets seeded for 2026.');

    // ==========================================
    // 7. PROYECTOS (Excel Capture Data)
    // ==========================================
    const proyectosExcel = [
      // BLOCK 1: GROWTH
      { nombre: 'CRM SALESFORCE - 2ª Fase', pm: 'ALEJANDRO', tipo: 'Growth', subtipo: null, dist: 'Corporate', budget: 69000 },
      { nombre: 'Renovacion de los 2 Firewall Fortigate en DC Barcelona', pm: 'HÉCTOR', tipo: 'Growth', subtipo: null, dist: 'Corporate', budget: 25704 },
      { nombre: 'Renovar switches', pm: 'HÉCTOR', tipo: 'Growth', subtipo: null, dist: 'UK', budget: 20000 },
      { nombre: 'Renovar switches', pm: 'HÉCTOR', tipo: 'Growth', subtipo: null, dist: 'Sevilla', budget: 15000 },
      // BLOCK 2: SPECIAL - INDUSTRY 4.0
      { nombre: 'MES OLANET Next EN VALENCIA', pm: 'ALEJANDRO', tipo: 'Special', subtipo: 'Industry 4.0', dist: 'Valencia', budget: 100000 },
      { nombre: 'MES OLANET Next EN PORTUGAL', pm: 'ALEJANDRO', tipo: 'Special', subtipo: 'Industry 4.0', dist: 'Portugal', budget: 100000 },
      { nombre: 'SGA MECALUX EN VALENCIA (FASE 2)', pm: 'YAGO', tipo: 'Special', subtipo: 'Industry 4.0', dist: 'Valencia', budget: 111250 },
      { nombre: 'SGA MECALUX EN MOLENDUM - MEJORAS', pm: 'RAÚL', tipo: 'Special', subtipo: 'Industry 4.0', dist: 'Molendum', budget: 15000 },
      { nombre: 'TESI EN VALENCIA (FASE 2)', pm: 'YAGO', tipo: 'Special', subtipo: 'Industry 4.0', dist: 'Valencia', budget: 155000 },
      // BLOCK 3: OPERATIONAL
      { nombre: 'Plan Renove Portatiles', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'Corporate', budget: 15000 },
      { nombre: 'Plan Renove Portatiles', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'Valencia', budget: 40000 },
      { nombre: 'Plan Renove Portatiles', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'Sevilla', budget: 3000 },
      { nombre: 'Plan Renove Portatiles', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'Molendum', budget: 9000 },
      { nombre: 'Plan Renove Portatiles', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'UK', budget: 12000 },
      { nombre: 'Plan Renove Portatiles', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'Polonia', budget: 10000 },
      { nombre: 'Plan Renove Portatiles', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'Ucrania', budget: 5000 },
      { nombre: 'Plan Renove Portatiles', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'Portugal', budget: 17500 },
      { nombre: 'MDM para flota moviles Android (incluye Plan Renove de 5 equipos) - POC', pm: 'HÉCTOR', tipo: 'Operational', subtipo: null, dist: 'Valencia', budget: 6000 },
      { nombre: 'NEXUS API Manager -> DCTM (integraciones "punto a punto" como hasta ahora)', pm: 'JAIME', tipo: 'Operational', subtipo: null, dist: 'Corporate', budget: 35000 },
      { nombre: 'DATA: Metodología: Gestión documental', pm: 'JAIME', tipo: 'Operational', subtipo: null, dist: 'Corporate', budget: 20000 }
    ];

    const proyectos = [];
    for (let i = 0; i < proyectosExcel.length; i++) {
      const p = proyectosExcel[i];
      const codeIndex = String(i + 1).padStart(3, '0');
      const id_proyecto = `PRJ-2026-${codeIndex}`;

      let id_tipo_capex = null;
      let id_subtipo_capex = null;
      
      if (p.tipo === 'Growth') id_tipo_capex = tGrowth.id;
      if (p.tipo === 'Special') {
        id_tipo_capex = tSpecial.id;
        id_subtipo_capex = stIndustry4.id;
      }
      if (p.tipo === 'Operational') id_tipo_capex = tOperational.id;

      const pmId = pmsMap[p.pm.toUpperCase()];
      const sedeId = sedesMap['CORPORATE'];
      const sedeDistId = sedesMap[p.dist.toUpperCase()];

      const proj = await Proyectos.create({
        id_proyecto,
        nombre_proyecto: p.nombre,
        descripcion: `Proyecto: ${p.nombre} con cobertura y distribución en ${p.dist}.`,
        id_pm: pmId,
        id_proveedor: sopra.id_proveedor,
        id_sede: sedeId,
        id_sede_distribuir: sedeDistId,
        id_sponsor: contactoRoberto.id_contacto,
        id_estado: sm['Ejecución'],
        indicador_rag: 'VERDE',
        fecha_inicio: '2026-01-01',
        fecha_fin_inicial: '2026-12-31',
        es_capex: p.tipo !== 'Operational',
        id_tipo_capex,
        id_subtipo_capex,
        budget_inicial: p.budget,
        portfolio_id: port2026.id,
        com_semanal_activo: i < 5, // Activar gobernanza en algunos
        com_semanal_finalidad: 'Alineación de sprints semanales.',
        com_mensual_activo: i < 3,
        com_mensual_finalidad: 'Comité de seguimiento de hitos y consumo.',
        com_steerco_activo: i === 0,
        com_steerco_finalidad: 'Presentación trimestral a la Dirección General.'
      });
      proyectos.push(proj);
    }
    console.log(`Seeded ${proyectos.length} projects.`);

    // ==========================================
    // 8. TAREAS E HITOS (Contextualized)
    // ==========================================
    const tasksData = [];
    proyectos.forEach((p, index) => {
      const name = p.nombre_proyecto;
      // Common tasks for all projects
      tasksData.push(
        { id_proyecto: p.id_proyecto, titulo_tarea: `Reunión de kickoff: ${name}`, es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-01-15' },
        { id_proyecto: p.id_proyecto, titulo_tarea: `Definición de requerimientos y diseño conceptual`, es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-02-28' }
      );

      // Context specific tasks
      if (name.includes('SALESFORCE')) {
        tasksData.push(
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Migración y limpieza de base de datos de leads legados', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-07-31' },
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Certificación e Integración final con pasarela de marketing', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-09-15' },
          { id_proyecto: p.id_proyecto, titulo_tarea: 'UAT formal con equipo de ventas nacional', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-11-01' }
        );
      } else if (name.includes('Firewall') || name.includes('switches')) {
        tasksData.push(
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Recepción física del equipamiento de red en almacén', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-03-10' },
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Configuración y pruebas en maqueta de red (Staging)', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-04-20' },
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Ventana de migración nocturna e instalación física en CPD', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-08-15' }
        );
      } else if (name.includes('OLANET')) {
        tasksData.push(
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Mapeo y cableado de variables PLC a terminales de planta', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-08-30' },
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Validación de OEE en inyectoras piloto', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-10-15' }
        );
      } else if (name.includes('MECALUX') || name.includes('TESI')) {
        tasksData.push(
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Diseño e integración de flujos WMS con ERP corporativo', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-08-10' },
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Pase a producción del layout de almacén virtual', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-11-30' }
        );
      } else if (name.includes('Portatiles') || name.includes('MDM')) {
        tasksData.push(
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Aprobación del lote y pedido de compra homologado (Lenovo/HP)', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-02-28' },
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Maquetación de la imagen del sistema operativo corporativo', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-04-15' },
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Logística de envío y reparto físico a los usuarios finales', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-09-30' }
        );
      } else {
        tasksData.push(
          { id_proyecto: p.id_proyecto, titulo_tarea: 'Entrega de documentación final y pase a soporte', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-12-15' }
        );
      }
    });
    await Tareas.bulkCreate(tasksData);
    console.log('Tareas seeded.');

    // ==========================================
    // 8.5. TIPOS DE FACTURA
    // ==========================================
    const tiposFacturaData = [
      { nombre: 'Consultoría Externa' },
      { nombre: 'Licencias de Software' },
      { nombre: 'Desarrollos e Integraciones' },
      { nombre: 'Infraestructura Tecnológica' },
      { nombre: 'Migración y Calidad de Datos' },
      { nombre: 'Viajes y Desplazamientos' },
      { nombre: 'Alojamiento' },
      { nombre: 'Dietas y Comidas' },
      { nombre: 'Formación' },
      { nombre: 'Hardware y Equipamiento' },
      { nombre: 'Recursos Internos' },
      { nombre: 'Otros Gastos' }
    ];
    const seededTiposFactura = await TiposFactura.bulkCreate(tiposFacturaData);
    console.log('Tipos de Factura seeded.');
    
    const tiposFacturaMap = {};
    seededTiposFactura.forEach(tf => {
      tiposFacturaMap[tf.nombre] = tf.id_tipo_factura;
    });

    // ==========================================
    // 9. FACTURAS (Contextualized to matching projects)
    // ==========================================
    const facturasData = [
      // Salesforce
      { id_interno_factura: 'FAC-2026-001', id_proyecto: 'PRJ-2026-001', id_proveedor: sopra.id_proveedor, id_tipo_factura: tiposFacturaMap['Consultoría Externa'], numero_factura: 'FR-SF-01', concepto: 'Hito 1: Análisis y mockups iniciales CRM', fecha_factura: '2026-02-15', importe: 20000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-002', id_proyecto: 'PRJ-2026-001', id_proveedor: sopra.id_proveedor, id_tipo_factura: tiposFacturaMap['Desarrollos e Integraciones'], numero_factura: 'FR-SF-02', concepto: 'Hito 2: Configuración Salesforce Core y Pipelines', fecha_factura: '2026-05-10', importe: 15000.00, estado: 'RECIBIDA' },
      // Firewall DC Barcelona
      { id_interno_factura: 'FAC-2026-003', id_proyecto: 'PRJ-2026-002', id_proveedor: indra.id_proveedor, id_tipo_factura: tiposFacturaMap['Infraestructura Tecnológica'], numero_factura: 'FR-FW-01', concepto: 'Adquisición de equipamiento Fortigate redundante', fecha_factura: '2026-03-20', importe: 10000.00, estado: 'RECIBIDA' },
      // MES Olanet Valencia
      { id_interno_factura: 'FAC-2026-004', id_proyecto: 'PRJ-2026-005', id_proveedor: accenture.id_proveedor, id_tipo_factura: tiposFacturaMap['Licencias de Software'], numero_factura: 'FR-OL-01', concepto: 'Licenciamiento del núcleo Olanet MES v12', fecha_factura: '2026-04-10', importe: 50000.00, estado: 'RECIBIDA' },
      { id_interno_factura: 'FAC-2026-005', id_proyecto: 'PRJ-2026-005', id_proveedor: accenture.id_proveedor, id_tipo_factura: tiposFacturaMap['Consultoría Externa'], numero_factura: 'FR-OL-02', concepto: 'Servicios profesionales cableado industrial PLC', fecha_factura: '2026-06-15', importe: 20000.00, estado: 'RECIBIDA' },
      // MES Olanet Portugal
      { id_interno_factura: 'FAC-2026-006', id_proyecto: 'PRJ-2026-006', id_proveedor: accenture.id_proveedor, id_tipo_factura: tiposFacturaMap['Consultoría Externa'], numero_factura: 'FR-OL-PT-01', concepto: 'Consultoría y replanteo de red en planta Portugal', fecha_factura: '2026-04-20', importe: 40000.00, estado: 'RECIBIDA' },
      // SGA Mecalux Valencia
      { id_interno_factura: 'FAC-2026-007', id_proyecto: 'PRJ-2026-007', id_proveedor: deloitte.id_proveedor, id_tipo_factura: tiposFacturaMap['Consultoría Externa'], numero_factura: 'FR-ME-01', concepto: 'Diseño de la topología lógica WMS Mecalux', fecha_factura: '2026-05-15', importe: 60000.00, estado: 'RECIBIDA' },
      // TESI Valencia
      { id_interno_factura: 'FAC-2026-008', id_proyecto: 'PRJ-2026-009', id_proveedor: sopra.id_proveedor, id_tipo_factura: tiposFacturaMap['Desarrollos e Integraciones'], numero_factura: 'FR-TE-01', concepto: 'Hito 1: Implantación del CORE TESI en servidor local', fecha_factura: '2026-05-02', importe: 80000.00, estado: 'RECIBIDA' },
      // Portátiles Corporate
      { id_interno_factura: 'FAC-2026-009', id_proyecto: 'PRJ-2026-010', id_proveedor: capgemini.id_proveedor, id_tipo_factura: tiposFacturaMap['Hardware y Equipamiento'], numero_factura: 'FR-LT-01', concepto: 'Lote de 15 portátiles Lenovo L14 para Corporate', fecha_factura: '2026-03-30', importe: 50000.00, estado: 'RECIBIDA' },
      // Portátiles Valencia
      { id_interno_factura: 'FAC-2026-010', id_proyecto: 'PRJ-2026-011', id_proveedor: capgemini.id_proveedor, id_tipo_factura: tiposFacturaMap['Hardware y Equipamiento'], numero_factura: 'FR-LT-02', concepto: 'Lote de 40 portátiles Lenovo L14 para Valencia', fecha_factura: '2026-04-12', importe: 15000.00, estado: 'RECIBIDA' },
      // NEXUS API Manager
      { id_interno_factura: 'FAC-2026-011', id_proyecto: 'PRJ-2026-019', id_proveedor: sopra.id_proveedor, id_tipo_factura: tiposFacturaMap['Desarrollos e Integraciones'], numero_factura: 'FR-NX-01', concepto: 'Definición de pasarela de seguridad API', fecha_factura: '2026-04-15', importe: 15000.00, estado: 'RECIBIDA' },
      // DATA Metodología
      { id_interno_factura: 'FAC-2026-012', id_proyecto: 'PRJ-2026-020', id_proveedor: indra.id_proveedor, id_tipo_factura: tiposFacturaMap['Migración y Calidad de Datos'], numero_factura: 'FR-DT-01', concepto: 'Hito 1: Auditoría de taxonomías documentales legadas', fecha_factura: '2026-03-28', importe: 8000.00, estado: 'RECIBIDA' }
    ];
    await Facturas.bulkCreate(facturasData);
    console.log('Facturas seeded.');

    // ==========================================
    // 10. CAMBIOS DE ALCANCE (CRs)
    // ==========================================
    const crsData = [
      { id_cambio: 'CR-2026-001', id_proyecto: 'PRJ-2026-001', fecha_solicitud: '2026-03-20', fecha_resolucion: '2026-03-25', id_solicitante_contacto: contactoAna.id_contacto, id_aprobador_contacto: contactoRoberto.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Integración adicional con WhatsApp Business para notificaciones comerciales.', impacta_importe: true, importe_impacto: 12000.00, impacta_tiempo: true, dias_impacto: 20 },
      { id_cambio: 'CR-2026-002', id_proyecto: 'PRJ-2026-005', fecha_solicitud: '2026-05-10', fecha_resolucion: '2026-05-15', id_solicitante_contacto: contactoAna.id_contacto, id_aprobador_contacto: contactoRoberto.id_contacto, estado_cambio: 'APROBADO', descripcion_motivo: 'Sensorización de la línea 5 y 6 no presupuestada inicialmente en el proyecto MES Valencia.', impacta_importe: true, importe_impacto: 15000.00, impacta_tiempo: true, dias_impacto: 15 },
      { id_cambio: 'CR-2026-003', id_proyecto: 'PRJ-2026-007', fecha_solicitud: '2026-06-01', id_solicitante_contacto: contactoAna.id_contacto, id_aprobador_contacto: contactoRoberto.id_contacto, estado_cambio: 'SOLICITADO', descripcion_motivo: 'Inclusión de lectores de código de barras industriales inalámbricos (extra RF).', impacta_importe: true, importe_impacto: 10000.00, impacta_tiempo: false, dias_impacto: 0 }
    ];
    await CambiosAlcance.bulkCreate(crsData);
    console.log('Cambios de alcance seeded.');

    // ==========================================
    // 11. RIESGOS
    // ==========================================
    const riesgosData = [
      { id_riesgo: 'RSG-2026-001', id_proyecto: 'PRJ-2026-001', titulo_riesgo: 'Resistencia al cambio comercial', descripcion: 'El personal de ventas podría tener fricciones al adoptar la interfaz de Salesforce.', probabilidad: 'ALTA', impacto: 'MEDIA', plan_mitigacion: 'Talleres prácticos intensivos durante la fase de estabilización.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-07-30' },
      { id_riesgo: 'RSG-2026-002', id_proyecto: 'PRJ-2026-005', titulo_riesgo: 'Interferencias de señal wifi en planta', descripcion: 'El entorno metálico de la fábrica podría atenuar y distorsionar las señales WiFi.', probabilidad: 'MEDIA', impacto: 'ALTA', plan_mitigacion: 'Instalar repetidores redundantes con certificación industrial.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-08-15' },
      { id_riesgo: 'RSG-2026-003', id_proyecto: 'PRJ-2026-007', titulo_riesgo: 'Caída de cobertura móvil en alturas', descripcion: 'Las estanterías metálicas elevadas pueden bloquear las señales móviles de las terminales.', probabilidad: 'BAJA', impacto: 'ALTA', plan_mitigacion: 'Soporte y antenas direccionales en los pasillos de picking.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-09-01' },
      { id_riesgo: 'RSG-2026-004', id_proyecto: 'PRJ-2026-010', titulo_riesgo: 'Falta de stock de equipos Lenovo', descripcion: 'Escasez global en el canal de distribución de los modelos L14 solicitados.', probabilidad: 'ALTA', impacto: 'ALTA', plan_mitigacion: 'Adjudicación temprana y reserva en el mayorista oficial.', estado_riesgo: 'ACTIVO', fecha_proxima_revision: '2026-07-20' }
    ];
    await Riesgos.bulkCreate(riesgosData);
    console.log('Riesgos seeded.');

    // ==========================================
    // 12. INCIDENCIAS
    // ==========================================
    const incidenciasData = [
      { id_incidencia: 'INC-2026-001', id_proyecto: 'PRJ-2026-001', titulo: 'Error de sincronización con API de marketing', descripcion: 'Los leads capturados no fluyen del hub de marketing a Salesforce por fallo de token OAuth2.', tipo_incidencias: 'TECNICA', criticidad: 'MEDIA', estado: 'ABIERTA', fecha_apertura: '2026-06-15' },
      { id_incidencia: 'INC-2026-002', id_proyecto: 'PRJ-2026-005', titulo: 'Fallo del lector OPC UA en inyectora 4', descripcion: 'La inyectora 4 no envía el conteo de ciclos a la pasarela MES por fallo de firmware.', tipo_incidencias: 'TECNICA', criticidad: 'ALTA', estado: 'EN_PROCESO', fecha_apertura: '2026-06-20' },
      { id_incidencia: 'INC-2026-003', id_proyecto: 'PRJ-2026-010', titulo: 'Retraso del envío del lote en aduana', descripcion: 'El cargamento de portátiles corporativos se encuentra retenido en aduanas por documentación arancelaria.', tipo_incidencias: 'RETRASO_PLAZOS', criticidad: 'BLOQUEANTE', estado: 'ABIERTA', fecha_apertura: '2026-07-01' }
    ];
    await Incidencias.bulkCreate(incidenciasData);
    console.log('Incidencias seeded.');

    // ==========================================
    // 13. LECCIONES APRENDIDAS
    // ==========================================
    const leccionesData = [
      { id_leccion: 'LEA-2026-001', tipo_leccion: 'BUENA_PRACTICA', id_proyecto: 'PRJ-2026-001', id_proveedor: sopra.id_proveedor, titulo: 'Involucración temprana del equipo de ventas', contexto: 'Hacer partícipe al comercial en la fase de prototipos eliminó miedos y aumentó el feedback.', recomendacion_futura: 'En proyectos CRM, incluir siempre talleres prácticos desde el sprint 2.' },
      { id_leccion: 'LEA-2026-002', tipo_leccion: 'ERROR_A_EVITAR', id_proyecto: 'PRJ-2026-005', id_proveedor: accenture.id_proveedor, titulo: 'No testear cobertura wifi antes de fijar las antenas', contexto: 'Se fijaron los AP según planos y hubo zonas de sombra al mover maquinaria pesada.', recomendacion_futura: 'Ejecutar siempre auditorías de cobertura RF con maquinaria en funcionamiento real.' }
    ];
    await LeccionesAprendidas.bulkCreate(leccionesData);
    console.log('LeccionesAprendidas seeded.');

    // ==========================================
    // 14. COMENTARIOS
    // ==========================================
    const comentariosData = [
      { id_proyecto: 'PRJ-2026-001', id_usuario: pmsMap['ALEJANDRO'], texto_comentario: '<p><strong>Kickoff completado</strong>: El plan de integración con el CRM ha sido presentado y validado por los directores comerciales.</p>', fecha_registro: new Date('2026-01-16T10:00:00Z'), editado: false, es_importante: true },
      { id_proyecto: 'PRJ-2026-005', id_usuario: pmsMap['ALEJANDRO'], texto_comentario: '<p><strong>Prueba piloto exitosa</strong>: Se reciben señales de la inyectora 1 correctamente en el panel de Olanet. Datos de OEE fluyendo.</p>', fecha_registro: new Date('2026-06-21T15:30:00Z'), editado: false, es_importante: true }
    ];
    await ComentariosProyecto.bulkCreate(comentariosData);
    console.log('Comentarios seeded.');

    // ==========================================
    // 15. RELACIONES MANY-TO-MANY (KUs e Involucrados)
    // ==========================================
    const p1 = proyectos[0];
    const p5 = proyectos[4];
    await p1.addInvolvedContacts([contactoAna.id_contacto, contactoRoberto.id_contacto]);
    await p1.addComSemanalContactos([contactoAna.id_contacto]);
    await p1.addComMensualContactos([contactoRoberto.id_contacto]);
    await p1.addComSteerCoContactos([contactoRoberto.id_contacto, contactoElena.id_contacto]);

    await p5.addInvolvedContacts([contactoAna.id_contacto, contactoDiego.id_contacto]);
    await p5.addComSemanalContactos([contactoAna.id_contacto]);
    await p5.addComMensualContactos([contactoDiego.id_contacto]);
    console.log('Relaciones Many-to-Many configuradas.');

    console.log(`Successfully seeded ${proyectosExcel.length} projects.`);
    console.log('\n🎉 Seeding successfully completed!');
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
