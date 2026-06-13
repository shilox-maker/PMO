const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Proyectos, EstadosProyecto, Sedes, Proveedores, KeyUsers } = require('../models');
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
  await KeyUsers.create({ id_proveedor_empresa: 1, nombre: 'Sponsor', apellidos: 'Test', correo: 'sponsor@test.com' });

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
    id_sponsor_ku: 1,
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
});
