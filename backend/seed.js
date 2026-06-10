const { 
  sequelize, Sedes, Proveedores, ContactosProveedor, Usuarios, KeyUsers, 
  Proyectos, Incidencias, Riesgos, LeccionesAprendidas, Facturas, 
  CambiosAlcance, Tareas, ProyectoKeyUsers, ProyectoComSemanalKU, 
  ProyectoComMensualKU, ProyectoSteerCoKU, EstadosProyecto, ComentariosProyecto 
} = require('./models/index');

const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  try {
    console.log('Synchronizing database models...');
    // Force sync drops all tables and recreates them
    await sequelize.sync({ force: true });
    console.log('Database synced. Seeding tables...');

    // 1. Seed Sedes
    const sedes = await Sedes.bulkCreate([
      { nombre_sede: 'Valencia' },
      { nombre_sede: 'Madrid' },
      { nombre_sede: 'Buñol' },
      { nombre_sede: 'Barcelona' }
    ]);
    console.log('Sedes seeded.');

    // 2. Seed Proveedores (renamed "Mi Empresa" to "Dacsa")
    const proveedores = await Proveedores.bulkCreate([
      { nombre_razon_social: 'Dacsa', telefono_general: '910000000', email_general: 'contacto@dacsa.com' },
      { nombre_razon_social: 'Sopra Steria', telefono_general: '960000001', email_general: 'info@soprasteria.com' },
      { nombre_razon_social: 'Indra Minsait', telefono_general: '960000002', email_general: 'info@minsait.com' },
      { nombre_razon_social: 'Accenture', telefono_general: '960000003', email_general: 'info@accenture.com' },
      { nombre_razon_social: 'Capgemini', telefono_general: '960000004', email_general: 'info@capgemini.com' }
    ]);
    console.log('Proveedores seeded.');

    const dacsa = proveedores[0];
    const sopra = proveedores[1];
    const indra = proveedores[2];
    const accenture = proveedores[3];
    const capgemini = proveedores[4];

    // 3. Seed ContactosProveedor
    await ContactosProveedor.bulkCreate([
      { id_proveedor: sopra.id_proveedor, nombre: 'Ana', apellidos: 'García', puesto: 'Account Executive', telefono: '600111222', email: 'agarcia@sopra.com' },
      { id_proveedor: sopra.id_proveedor, nombre: 'Luis', apellidos: 'López', puesto: 'Technical Lead', telefono: '600333444', email: 'llopez@sopra.com' },
      { id_proveedor: indra.id_proveedor, nombre: 'Javier', apellidos: 'Sanz', puesto: 'Service Manager', telefono: '610555666', email: 'jsanz@minsait.com' },
      { id_proveedor: accenture.id_proveedor, nombre: 'Beatriz', apellidos: 'Gómez', puesto: 'Client Partner', telefono: '620777888', email: 'b.gomez@accenture.com' }
    ]);
    console.log('ContactosProveedor seeded.');

    // 4. Seed EstadosProyecto (16 states)
    const statesData = [
      { nombre_estado: 'Kickoff', icono: '🚀', orden: 1 },
      { nombre_estado: 'Análisis de Viabilidad', icono: '📋', orden: 2 },
      { nombre_estado: 'Aprobación de Arquitectura', icono: '📐', orden: 3 },
      { nombre_estado: 'Diseño Conceptual', icono: '💡', orden: 4 },
      { nombre_estado: 'Planificación', icono: '📅', orden: 5 },
      { nombre_estado: 'Validación Técnica', icono: '🔍', orden: 6 },
      { nombre_estado: 'Desarrollo', icono: '🛠️', orden: 7 },
      { nombre_estado: 'Pruebas QA', icono: '🧪', orden: 8 },
      { nombre_estado: 'UAT (Pruebas de Usuario)', icono: '👥', orden: 9 },
      { nombre_estado: 'Despliegue', icono: '📦', orden: 10 },
      { nombre_estado: 'Estabilización', icono: '🛡️', orden: 11 },
      { nombre_estado: 'Cierre', icono: '🏁', orden: 12 },
      { nombre_estado: 'Pausado', icono: '⏸️', orden: 13 },
      { nombre_estado: 'Cancelado', icono: '❌', orden: 14 },
      { nombre_estado: 'En Revisión Financiera', icono: '💰', orden: 15 },
      { nombre_estado: 'Pendiente de Aprobación', icono: '⏳', orden: 16 }
    ];
    const seededStates = await EstadosProyecto.bulkCreate(statesData);
    console.log('EstadosProyecto seeded.');

    const stateMap = {};
    seededStates.forEach(s => {
      stateMap[s.nombre_estado] = s.id_estado;
    });

    // 5. Seed Usuarios (Internal PMs / Staff with passwords)
    const users = await Usuarios.bulkCreate([
      { nombre: 'Jaime', apellidos: 'Martínez', correo: 'jmartinez@dacsa.com', password: hashPassword('123'), perfil: 'PM', activo: true },
      { nombre: 'Marta', apellidos: 'Sánchez', correo: 'msanchez@dacsa.com', password: hashPassword('123'), perfil: 'PM', activo: true },
      { nombre: 'Carlos', apellidos: 'Gómez', correo: 'cgomez@dacsa.com', password: hashPassword('123'), perfil: 'PM', activo: true },
      { nombre: 'Lucía', apellidos: 'Fernández', correo: 'lfernandez@dacsa.com', password: hashPassword('123'), perfil: 'DIRECTOR', activo: true },
      { nombre: 'Administrador', apellidos: 'Sistema', correo: 'admin@dacsa.com', password: hashPassword('admin'), perfil: 'ADMINISTRADOR', activo: true }
    ]);
    console.log('Usuarios seeded.');

    const pmJaime = users[0];
    const pmMarta = users[1];
    const pmCarlos = users[2];

    // 6. Seed KeyUsers (Dacsa / Vendors)
    const keyUsers = await KeyUsers.bulkCreate([
      // KUs of "Dacsa" (Sponsors / Stakeholders)
      { nombre: 'Roberto', apellidos: 'Ramos', correo: 'rramos@dacsa.com', id_proveedor_empresa: dacsa.id_proveedor },
      { nombre: 'Elena', apellidos: 'Vargas', correo: 'evargas@dacsa.com', id_proveedor_empresa: dacsa.id_proveedor },
      { nombre: 'Diego', apellidos: 'Torres', correo: 'dtorres@dacsa.com', id_proveedor_empresa: dacsa.id_proveedor },
      // KUs of Vendor companies
      { nombre: 'Pedro', apellidos: 'Gutiérrez', correo: 'pgutierrez@sopra.com', id_proveedor_empresa: sopra.id_proveedor },
      { nombre: 'Sofía', apellidos: 'Nieto', correo: 'snieto@minsait.com', id_proveedor_empresa: indra.id_proveedor },
      { nombre: 'Tomás', apellidos: 'Marín', correo: 'tmarin@accenture.com', id_proveedor_empresa: accenture.id_proveedor }
    ]);
    console.log('KeyUsers seeded.');

    const kuRoberto = keyUsers[0];
    const kuElena = keyUsers[1];
    const kuDiego = keyUsers[2];
    const kuPedro = keyUsers[3];
    const kuSofia = keyUsers[4];
    const kuTomas = keyUsers[5];

    // 7. Seed Proyectos (Linking with id_estado)
    const proyectosData = [
      {
        id_proyecto: 'PRJ-2026-001',
        nombre_proyecto: 'Renovación ERP Valencia',
        descripcion: 'Migración del sistema ERP local a la plataforma en la nube para mejorar la gestión comercial.',
        id_pm: pmJaime.id_usuario,
        id_proveedor: sopra.id_proveedor,
        id_sede: sedes[0].id_sede, // Valencia
        id_sponsor_ku: kuRoberto.id_ku,
        id_estado: stateMap['Desarrollo'],
        indicador_rag: 'VERDE',
        fecha_inicio: '2026-01-10',
        fecha_fin_inicial: '2026-10-31',
        es_capex: true,
        codigo_capex: 'CPX-998822',
        budget_inicial: 250000.00,
        com_semanal_activo: true,
        com_semanal_finalidad: 'Seguimiento técnico del avance de sprints y bloqueantes.',
        com_mensual_activo: true,
        com_mensual_finalidad: 'Comité directivo para revisar hitos de entrega y facturación.',
        com_steerco_activo: true,
        com_steerco_finalidad: 'SteerCo trimestral con Dirección de Operaciones.'
      },
      {
        id_proyecto: 'PRJ-2026-002',
        nombre_proyecto: 'Portal de Clientes Centralizado',
        descripcion: 'Desarrollo de un portal unificado para gestión de clientes a nivel nacional.',
        id_pm: pmMarta.id_usuario,
        id_proveedor: indra.id_proveedor,
        id_sede: sedes[1].id_sede, // Madrid
        id_sponsor_ku: kuElena.id_ku,
        id_estado: stateMap['Kickoff'],
        indicador_rag: 'VERDE',
        fecha_inicio: '2026-05-01',
        fecha_fin_inicial: '2026-12-31',
        es_capex: false,
        budget_inicial: 120000.00,
        com_semanal_activo: true,
        com_semanal_finalidad: 'Sincronización semanal de requerimientos de diseño.',
        com_mensual_activo: false,
        com_steerco_activo: false
      },
      {
        id_proyecto: 'PRJ-2026-003',
        nombre_proyecto: 'Automatización Almacén Buñol',
        descripcion: 'Implementación de lectores RFID y software de control logístico en planta.',
        id_pm: pmJaime.id_usuario,
        id_proveedor: accenture.id_proveedor,
        id_sede: sedes[2].id_sede, // Buñol
        id_sponsor_ku: kuDiego.id_ku,
        id_estado: stateMap['Desarrollo'],
        indicador_rag: 'AMARILLO',
        fecha_inicio: '2026-02-15',
        fecha_fin_inicial: '2026-08-30',
        es_capex: true,
        codigo_capex: 'CPX-443311',
        budget_inicial: 340000.00,
        com_semanal_activo: true,
        com_semanal_finalidad: 'Revisión técnica de despliegue en campo.',
        com_mensual_activo: true,
        com_mensual_finalidad: 'Revisión de consumo de presupuesto con el patrocinador.',
        com_steerco_activo: true,
        com_steerco_finalidad: 'Reunión ejecutiva mensual por desviación presupuestaria.'
      },
      {
        id_proyecto: 'PRJ-2026-004',
        nombre_proyecto: 'Ciberseguridad Infraestructura Crítica',
        descripcion: 'Auditoría y fortificación perimetral de servidores centrales.',
        id_pm: pmCarlos.id_usuario,
        id_proveedor: capgemini.id_proveedor,
        id_sede: sedes[1].id_sede, // Madrid
        id_sponsor_ku: kuRoberto.id_ku,
        id_estado: stateMap['Desarrollo'],
        indicador_rag: 'ROJO',
        fecha_inicio: '2026-03-01',
        fecha_fin_inicial: '2026-07-15',
        es_capex: false,
        budget_inicial: 95000.00,
        com_semanal_activo: true,
        com_semanal_finalidad: 'Actualización diaria y semanal de parches críticos.',
        com_mensual_activo: true,
        com_mensual_finalidad: 'Presentación de informe de vulnerabilidades resueltas.',
        com_steerco_activo: false
      },
      {
        id_proyecto: 'PRJ-2026-005',
        nombre_proyecto: 'Plataforma Analítica Big Data',
        descripcion: 'Implementación de arquitectura de datos moderna sobre Databricks.',
        id_pm: pmJaime.id_usuario,
        id_proveedor: sopra.id_proveedor,
        id_sede: sedes[3].id_sede, // Barcelona
        id_sponsor_ku: kuElena.id_ku,
        id_estado: stateMap['Cierre'],
        indicador_rag: 'VERDE',
        fecha_inicio: '2025-06-01',
        fecha_fin_inicial: '2026-04-30',
        es_capex: true,
        codigo_capex: 'CPX-556677',
        budget_inicial: 420000.00,
        com_semanal_activo: false,
        com_mensual_activo: true,
        com_mensual_finalidad: 'Cierre formal de proyecto y entrega a operaciones.',
        com_steerco_activo: false
      },
      {
        id_proyecto: 'PRJ-2026-006',
        nombre_proyecto: 'Migración Telefonía IP',
        descripcion: 'Actualización de centralitas y despliegue de telefonía sobre IP para todas las sedes.',
        id_pm: pmMarta.id_usuario,
        id_proveedor: indra.id_proveedor,
        id_sede: sedes[0].id_sede, // Valencia
        id_sponsor_ku: kuDiego.id_ku,
        id_estado: stateMap['Pausado'],
        indicador_rag: 'AMARILLO',
        fecha_inicio: '2025-11-01',
        fecha_fin_inicial: '2026-05-30',
        es_capex: false,
        budget_inicial: 80000.00,
        com_semanal_activo: false,
        com_mensual_activo: false,
        com_steerco_activo: false
      }
    ];

    const proyectos = [];
    for (const data of proyectosData) {
      const proj = await Proyectos.create(data);
      proyectos.push(proj);
    }
    console.log('Proyectos seeded.');

    // 8. Seed Many-to-Many Relationships (Involved KUs, weekly/monthly/Steerco communications)
    const p1 = proyectos[0];
    await p1.addInvolvedKeyUsers([kuRoberto.id_ku, kuElena.id_ku, kuPedro.id_ku]);
    await p1.addComSemanalKUs([kuRoberto.id_ku, kuPedro.id_ku]);
    await p1.addComMensualKUs([kuRoberto.id_ku, kuElena.id_ku]);
    await p1.addComSteerCoKUs([kuRoberto.id_ku]);

    const p3 = proyectos[2];
    await p3.addInvolvedKeyUsers([kuDiego.id_ku, kuTomas.id_ku]);
    await p3.addComSemanalKUs([kuTomas.id_ku]);
    await p3.addComMensualKUs([kuDiego.id_ku, kuTomas.id_ku]);
    await p3.addComSteerCoKUs([kuDiego.id_ku]);

    const p4 = proyectos[3];
    await p4.addInvolvedKeyUsers([kuRoberto.id_ku, kuSofia.id_ku]);
    await p4.addComSemanalKUs([kuSofia.id_ku]);
    await p4.addComMensualKUs([kuRoberto.id_ku]);

    console.log('Relaciones Many-to-Many configuradas.');

    // 9. Seed Incidencias
    await Incidencias.bulkCreate([
      {
        id_incidencia: 'INC-2026-001',
        id_proyecto: 'PRJ-2026-003',
        titulo: 'Retraso en entrega de lectores RFID',
        descripcion: 'El proveedor de hardware indica rotura de stock internacional, aplazando la entrega 4 semanas.',
        tipo_incidencias: 'PROVEEDOR_DESAPARECIDO',
        criticidad: 'ALTA',
        estado: 'EN_PROCESO',
        fecha_apertura: '2026-03-01'
      },
      {
        id_incidencia: 'INC-2026-002',
        id_proyecto: 'PRJ-2026-004',
        titulo: 'Bloqueo de puertos de red críticos',
        descripcion: 'El firewall central bloquea accesos legítimos de la aplicación de producción principal.',
        tipo_incidencias: 'TECNICA',
        criticidad: 'BLOQUEANTE',
        estado: 'ABIERTA',
        fecha_apertura: '2026-04-10'
      },
      {
        id_incidencia: 'INC-2026-003',
        id_proyecto: 'PRJ-2026-001',
        titulo: 'Inconsistencia de datos en migración',
        descripcion: 'Las facturas históricas del año 2020 no cuadran sus sumas acumuladas.',
        tipo_incidencias: 'TECNICA',
        criticidad: 'MEDIA',
        estado: 'RESUELTA',
        fecha_apertura: '2026-02-10',
        fecha_cierre: '2026-02-18',
        solucion_aplicada: 'Se aplicó un script corrector SQL para recalcular totales históricos en la tabla de facturación del ERP origen.'
      }
    ]);
    console.log('Incidencias seeded.');

    // 10. Seed Riesgos
    await Riesgos.bulkCreate([
      {
        id_riesgo: 'RSG-2026-001',
        id_proyecto: 'PRJ-2026-001',
        titulo_riesgo: 'Resistencia al cambio de usuarios finales',
        descripcion: 'Los usuarios de administración podrían rechazar el nuevo flujo de facturas al ser diferente.',
        probabilidad: 'ALTA',
        impacto: 'MEDIA',
        plan_mitigacion: 'Organizar talleres semanales de capacitación práctica de 2 horas desde 2 meses antes del despliegue oficial.',
        estado_riesgo: 'ACTIVO',
        fecha_proxima_revision: '2026-06-15'
      },
      {
        id_riesgo: 'RSG-2026-002',
        id_proyecto: 'PRJ-2026-003',
        titulo_riesgo: 'Desviación presupuestaria por fluctuación de moneda',
        descripcion: 'Los sensores importados cotizan en USD y la tasa EUR/USD puede incrementarse.',
        probabilidad: 'MEDIA',
        impacto: 'ALTA',
        plan_mitigacion: 'Aprobación de una cobertura de divisas en contrato o adquisición prioritaria de todo el lote.',
        estado_riesgo: 'ACTIVO',
        fecha_proxima_revision: '2026-07-01'
      },
      {
        id_riesgo: 'RSG-2026-003',
        id_proyecto: 'PRJ-2026-001',
        titulo_riesgo: 'Fuga de perfiles clave del partner técnico',
        descripcion: 'Rotación del arquitecto de software asignado por Sopra Steria.',
        probabilidad: 'BAJA',
        impacto: 'ALTA',
        plan_mitigacion: 'Firma de acuerdo de nivel de servicio (SLA) con penalización si el relevo tarda más de 10 días.',
        estado_riesgo: 'MITIGADO',
        fecha_proxima_revision: '2026-08-10'
      }
    ]);
    console.log('Riesgos seeded.');

    // 11. Seed LeccionesAprendidas
    await LeccionesAprendidas.bulkCreate([
      {
        id_leccion: 'LEA-2026-001',
        tipo_leccion: 'BUENA_PRACTICA',
        id_proyecto: 'PRJ-2026-005',
        id_proveedor: sopra.id_proveedor,
        titulo: 'Uso de entorno sandbox previo a migración',
        contexto: 'Crear réplicas aisladas de datos para pruebas disminuyó los errores productivos un 90%.',
        recomendacion_futura: 'Exigir al proveedor la habilitación obligatoria de sandbox antes de cualquier desarrollo final.'
      },
      {
        id_leccion: 'LEA-2026-002',
        tipo_leccion: 'ERROR_A_EVITAR',
        id_proyecto: null,
        id_proveedor: indra.id_proveedor,
        titulo: 'Evitar presupuestos sin desglose detallado de hardware',
        contexto: 'En la licitación no se especificaron marcas y luego hubo problemas de incompatibilidad de red.',
        recomendacion_futura: 'En todos los RFP de redes incluir anexo técnico estricto de compatibilidad homologada.'
      }
    ]);
    console.log('LeccionesAprendidas seeded.');

    // 12. Seed Facturas
    await Facturas.bulkCreate([
      {
        id_interno_factura: 'FAC-2026-001',
        id_proyecto: 'PRJ-2026-001',
        id_proveedor: sopra.id_proveedor,
        numero_factura: 'FR-2026-8891',
        concepto: 'Hito 1: Análisis de procesos de negocio y diseño conceptual',
        fecha_factura: '2026-02-15',
        importe: 45000.00,
        estado: 'PAGADA'
      },
      {
        id_interno_factura: 'FAC-2026-002',
        id_proyecto: 'PRJ-2026-001',
        id_proveedor: sopra.id_proveedor,
        numero_factura: 'FR-2026-9044',
        concepto: 'Hito 2: Configuración del core financiero y compras',
        fecha_factura: '2026-04-30',
        importe: 60000.00,
        estado: 'PENDIENTE_DE_RECIBIR'
      },
      {
        id_interno_factura: 'FAC-2026-003',
        id_proyecto: 'PRJ-2026-003',
        id_proveedor: accenture.id_proveedor,
        numero_factura: 'FAC-ACN-3011',
        concepto: 'Adquisición y licenciamiento inicial software de almacenes',
        fecha_factura: '2026-03-10',
        importe: 110000.00,
        estado: 'PAGADA'
      },
      {
        id_interno_factura: 'FAC-2026-004',
        id_proyecto: 'PRJ-2026-004',
        id_proveedor: capgemini.id_proveedor,
        numero_factura: 'FAC-CAP-998',
        concepto: 'Auditoría inicial de intrusión física y lógica',
        fecha_factura: '2026-03-25',
        importe: 35000.00,
        estado: 'PAGADA'
      }
    ]);
    console.log('Facturas seeded.');

    // 13. Seed CambiosAlcance
    await CambiosAlcance.bulkCreate([
      {
        id_cambio: 'CR-2026-001',
        id_proyecto: 'PRJ-2026-001',
        fecha_solicitud: '2026-03-15',
        fecha_resolucion: '2026-03-22',
        id_solicitante_ku: kuRoberto.id_ku,
        id_aprobador_ku: kuElena.id_ku,
        estado_cambio: 'APROBADO',
        descripcion_motivo: 'Inclusión de flujos contables adicionales para la filial europea no contemplada inicialmente.',
        impacta_importe: true,
        importe_impacto: 30000.00,
        impacta_tiempo: true,
        dias_impacto: 45
      },
      {
        id_cambio: 'CR-2026-002',
        id_proyecto: 'PRJ-2026-001',
        fecha_solicitud: '2026-05-10',
        id_solicitante_ku: kuPedro.id_ku,
        id_aprobador_ku: kuRoberto.id_ku,
        estado_cambio: 'SOLICITADO',
        descripcion_motivo: 'Integración API con courier logístico local.',
        impacta_importe: true,
        importe_impacto: 12500.00,
        impacta_tiempo: true,
        dias_impacto: 15
      },
      {
        id_cambio: 'CR-2026-003',
        id_proyecto: 'PRJ-2026-003',
        fecha_solicitud: '2026-04-01',
        fecha_resolucion: '2026-04-08',
        id_solicitante_ku: kuDiego.id_ku,
        id_aprobador_ku: kuRoberto.id_ku,
        estado_cambio: 'APROBADO',
        descripcion_motivo: 'Soporte robustecido IP-67 para lectores logísticos expuestos a humedad.',
        impacta_importe: true,
        importe_impacto: 15000.00,
        impacta_tiempo: false,
        dias_impacto: 0
      },
      {
        id_cambio: 'CR-2026-004',
        id_proyecto: 'PRJ-2026-004',
        fecha_solicitud: '2026-03-20',
        fecha_resolucion: '2026-03-25',
        id_solicitante_ku: kuSofia.id_ku,
        id_aprobador_ku: kuRoberto.id_ku,
        estado_cambio: 'RECHAZADO',
        descripcion_motivo: 'Ampliación de auditoría a dispositivos corporativos móviles. Rechazado por priorizar servidores.',
        impacta_importe: true,
        importe_impacto: 25000.00,
        impacta_tiempo: true,
        dias_impacto: 20
      }
    ]);
    console.log('CambiosAlcance seeded.');

    // 14. Seed Tareas
    await Tareas.bulkCreate([
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Definir Plan de Migración de datos', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-03-31' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'Despliegue entorno sandbox', es_hito: false, estado: 'COMPLETADA', fecha_limite: '2026-04-15' },
      { id_proyecto: 'PRJ-2026-001', titulo_tarea: 'UAT de módulos de Compras', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-08-15' },
      { id_proyecto: 'PRJ-2026-002', titulo_tarea: 'Kickoff formal de proyecto', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-05-15' },
      { id_proyecto: 'PRJ-2026-003', titulo_tarea: 'Montaje de racks en almacén', es_hito: false, estado: 'PENDIENTE', fecha_limite: '2026-06-30' },
      { id_proyecto: 'PRJ-2026-003', titulo_tarea: 'Integración RFID en ERP', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-07-31' },
      { id_proyecto: 'PRJ-2026-004', titulo_tarea: 'Entrega de informe auditoría interna', es_hito: true, estado: 'COMPLETADA', fecha_limite: '2026-04-15' },
      { id_proyecto: 'PRJ-2026-004', titulo_tarea: 'Mitigación de riesgos nivel crítico', es_hito: true, estado: 'PENDIENTE', fecha_limite: '2026-06-15' }
    ]);
    console.log('Tareas seeded.');

    // 15. Seed Comentarios
    await ComentariosProyecto.bulkCreate([
      { id_proyecto: 'PRJ-2026-001', id_usuario: pmJaime.id_usuario, texto_comentario: '<p><strong>Reunión de alineación completada.</strong> Las interfaces del ERP están validadas por el equipo de operaciones de Dacsa.</p>', fecha_registro: new Date('2026-02-15T10:00:00Z'), editado: false },
      { id_proyecto: 'PRJ-2026-001', id_usuario: pmMarta.id_usuario, texto_comentario: '<p><em>Nota:</em> Se ha identificado una pequeña demora en la entrega de las credenciales de prueba por parte de Sopra Steria. Se está revisando.</p>', fecha_registro: new Date('2026-03-01T15:30:00Z'), editado: false },
      { id_proyecto: 'PRJ-2026-003', id_usuario: pmJaime.id_usuario, texto_comentario: '<p>Se ha revisado el plan de mitigación para la adquisición de sensores. Estamos pendientes de recibir la confirmación de la cotización final en USD.</p>', fecha_registro: new Date('2026-04-05T09:15:00Z'), editado: false }
    ]);
    console.log('Comentarios seeded.');

    console.log('🎉 Seeding successfully completed!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script directly if invoked
if (require.main === module) {
  seed();
}

module.exports = seed;
