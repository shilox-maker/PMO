const request = require('supertest');
const app = require('../server');
const { 
  sequelize, Usuarios, Ambitos, UsuarioAmbitos, Proyectos, EstadosProyecto, 
  Sedes, Proveedores, ContactosProveedor, Workflows, WorkflowEstados 
} = require('../models');
const bcrypt = require('bcryptjs');

let adminToken = '';
let pmToken = '';
let adminUser = null;
let pmUser = null;

beforeAll(async () => {
  process.env.AZURE_MOCK = 'true';
  process.env.JWT_SECRET = 'test_secret';

  await sequelize.sync({ force: true });

  // 1. Crear Ámbitos
  const ambito1 = await Ambitos.create({
    id_ambito: 1,
    nombre: 'IT Corporate',
    code: 'IT_CORP',
    descripcion: 'Ámbito IT',
    activo: true
  });

  const ambito2 = await Ambitos.create({
    id_ambito: 2,
    nombre: 'Operaciones',
    code: 'OPERACIONES',
    descripcion: 'Ámbito Operaciones',
    activo: true
  });

  const ambitoInactivo = await Ambitos.create({
    id_ambito: 3,
    nombre: 'Inactivo',
    code: 'INACTIVO',
    descripcion: 'Ámbito Inactivo',
    activo: false
  });

  // 2. Crear Usuarios
  const hash = await bcrypt.hash('Admin_1234!', 10);
  adminUser = await Usuarios.create({
    nombre: 'Admin',
    apellidos: 'Security',
    correo: 'admin.sec@dacsa.com',
    password: hash,
    perfil: 'ADMINISTRADOR',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });
  await UsuarioAmbitos.create({ id_usuario: adminUser.id_usuario, id_ambito: 1, rol_ambito: 'MEMBER' });
  await UsuarioAmbitos.create({ id_usuario: adminUser.id_usuario, id_ambito: 2, rol_ambito: 'MEMBER' });

  pmUser = await Usuarios.create({
    nombre: 'PM',
    apellidos: 'Scoped',
    correo: 'pm.scoped@dacsa.com',
    password: hash,
    perfil: 'PM',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });
  // El PM sólo tiene acceso al Ámbito 1
  await UsuarioAmbitos.create({ id_usuario: pmUser.id_usuario, id_ambito: 1, rol_ambito: 'MEMBER' });

  // 3. Crear Entidades auxiliares
  await Sedes.create({ id_sede: 1, nombre_sede: 'Sede Central' });
  await Proveedores.create({ id_proveedor: 1, nombre_razon_social: 'Proveedor IT' });
  await ContactosProveedor.create({ id_proveedor: 1, nombre: 'Sponsor', apellidos: 'PMO', puesto: 'Director', telefono: '123456789', email: 'sponsor@dacsa.com' });
  await EstadosProyecto.create({ id_estado: 1, nombre_estado: 'En Progreso', icono: '🚀', orden: 1, proyecto_cerrado: false });
  const wf = await Workflows.create({ id: 1, nombre: 'Flujo Estándar', is_default: true, activo: true });
  await WorkflowEstados.create({ id_workflow: wf.id, id_estado: 1, orden: 1 });

  // 4. Crear Proyectos de prueba
  await Proyectos.create({
    id_proyecto: 'PRJ-2026-101',
    nombre_proyecto: 'Proyecto Scope 1',
    descripcion: 'Proyecto en Ambito 1',
    id_estado: 1,
    id_workflow: 1,
    id_pm: pmUser.id_usuario,
    id_proveedor: 1,
    id_sede: 1,
    id_ambito: 1,
    presupuesto_inicial: 10000,
    budget_inicial: 10000,
    fecha_inicio: '2026-01-01',
    indicador_rag: 'VERDE'
  });

  await Proyectos.create({
    id_proyecto: 'PRJ-2026-102',
    nombre_proyecto: 'Proyecto Scope 2',
    descripcion: 'Proyecto en Ambito 2',
    id_estado: 1,
    id_workflow: 1,
    id_pm: pmUser.id_usuario, // Asignado a pmUser pero en ámbito 2 al que no tiene acceso
    id_proveedor: 1,
    id_sede: 1,
    id_ambito: 2,
    presupuesto_inicial: 20000,
    budget_inicial: 20000,
    fecha_inicio: '2026-01-01',
    indicador_rag: 'VERDE'
  });

  // 5. Autenticar
  const loginAdmin = await request(app).post('/api/login').send({ correo: 'admin.sec@dacsa.com', password: 'Admin_1234!' });
  adminToken = loginAdmin.body.token;

  const loginPm = await request(app).post('/api/login').send({ correo: 'pm.scoped@dacsa.com', password: 'Admin_1234!' });
  pmToken = loginPm.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('BUG-13 Security Tests: Gestión y Segregación de Ámbitos', () => {

  describe('(a) Scope Middleware Fail-Closed & Logging', () => {
    it('debe rechazar con 403 a un PM que solicita Vista Global ("ALL")', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', 'ALL');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acceso denegado');
    });

    it('debe rechazar con 403 a un PM que solicita un ámbito no autorizado ("2")', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', '2');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acceso denegado');
    });

    it('debe rechazar con 404 cuando se solicita un ámbito inexistente ("9999")', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', '9999');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('no existe o está inactivo');
    });

    it('debe rechazar con 404 cuando se solicita un ámbito inactivo ("3")', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Ambito-Id', '3');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('no existe o está inactivo');
    });

    it('debe permitir a un PM acceder a su ámbito autorizado ("1")', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', '1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('debe permitir a un Administrador acceder a Vista Global ("ALL")', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Ambito-Id', 'ALL');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('(b) Validación de Ámbito en createProject y updateProject', () => {
    it('debe rechazar con 403 a un PM que intenta crear un proyecto en un ámbito ajeno (id_ambito: 2)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .send({
          nombre_proyecto: 'Proyecto Hacker',
          descripcion: 'Intento de creación en ámbito ajeno',
          id_pm: pmUser.id_usuario,
          id_sede: 1,
          id_ambito: 2,
          fecha_inicio: '2026-03-01'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acceso denegado');
    });

    it('debe rechazar con 400 al intentar crear un proyecto con un ámbito inexistente (id_ambito: 9999)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre_proyecto: 'Proyecto Fantasma',
          descripcion: 'Ámbito que no existe',
          id_pm: adminUser.id_usuario,
          id_sede: 1,
          id_ambito: 9999,
          fecha_inicio: '2026-03-01'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('no existe o está inactivo');
    });

    it('debe permitir al PM crear un proyecto en su ámbito autorizado (id_ambito: 1)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', '1')
        .send({
          id_proyecto: 'PRJ-2026-103',
          nombre_proyecto: 'Proyecto Legítimo PM',
          descripcion: 'Creación autorizada',
          id_pm: pmUser.id_usuario,
          id_sede: 1,
          id_ambito: 1,
          fecha_inicio: '2026-03-01'
        });

      expect(res.status).toBe(201);
      expect(res.body.id_ambito).toBe(1);
    });

    it('debe rechazar con 403 a un PM que intenta modificar un proyecto de un ámbito ajeno (PRJ-2026-102 en ámbito 2)', async () => {
      const res = await request(app)
        .put('/api/projects/PRJ-2026-102')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', '1')
        .send({
          nombre_proyecto: 'Proyecto Modificado Ilegal'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acceso denegado');
    });

    it('debe rechazar con 403 a un PM que intenta mover su proyecto a un ámbito ajeno (id_ambito: 2)', async () => {
      const res = await request(app)
        .put('/api/projects/PRJ-2026-101')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', '1')
        .send({
          id_ambito: 2
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acceso denegado');
    });
  });

  describe('(c) Validación de Ámbito en deleteProject', () => {
    it('debe rechazar con 403 a un PM que intenta eliminar un proyecto en un ámbito ajeno', async () => {
      const res = await request(app)
        .delete('/api/projects/PRJ-2026-102')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', '1');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Acceso denegado');
    });

    it('debe permitir al PM eliminar su proyecto en su ámbito autorizado', async () => {
      const res = await request(app)
        .delete('/api/projects/PRJ-2026-103')
        .set('Authorization', `Bearer ${pmToken}`)
        .set('X-Ambito-Id', '1');

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('eliminado con éxito');
    });
  });

  describe('(d) Validación de Existencia de Ámbitos en Asignación de Usuarios', () => {
    it('updateUserAmbitos debe rechazar con 400 si se envían IDs de ámbito inexistentes', async () => {
      const res = await request(app)
        .put(`/api/ambitos/usuarios/${pmUser.id_usuario}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ambitosIds: [1, 9999]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('no existen');
    });

    it('createUser debe rechazar con 400 si se indican ámbitos inexistentes', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Nuevo',
          apellidos: 'Inexistente',
          correo: 'fake.ambito@dacsa.com',
          password: 'Password_1234!',
          perfil: 'PM',
          activo: true,
          ambitos: [8888]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('no existen');
    });

    it('updateUser debe rechazar con 400 si se indican ámbitos inexistentes', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${pmUser.id_usuario}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ambitos: [7777]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('no existen');
    });

    it('updateUserAmbitos debe permitir asignar ámbitos reales válidos', async () => {
      const res = await request(app)
        .put(`/api/ambitos/usuarios/${pmUser.id_usuario}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ambitosIds: [1, 2]
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('actualizados correctamente');
    });
  });
});
