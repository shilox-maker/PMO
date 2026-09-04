const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Ambitos, UsuarioAmbitos, Proyectos, Sedes, EstadosProyecto } = require('../models');
const bcrypt = require('bcryptjs');

let readOnlyToken = '';
let adminToken = '';
let testProjectId = 'PRJ-2026-RO1';

beforeAll(async () => {
  process.env.AZURE_MOCK = 'true';
  process.env.JWT_SECRET = 'test_secret';

  await sequelize.sync({ force: true });

  const ambito = await Ambitos.create({
    id_ambito: 1,
    nombre: 'IT Corporate',
    code: 'IT_CORP',
    descripcion: 'Ámbito IT',
    activo: true
  });

  await Sedes.create({ id_sede: 1, nombre_sede: 'Sede Central' });
  await EstadosProyecto.create({ id_estado: 1, nombre_estado: 'En Progreso', icono: '🚀', orden: 1, proyecto_cerrado: false });

  const hash = await bcrypt.hash('Password123!', 10);
  const roUser = await Usuarios.create({
    nombre: 'Reader',
    apellidos: 'User',
    correo: 'readonly@dacsa.com',
    password: hash,
    perfil: 'SOLO_LECTURA',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });
  await UsuarioAmbitos.create({ id_usuario: roUser.id_usuario, id_ambito: 1, rol_ambito: 'MEMBER' });

  const admUser = await Usuarios.create({
    nombre: 'Admin',
    apellidos: 'Boss',
    correo: 'admin@dacsa.com',
    password: hash,
    perfil: 'ADMINISTRADOR',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });
  await UsuarioAmbitos.create({ id_usuario: admUser.id_usuario, id_ambito: 1, rol_ambito: 'MEMBER' });

  await Proyectos.create({
    id_proyecto: testProjectId,
    nombre_proyecto: 'Proyecto Test Solo Lectura',
    descripcion: 'Proyecto de prueba para SOLO_LECTURA',
    id_pm: admUser.id_usuario,
    id_sede: 1,
    id_estado: 1,
    id_ambito: 1,
    fecha_inicio: '2026-01-01',
    presupuesto_inicial: 10000,
    budget_inicial: 10000,
    activo: true
  });

  // Login both users
  const roLogin = await request(app).post('/api/login').send({ correo: 'readonly@dacsa.com', password: 'Password123!' });
  readOnlyToken = roLogin.body.token;

  const admLogin = await request(app).post('/api/login').send({ correo: 'admin@dacsa.com', password: 'Password123!' });
  adminToken = admLogin.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('SOLO_LECTURA Security Suite', () => {
  test('1. SOLO_LECTURA user can login and profile is SOLO_LECTURA', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${readOnlyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.perfil).toBe('SOLO_LECTURA');
  });

  test('2. SOLO_LECTURA can read projects (GET)', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${readOnlyToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('3. SOLO_LECTURA can read specific project details (GET)', async () => {
    const res = await request(app)
      .get(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${readOnlyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.nombre_proyecto).toBe('Proyecto Test Solo Lectura');
  });

  test('4. SOLO_LECTURA gets 403 Forbidden when creating project (POST)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send({ nombre_proyecto: 'Proyecto Prohibido', id_ambito: 1 });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Solo Lectura');
  });

  test('5. SOLO_LECTURA gets 403 Forbidden when modifying project (PUT)', async () => {
    const res = await request(app)
      .put(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send({ nombre_proyecto: 'Modificado Ilegalmente' });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Solo Lectura');
  });

  test('6. SOLO_LECTURA gets 403 Forbidden when deleting project (DELETE)', async () => {
    const res = await request(app)
      .delete(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${readOnlyToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Solo Lectura');
  });

  test('7. SOLO_LECTURA gets 403 Forbidden when posting comments or tasks', async () => {
    const commentRes = await request(app)
      .post(`/api/projects/${testProjectId}/comments`)
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send({ texto_comentario: 'Test comentario' });
    expect(commentRes.status).toBe(403);

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send({ id_proyecto: testProjectId, titulo_tarea: 'Test Tarea' });
    expect(taskRes.status).toBe(403);
  });

  test('8. SOLO_LECTURA can update own language preference (PATCH /users/me/language)', async () => {
    const res = await request(app)
      .patch('/api/users/me/language')
      .set('Authorization', `Bearer ${readOnlyToken}`)
      .send({ idioma: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.idioma).toBe('en');
  });

  test('9. Admin can still perform mutations', async () => {
    const res = await request(app)
      .put(`/api/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ objetivo_principal: 'Objetivo actualizado por Admin' });
    expect(res.status).toBe(200);
  });
});
