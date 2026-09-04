const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Proyectos, EstadosProyecto, Sedes, Ambitos } = require('../models');
const { listProjectsTool } = require('../mcp/tools/projects');
const { getPmoSummaryTool } = require('../mcp/tools/summary');
const bcrypt = require('bcryptjs');

let adminToken = '';
let statePlan;
let stateEjec;
let stateCierre;
let testProj1;
let testProj2;

beforeAll(async () => {
  process.env.AZURE_MOCK = 'true';
  process.env.JWT_SECRET = 'test_secret';

  await sequelize.sync({ force: true });

  const amb = await Ambitos.create({ id_ambito: 1, nombre: 'Global', code: 'GLB' });
  const hash = await bcrypt.hash('Test_1234!', 10);
  const adminUser = await Usuarios.create({
    nombre: 'Admin',
    apellidos: 'PMO',
    correo: 'admin@dacsa.com',
    password: hash,
    perfil: 'ADMINISTRADOR',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });

  const sede = await Sedes.create({ nombre_sede: 'Valencia' });

  statePlan = await EstadosProyecto.create({
    id_estado: 101,
    nombre_estado: 'Planificación',
    icono: '📋',
    orden: 1,
    macro_etapa: 'PLANIFICACION',
    proyecto_cerrado: false
  });

  stateEjec = await EstadosProyecto.create({
    id_estado: 102,
    nombre_estado: 'En Desarrollo',
    icono: '⚙️',
    orden: 2,
    macro_etapa: 'EJECUCION',
    proyecto_cerrado: false
  });

  stateCierre = await EstadosProyecto.create({
    id_estado: 103,
    nombre_estado: 'Finalizado',
    icono: '🏁',
    orden: 3,
    macro_etapa: 'CIERRE',
    proyecto_cerrado: true
  });

  testProj1 = await Proyectos.create({
    id_proyecto: 'PRJ-ME-001',
    nombre_proyecto: 'Proyecto En Desarrollo',
    descripcion: 'Proyecto de prueba en etapa de ejecucion',
    fecha_inicio: '2026-01-01',
    id_pm: adminUser.id_usuario,
    id_ambito: amb.id_ambito,
    id_sede: sede.id_sede,
    id_estado: stateEjec.id_estado,
    indicador_rag: 'VERDE',
    presupuesto_total: 10000,
    gasto_comprometido: 2000
  });

  testProj2 = await Proyectos.create({
    id_proyecto: 'PRJ-ME-002',
    nombre_proyecto: 'Proyecto En Planificacion',
    descripcion: 'Proyecto de prueba en etapa de planificacion',
    fecha_inicio: '2026-02-01',
    id_pm: adminUser.id_usuario,
    id_ambito: amb.id_ambito,
    id_sede: sede.id_sede,
    id_estado: statePlan.id_estado,
    indicador_rag: 'AMARILLO',
    presupuesto_total: 20000,
    gasto_comprometido: 5000
  });

  const adminRes = await request(app)
    .post('/api/login')
    .send({ correo: 'admin@dacsa.com', password: 'Test_1234!' });
  adminToken = adminRes.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('FEATURE-81: Macro-Etapas System Tests', () => {
  test('Admin State API - creates state with valid macro_etapa and validates invalid', async () => {
    // Valid creation
    const resOk = await request(app)
      .post('/api/admin/states')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre_estado: 'Kickoff Rápido',
        icono: '🚀',
        orden: 4,
        macro_etapa: 'PLANIFICACION',
        proyecto_cerrado: false
      });
    expect(resOk.statusCode).toBe(201);
    expect(resOk.body.macro_etapa).toBe('PLANIFICACION');

    // Invalid macro_etapa rejection
    const resBad = await request(app)
      .post('/api/admin/states')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre_estado: 'Estado Inválido',
        icono: '❌',
        orden: 5,
        macro_etapa: 'ETAPA_INEXISTENTE',
        proyecto_cerrado: false
      });
    expect(resBad.statusCode).toBe(400);
  });

  test('Admin State API - updates state macro_etapa', async () => {
    const res = await request(app)
      .put(`/api/admin/states/${statePlan.id_estado}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre_estado: 'Planificación Avanzada',
        icono: '📋',
        orden: 1,
        macro_etapa: 'INICIATIVA',
        proyecto_cerrado: false
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.macro_etapa).toBe('INICIATIVA');
  });

  test('GET /api/projects - filters by macro_etapa and includes macro_etapa in Estado', async () => {
    // Filter by EJECUCION
    const res = await request(app)
      .get('/api/projects?macro_etapa=EJECUCION')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id_proyecto).toBe('PRJ-ME-001');
    expect(res.body[0].Estado).toBeDefined();
    expect(res.body[0].Estado.macro_etapa).toBe('EJECUCION');
  });

  test('MCP Tools - listProjectsTool filters by macroEtapa', async () => {
    const res = await listProjectsTool.handler({ macroEtapa: 'EJECUCION' }, { isGlobal: true });
    expect(res).toHaveProperty('content');
    const data = JSON.parse(res.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe('PRJ-ME-001');
    expect(data[0].macro_etapa).toBe('EJECUCION');
  });

  test('MCP Tools - getPmoSummaryTool includes distribucion_macro_etapa', async () => {
    const res = await getPmoSummaryTool.handler({}, { isGlobal: true });
    expect(res).toHaveProperty('content');
    const data = JSON.parse(res.content[0].text);
    expect(data.resumen_proyectos).toHaveProperty('distribucion_macro_etapa');
    expect(data.resumen_proyectos.distribucion_macro_etapa).toHaveProperty('EJECUCION');
    expect(data.resumen_proyectos.distribucion_macro_etapa).toHaveProperty('INICIATIVA');
  });
});
