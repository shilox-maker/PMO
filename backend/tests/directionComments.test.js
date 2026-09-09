const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Ambitos, UsuarioAmbitos, Proyectos, Sedes, EstadosProyecto, ComentariosProyecto, ComentariosDireccionProyecto } = require('../models');
const bcrypt = require('bcryptjs');

let pmToken = '';
let directorToken = '';
let adminToken = '';
let testProjectId = 'PRJ-2026-DIR1';
let pmUserId;
let directorUserId;
let adminUserId;

beforeAll(async () => {
  process.env.AZURE_MOCK = 'true';
  process.env.JWT_SECRET = 'test_secret';

  await sequelize.sync({ force: true });

  await Ambitos.create({
    id_ambito: 1,
    nombre: 'IT Corporate',
    code: 'IT_CORP',
    descripcion: 'Ámbito IT',
    activo: true
  });

  await Sedes.create({ id_sede: 1, nombre_sede: 'Sede Central' });
  await EstadosProyecto.create({ id_estado: 1, nombre_estado: 'En Progreso', icono: '🚀', orden: 1, proyecto_cerrado: false });

  const hash = await bcrypt.hash('Password123!', 10);

  // 1. PM User
  const pmUser = await Usuarios.create({
    nombre: 'Pedro',
    apellidos: 'PM',
    correo: 'pm@dacsa.com',
    password: hash,
    perfil: 'PM',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });
  pmUserId = pmUser.id_usuario;
  await UsuarioAmbitos.create({ id_usuario: pmUserId, id_ambito: 1, rol_ambito: 'MEMBER' });

  // 2. Director User
  const dirUser = await Usuarios.create({
    nombre: 'Diana',
    apellidos: 'Directora',
    correo: 'director@dacsa.com',
    password: hash,
    perfil: 'DIRECTOR',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });
  directorUserId = dirUser.id_usuario;
  await UsuarioAmbitos.create({ id_usuario: directorUserId, id_ambito: 1, rol_ambito: 'LEADER' });

  // 3. Admin User
  const admUser = await Usuarios.create({
    nombre: 'Andres',
    apellidos: 'Admin',
    correo: 'admin@dacsa.com',
    password: hash,
    perfil: 'ADMINISTRADOR',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });
  adminUserId = admUser.id_usuario;
  await UsuarioAmbitos.create({ id_usuario: adminUserId, id_ambito: 1, rol_ambito: 'LEADER' });

  await Proyectos.create({
    id_proyecto: testProjectId,
    nombre_proyecto: 'Proyecto Confidencial Dirección',
    descripcion: 'Proyecto de prueba para muro de dirección',
    id_pm: pmUserId,
    id_sede: 1,
    id_estado: 1,
    id_ambito: 1,
    fecha_inicio: '2026-01-01',
    presupuesto_inicial: 10000,
    budget_inicial: 10000
  });

  // Login PM
  const pmLogin = await request(app)
    .post('/api/login')
    .send({ correo: 'pm@dacsa.com', password: 'Password123!' });
  pmToken = pmLogin.body.token;

  // Login Director
  const dirLogin = await request(app)
    .post('/api/login')
    .send({ correo: 'director@dacsa.com', password: 'Password123!' });
  directorToken = dirLogin.body.token;

  // Login Admin
  const admLogin = await request(app)
    .post('/api/login')
    .send({ correo: 'admin@dacsa.com', password: 'Password123!' });
  adminToken = admLogin.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Seguridad y Funcionamiento del Muro de Dirección', () => {
  let createdDirCommentId;

  test('1. Rol PM NO debe tener acceso a consultar comentarios de dirección (403)', async () => {
    const res = await request(app)
      .get(`/api/projects/${testProjectId}/direction-comments`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Acceso denegado/i);
  });

  test('2. Rol PM NO debe poder crear comentarios de dirección (403)', async () => {
    const res = await request(app)
      .post('/api/direction-comments')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        id_proyecto: testProjectId,
        texto_comentario: 'Intento de nota no autorizada por PM',
        es_importante: true
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Acceso denegado/i);
  });

  test('3. Rol DIRECTOR puede crear una nota en el muro de dirección (201)', async () => {
    const res = await request(app)
      .post('/api/direction-comments')
      .set('Authorization', `Bearer ${directorToken}`)
      .send({
        id_proyecto: testProjectId,
        texto_comentario: '<p>Decisión estratégica de Steering Committee</p>',
        es_importante: true
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id_comentario');
    expect(res.body.texto_comentario).toContain('Decisión estratégica');
    expect(res.body.Autor).toBeDefined();
    expect(res.body.Autor.nombre).toBe('Diana');
    createdDirCommentId = res.body.id_comentario;
  });

  test('4. Rol DIRECTOR puede listar las notas de dirección del proyecto (200)', async () => {
    const res = await request(app)
      .get(`/api/projects/${testProjectId}/direction-comments`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id_comentario).toBe(createdDirCommentId);
  });

  test('5. El muro ordinario (GET /comments) NO incluye notas de dirección', async () => {
    // Publicar comentario ordinario
    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        id_proyecto: testProjectId,
        texto_comentario: '<p>Avance semanal PM ordinario</p>',
        es_importante: false
      });

    const res = await request(app)
      .get(`/api/projects/${testProjectId}/comments`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].texto_comentario).toContain('Avance semanal PM');
    expect(res.body[0].texto_comentario).not.toContain('Decisión estratégica');
  });

  test('6. Rol ADMINISTRADOR puede editar una nota de dirección con auditoría', async () => {
    const res = await request(app)
      .put(`/api/direction-comments/${createdDirCommentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        texto_comentario: '<p>Decisión estratégica (Aprobada por Admin)</p>',
        es_importante: true
      });

    expect(res.status).toBe(200);
    expect(res.body.editado).toBe(true);
    expect(res.body.id_usuario_modificacion).toBe(adminUserId);
    expect(res.body.Editor.nombre).toBe('Andres');
  });

  test('7. Rol PM NO puede eliminar notas de dirección (403)', async () => {
    const res = await request(app)
      .delete(`/api/direction-comments/${createdDirCommentId}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(403);
  });

  test('8. Rol DIRECTOR puede eliminar la nota de dirección (200)', async () => {
    const res = await request(app)
      .delete(`/api/direction-comments/${createdDirCommentId}`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminado con éxito/i);

    const listRes = await request(app)
      .get(`/api/projects/${testProjectId}/direction-comments`)
      .set('Authorization', `Bearer ${directorToken}`);

    expect(listRes.body.length).toBe(0);
  });
});
