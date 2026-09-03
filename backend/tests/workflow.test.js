const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Proyectos, EstadosProyecto, Sedes, Proveedores, Workflows, WorkflowEstados, Ambitos } = require('../models');
const bcrypt = require('bcryptjs');

let adminToken = '';
let userToken = '';

beforeAll(async () => {
  process.env.AZURE_MOCK = 'true';
  process.env.JWT_SECRET = 'test_secret';

  await sequelize.sync({ force: true });

  const amb = await Ambitos.create({ id_ambito: 1, nombre: 'Global', code: 'GLB' });

  const hash = await bcrypt.hash('Test_1234!', 10);
  await Usuarios.create({
    nombre: 'Admin',
    apellidos: 'PMO',
    correo: 'admin@dacsa.com',
    password: hash,
    perfil: 'ADMINISTRADOR',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });

  await Usuarios.create({
    nombre: 'PM',
    apellidos: 'User',
    correo: 'pm@dacsa.com',
    password: hash,
    perfil: 'PM',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });

  await Sedes.create({ nombre_sede: 'Valencia' });
  await Proveedores.create({ nombre_razon_social: 'Socio Test' });

  // Create states
  await EstadosProyecto.create({ id_estado: 1, nombre_estado: 'Kickoff', icono: '🚀', orden: 1, proyecto_cerrado: false });
  await EstadosProyecto.create({ id_estado: 2, nombre_estado: 'Ejecución', icono: '⚙️', orden: 2, proyecto_cerrado: false });
  await EstadosProyecto.create({ id_estado: 3, nombre_estado: 'Cierre', icono: '🏁', orden: 3, proyecto_cerrado: true });
  await EstadosProyecto.create({ id_estado: 4, nombre_estado: 'Archivado', icono: '📦', orden: 4, proyecto_cerrado: true });

  // Login admin
  const adminRes = await request(app)
    .post('/api/login')
    .send({ correo: 'admin@dacsa.com', password: 'Test_1234!' });
  adminToken = adminRes.body.token;

  // Login PM
  const pmRes = await request(app)
    .post('/api/login')
    .send({ correo: 'pm@dacsa.com', password: 'Test_1234!' });
  userToken = pmRes.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Workflows & Workflow States API', () => {
  let createdWorkflowId = null;
  let createdProjectId = null;

  test('POST /api/admin/workflows - Admin should create a new workflow', async () => {
    const res = await request(app)
      .post('/api/admin/workflows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Flujo Rápido (Fast Track)',
        code: 'FAST_TRACK',
        descripcion: 'Flujo para proyectos ágiles',
        activo: true,
        is_default: true,
        states: [
          { id_estado: 1, orden: 1 },
          { id_estado: 3, orden: 2 }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.nombre).toBe('Flujo Rápido (Fast Track)');
    expect(res.body.code).toBe('FAST_TRACK');
    expect(res.body.is_default).toBe(true);
    expect(res.body.Estados).toHaveLength(2);
    createdWorkflowId = res.body.id;
  });

  test('GET /api/admin/workflows - Admin should list all workflows with state counts and associations', async () => {
    const res = await request(app)
      .get('/api/admin/workflows')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const wf = res.body.find(w => w.id === createdWorkflowId);
    expect(wf).toBeDefined();
    expect(wf.Estados).toHaveLength(2);
  });

  test('PUT /api/admin/workflows/:id/states - Admin should update state sequence and add new state', async () => {
    const res = await request(app)
      .put(`/api/admin/workflows/${createdWorkflowId}/states`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        states: [
          { id_estado: 1, orden: 1 },
          { id_estado: 2, orden: 2 },
          { id_estado: 3, orden: 3 }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.Estados).toHaveLength(3);
    expect(res.body.Estados[0].id_estado).toBe(1);
    expect(res.body.Estados[1].id_estado).toBe(2);
    expect(res.body.Estados[2].id_estado).toBe(3);
  });

  test('GET /api/portfolio/workflows - Authenticated user should get active workflows for portfolio', async () => {
    const res = await request(app)
      .get('/api/portfolio/workflows')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const wf = res.body.find(w => w.id === createdWorkflowId);
    expect(wf).toBeDefined();
    expect(wf.Estados).toHaveLength(3);
  });

  test('POST /api/projects - Should create a project with workflow and resolve to valid initial state', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre_proyecto: 'Proyecto Fast Track Demo',
        descripcion: 'Demostración de flujo ágil',
        id_workflow: createdWorkflowId,
        id_estado: 1,
        id_pm: 2,
        id_sede: 1,
        id_ambito: 1,
        id_proveedor: 1,
        budget_inicial: 50000,
        fecha_inicio: '2026-02-01',
        fecha_fin_inicial: '2026-06-30'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.id_workflow).toBe(createdWorkflowId);
    expect(res.body.id_estado).toBe(1);
    createdProjectId = res.body.id_proyecto;
  });

  test('PUT /api/projects/:id - Should reject moving to a state not in the project workflow', async () => {
    // State 4 ('Archivado') is not in the Fast Track workflow
    const res = await request(app)
      .put(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_estado: 4
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/no pertenece al flujo/i);
  });

  test('PUT /api/projects/:id - Should allow moving to a valid state in the workflow', async () => {
    const res = await request(app)
      .put(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_estado: 2
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.id_estado).toBe(2);
  });

  test('DELETE /api/admin/workflows/:id - Should block deleting a workflow in use by projects', async () => {
    const res = await request(app)
      .delete(`/api/admin/workflows/${createdWorkflowId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/No se puede eliminar.*asociados/i);
  });
});
