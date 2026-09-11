const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Ambitos, UsuarioAmbitos, Proyectos, Sedes, EstadosProyecto, ComentariosProyecto, Tareas } = require('../models');
const bcrypt = require('bcryptjs');

let pmToken = '';
const testProjectId = 'PRJ-2026-IMP-TEST';
let pmUserId;

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

  const pmUser = await Usuarios.create({
    nombre: 'Pedro',
    apellidos: 'PM',
    correo: 'pm_imp@dacsa.com',
    password: hash,
    perfil: 'PM',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });
  pmUserId = pmUser.id_usuario;
  await UsuarioAmbitos.create({ id_usuario: pmUserId, id_ambito: 1, rol_ambito: 'MEMBER' });

  const loginRes = await request(app)
    .post('/api/login')
    .send({ correo: 'pm_imp@dacsa.com', password: 'Password123!' });
  pmToken = loginRes.body.token;

  await Proyectos.create({
    id_proyecto: testProjectId,
    nombre_proyecto: 'Proyecto Test Comentario Importante',
    descripcion: 'Test de filtrado de último comentario importante',
    id_pm: pmUserId,
    id_sede: 1,
    id_estado: 1,
    id_ambito: 1,
    fecha_inicio: '2026-01-01',
    fecha_fin_inicial: '2026-12-31'
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Último comentario en proyectos debe ser el más reciente marcado como importante', () => {
  test('1. Proyecto sin comentarios tiene ultimo_comentario vacío', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    const p = res.body.find(item => item.id_proyecto === testProjectId);
    expect(p).toBeDefined();
    expect(p.ultimo_comentario).toBe('');
  });

  test('2. Comentario ordinario (es_importante: false) NO se asigna como ultimo_comentario', async () => {
    await request(app)
      .post(`/api/projects/${testProjectId}/comments`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        texto_comentario: '<p>Comentario ordinario 1</p>',
        es_importante: false
      });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    const p = res.body.find(item => item.id_proyecto === testProjectId);
    expect(p.ultimo_comentario).toBe('');
  });

  test('3. Comentario importante (es_importante: true) SÍ se asigna como ultimo_comentario', async () => {
    await request(app)
      .post(`/api/projects/${testProjectId}/comments`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        texto_comentario: '<p><strong>Hito Crítico</strong>: Revisión completada con éxito</p>',
        es_importante: true
      });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    const p = res.body.find(item => item.id_proyecto === testProjectId);
    expect(p.ultimo_comentario).toBe('Hito Crítico: Revisión completada con éxito');
  });

  test('4. Comentario ordinario posterior más reciente NO sobreescribe el comentario importante previo', async () => {
    await request(app)
      .post(`/api/projects/${testProjectId}/comments`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        texto_comentario: '<p>Comentario ordinario reciente posterior</p>',
        es_importante: false
      });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    const p = res.body.find(item => item.id_proyecto === testProjectId);
    expect(p.ultimo_comentario).toBe('Hito Crítico: Revisión completada con éxito');
  });

  test('5. Nuevo comentario importante sustituye al importante anterior', async () => {
    await request(app)
      .post(`/api/projects/${testProjectId}/comments`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        texto_comentario: '<p>Nuevo aviso crítico de dirección</p>',
        es_importante: true
      });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    const p = res.body.find(item => item.id_proyecto === testProjectId);
    expect(p.ultimo_comentario).toBe('Nuevo aviso crítico de dirección');
  });

  test('6. En /api/portfolio/dashboard también se refleja el último comentario importante', async () => {
    const res = await request(app)
      .get('/api/portfolio/dashboard')
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    const projects = Array.isArray(res.body) ? res.body : res.body.projects;
    const p = projects.find(item => item.id_proyecto === testProjectId);
    expect(p).toBeDefined();
    expect(p.ultimo_comentario).toBe('Nuevo aviso crítico de dirección');
  });

  test('7. Próximo hito se calcula correctamente para tareas con estado SIN INICIAR o EN CURSO', async () => {
    // Inicialmente no hay hitos
    let res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`);
    let p = res.body.find(item => item.id_proyecto === testProjectId);
    expect(p.nextMilestone).toBeNull();

    // Crear un hito con estado SIN INICIAR
    await Tareas.create({
      id_proyecto: testProjectId,
      titulo_tarea: 'Análisis / Consultoría',
      descripcion: 'Hito inicial',
      es_hito: true,
      estado: 'SIN INICIAR',
      fecha_limite: '2026-09-12'
    });

    // Crear un segundo hito posterior con estado EN CURSO
    await Tareas.create({
      id_proyecto: testProjectId,
      titulo_tarea: 'Certificación e Integración',
      descripcion: 'Hito secundario',
      es_hito: true,
      estado: 'EN CURSO',
      fecha_limite: '2026-09-15'
    });

    res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`);
    p = res.body.find(item => item.id_proyecto === testProjectId);
    expect(p.nextMilestone).toBeDefined();
    expect(p.nextMilestone.titulo_tarea).toBe('Análisis / Consultoría');
    expect(p.nextMilestone.fecha_limite).toBe('2026-09-12');

    // También en /api/portfolio/dashboard
    const dashRes = await request(app)
      .get('/api/portfolio/dashboard')
      .set('Authorization', `Bearer ${pmToken}`);
    const dashProjects = Array.isArray(dashRes.body) ? dashRes.body : dashRes.body.projects;
    const dashProj = dashProjects.find(item => item.id_proyecto === testProjectId);
    expect(dashProj.proximo_hito).toBeDefined();
    expect(dashProj.proximo_hito.titulo_tarea).toBe('Análisis / Consultoría');
  });

  test('8. Si el primer hito se completa (COMPLETADA), el próximo hito avanza al siguiente pendiente', async () => {
    const task1 = await Tareas.findOne({ where: { id_proyecto: testProjectId, titulo_tarea: 'Análisis / Consultoría' } });
    await task1.update({ estado: 'COMPLETADA' });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`);
    const p = res.body.find(item => item.id_proyecto === testProjectId);
    expect(p.nextMilestone).toBeDefined();
    expect(p.nextMilestone.titulo_tarea).toBe('Certificación e Integración');
    expect(p.nextMilestone.fecha_limite).toBe('2026-09-15');
  });
});
