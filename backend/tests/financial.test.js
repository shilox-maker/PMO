const { 
  sequelize, Usuarios, Proyectos, EstadosProyecto, Sedes, Proveedores, ContactosProveedor, CambiosAlcance, Facturas, TiposFactura 
} = require('../models');
const { getProjectCalculations } = require('../models/automations');

describe('Pruebas de Integración - Reglas Financieras de Proyecto', () => {

  beforeAll(async () => {
    // Sincronizar y limpiar base de datos de test
    await sequelize.sync({ force: true });

    // Crear entidades maestras
    await Usuarios.create({
      id_usuario: 1,
      nombre: 'Jaime',
      apellidos: 'Martínez',
      correo: 'jmartinez@dacsa.com',
      password: 'hash',
      perfil: 'PM',
      activo: true
    });

    await Sedes.create({ id_sede: 1, nombre_sede: 'Valencia' });
    await Proveedores.create({ id_proveedor: 1, nombre_razon_social: 'Sopra Steria' });
    await ContactosProveedor.create({ 
      id_contacto: 1, 
      id_proveedor: 1, 
      nombre: 'Ana', 
      apellidos: 'García', 
      puesto: 'AE', 
      telefono: '123', 
      email: 'ana@sopra.com' 
    });
    
    await EstadosProyecto.create({ 
      id_estado: 1, 
      nombre_estado: 'Ejecución', 
      icono: '🛠️', 
      orden: 7, 
      proyecto_cerrado: false 
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('debería retornar el presupuesto base si el proyecto no tiene facturas ni cambios de alcance', async () => {
    const projectId = 'PRJ-2026-FIN1';
    
    await Proyectos.create({
      id_proyecto: projectId,
      nombre_proyecto: 'Proyecto Sin Cambios',
      descripcion: 'Proyecto base',
      id_estado: 1,
      id_pm: 1,
      id_proveedor: 1,
      id_sede: 1,
      id_sponsor: 1,
      budget_inicial: 50000.00,
      fecha_inicio: '2026-01-01',
      fecha_fin_inicial: '2026-12-31'
    });

    const calculations = await getProjectCalculations(projectId, 50000.00, '2026-12-31');

    expect(calculations.budget_actualizado).toBe(50000.00);
    expect(calculations.consumo_real).toBe(0.00);
    expect(calculations.total_facturado).toBe(0.00);
    expect(calculations.total_pendiente).toBe(0.00);
    expect(calculations.presupuesto_disponible).toBe(50000.00);
    expect(calculations.fecha_fin_estimada).toBe('2026-12-31');
  });

  it('debería calcular el budget_actualizado y fecha_fin_estimada aplicando solo cambios de alcance APROBADOS', async () => {
    const projectId = 'PRJ-2026-FIN2';
    
    await Proyectos.create({
      id_proyecto: projectId,
      nombre_proyecto: 'Proyecto Con Cambios',
      descripcion: 'Proyecto base',
      id_estado: 1,
      id_pm: 1,
      id_proveedor: 1,
      id_sede: 1,
      id_sponsor: 1,
      budget_inicial: 100000.00,
      fecha_inicio: '2026-01-01',
      fecha_fin_inicial: '2026-06-30'
    });

    // 1. Cambio aprobado con impacto financiero y de tiempo
    await CambiosAlcance.create({
      id_cambio: 'CR-001',
      id_proyecto: projectId,
      fecha_solicitud: '2026-02-01',
      id_solicitante_contacto: 1,
      id_aprobador_contacto: 1,
      estado_cambio: 'APROBADO',
      descripcion_motivo: 'Ampliación alcance',
      impacta_importe: true,
      importe_impacto: 25000.00,
      impacta_tiempo: true,
      dias_impacto: 10
    });

    // 2. Cambio aprobado con impacto de tiempo solamente
    await CambiosAlcance.create({
      id_cambio: 'CR-002',
      id_proyecto: projectId,
      fecha_solicitud: '2026-03-01',
      id_solicitante_contacto: 1,
      id_aprobador_contacto: 1,
      estado_cambio: 'APROBADO',
      descripcion_motivo: 'Retraso de aprobación de licencias',
      impacta_importe: false,
      importe_impacto: 0.00,
      impacta_tiempo: true,
      dias_impacto: 5
    });

    // 3. Cambio SOLICITADO (no debe sumar al cálculo)
    await CambiosAlcance.create({
      id_cambio: 'CR-003',
      id_proyecto: projectId,
      fecha_solicitud: '2026-04-01',
      id_solicitante_contacto: 1,
      id_aprobador_contacto: 1,
      estado_cambio: 'SOLICITADO',
      descripcion_motivo: 'Cambio propuesto',
      impacta_importe: true,
      importe_impacto: 50000.00,
      impacta_tiempo: true,
      dias_impacto: 30
    });

    // 4. Cambio RECHAZADO (no debe sumar al cálculo)
    await CambiosAlcance.create({
      id_cambio: 'CR-004',
      id_proyecto: projectId,
      fecha_solicitud: '2026-04-15',
      id_solicitante_contacto: 1,
      id_aprobador_contacto: 1,
      estado_cambio: 'RECHAZADO',
      descripcion_motivo: 'Cambio cancelado',
      impacta_importe: true,
      importe_impacto: 10000.00,
      impacta_tiempo: false,
      dias_impacto: 0
    });

    const calculations = await getProjectCalculations(projectId, 100000.00, '2026-06-30');

    // budget_actualizado = 100000 + 25000 = 125000
    expect(calculations.budget_actualizado).toBe(125000.00);
    
    // fecha_fin_estimada = 2026-06-30 + (10 + 5) días = 2026-07-15
    expect(calculations.fecha_fin_estimada).toBe('2026-07-15');
  });

  it('debería calcular el consumo_real, total_facturado y total_pendiente a partir de las facturas', async () => {
    const projectId = 'PRJ-2026-FIN3';

    await Proyectos.create({
      id_proyecto: projectId,
      nombre_proyecto: 'Proyecto Con Facturas',
      descripcion: 'Proyecto base',
      id_estado: 1,
      id_pm: 1,
      id_proveedor: 1,
      id_sede: 1,
      id_sponsor: 1,
      budget_inicial: 80000.00,
      fecha_inicio: '2026-01-01',
      fecha_fin_inicial: '2026-12-31'
    });

    // 1. Factura Recibida
    await Facturas.create({
      id_interno_factura: 'FAC-001',
      id_proyecto: projectId,
      id_proveedor: 1,
      concepto: 'Fase 1 completada',
      fecha_factura: '2026-03-01',
      importe: 30000.00,
      estado: 'RECIBIDA'
    });

    // 2. Factura Pendiente
    await Facturas.create({
      id_interno_factura: 'FAC-002',
      id_proyecto: projectId,
      id_proveedor: 1,
      concepto: 'Fase 2 entregables',
      fecha_factura: '2026-05-01',
      importe: 15000.00,
      estado: 'PENDIENTE_DE_RECIBIR'
    });

    // 3. Factura Recibida adicional
    await Facturas.create({
      id_interno_factura: 'FAC-003',
      id_proyecto: projectId,
      id_proveedor: 1,
      concepto: 'Soporte adicional',
      fecha_factura: '2026-06-01',
      importe: 5000.00,
      estado: 'RECIBIDA'
    });

    const calculations = await getProjectCalculations(projectId, 80000.00, '2026-12-31');

    // total_facturado = 30000 + 5000 = 35000
    expect(calculations.total_facturado).toBe(35000.00);

    // total_pendiente = 15000
    expect(calculations.total_pendiente).toBe(15000.00);

    // consumo_real = 35000 + 15000 = 50000
    expect(calculations.consumo_real).toBe(50000.00);

    // presupuesto_disponible = 80000 - 50000 = 30000
    expect(calculations.presupuesto_disponible).toBe(30000.00);
  });

  it('debería permitir asociar un tipo de factura a una factura y recuperar la relación', async () => {
    const tipo = await TiposFactura.create({ nombre: 'Consultoría Externa' });
    await Facturas.create({
      id_interno_factura: 'FAC-TEST-TIPO',
      id_proyecto: 'PRJ-2026-FIN1',
      id_proveedor: 1,
      id_tipo_factura: tipo.id_tipo_factura,
      concepto: 'Prueba Tipo Factura',
      fecha_factura: '2026-07-01',
      importe: 1000.00,
      estado: 'RECIBIDA'
    });

    const foundFac = await Facturas.findByPk('FAC-TEST-TIPO', {
      include: [{ model: TiposFactura, as: 'TipoFactura' }]
    });

    expect(foundFac).not.toBeNull();
    expect(foundFac.TipoFactura).not.toBeNull();
    expect(foundFac.TipoFactura.nombre).toBe('Consultoría Externa');
  });

});
