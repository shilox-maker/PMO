const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Proyectos, EstadosProyecto, Sedes, Proveedores, ContactosProveedor } = require('../models');
const bcrypt = require('bcryptjs');

let token = '';

beforeAll(async () => {
  // Sync memory DB
  await sequelize.sync({ force: true });

  // Create a test user
  const hash = await bcrypt.hash('Test_1234!', 10);
  await Usuarios.create({
    nombre: 'Test',
    apellidos: 'User',
    correo: 'test@dacsa.com',
    password: hash,
    perfil: 'ADMINISTRADOR',
    activo: true
  });

  // Create required foreign entities
  await Sedes.create({ nombre_sede: 'Sede Test' });
  await Proveedores.create({ nombre_razon_social: 'Proveedor Test' });
  await ContactosProveedor.create({ id_proveedor: 1, nombre: 'Sponsor', apellidos: 'Test', puesto: 'Sponsor', telefono: '123456789', email: 'sponsor@test.com' });

  // Create mock states
  await EstadosProyecto.create({ id_estado: 1, nombre_estado: 'En Progreso', icono: '🚀', orden: 1, proyecto_cerrado: false });

  // Create a mock project
  await Proyectos.create({
    id_proyecto: 'PRJ-2026-001',
    nombre_proyecto: 'Proyecto Test',
    descripcion: 'Desc',
    id_estado: 1,
    id_pm: 1,
    id_proveedor: 1,
    id_sede: 1,
    id_sponsor: 1,
    presupuesto_inicial: 10000,
    budget_inicial: 10000,
    fecha_inicio: '2026-01-01',
    fecha_fin_inicial: '2026-12-31',
    fecha_fin_estimada: '2026-12-31',
    indicador_rag: 'VERDE',
    pm_nombre: 'Test User'
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('API Endpoints', () => {
  it('should authenticate user and return token', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        correo: 'test@dacsa.com',
        password: 'Test_1234!'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should fail authentication with wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        correo: 'test@dacsa.com',
        password: 'wrong'
      });
    
    expect(res.statusCode).toEqual(401);
  });

  it('should fetch dashboard calculations', async () => {
    const res = await request(app)
      .get('/api/portfolio/dashboard')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].nombre_proyecto).toBe('Proyecto Test');
  });

  it('should fetch timeline data', async () => {
    const res = await request(app)
      .get('/api/timeline')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('fecha_inicio');
    expect(res.body[0]).toHaveProperty('hitos');
  });
  it('should create a milestone and automatically sync dates', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_proyecto: 'PRJ-2026-001',
        titulo_tarea: 'Hito Test',
        es_hito: true,
        fecha_original_cierre: '2026-06-30',
        fecha_actual_cierre: '2026-07-15',
        estado: 'PENDIENTE'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.fecha_original_cierre).toBe('2026-06-30');
    expect(res.body.fecha_actual_cierre).toBe('2026-07-15');
    expect(res.body.fecha_limite).toBe('2026-07-15'); // Synced to actual
    expect(res.body.fecha_real_cierre).toBeNull();
  });

  it('should automatically set fecha_real_cierre on milestone completion', async () => {
    // 1. Create a pending milestone
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_proyecto: 'PRJ-2026-001',
        titulo_tarea: 'Hito Completable',
        es_hito: true,
        fecha_original_cierre: '2026-06-30',
        fecha_actual_cierre: '2026-06-30',
        estado: 'PENDIENTE'
      });

    const taskId = createRes.body.id_tarea;

    // 2. Complete it
    const updateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        estado: 'COMPLETADA'
      });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.estado).toBe('COMPLETADA');
    expect(updateRes.body.fecha_real_cierre).not.toBeNull();
    expect(updateRes.body.fecha_real_cierre).toBe(new Date().toISOString().split('T')[0]);

    // 3. Revert to PENDIENTE
    const revertRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        estado: 'PENDIENTE'
      });

    expect(revertRes.statusCode).toEqual(200);
    expect(revertRes.body.estado).toBe('PENDIENTE');
    expect(revertRes.body.fecha_real_cierre).toBeNull();
  });

  it('should fail if invalid dates are sent', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_proyecto: 'PRJ-2026-001',
        titulo_tarea: 'Hito Malo',
        es_hito: true,
        fecha_original_cierre: 'invalid-date',
        fecha_actual_cierre: '2026-06-30',
        estado: 'PENDIENTE'
      });

    expect(res.statusCode).toEqual(400);
  });
});
