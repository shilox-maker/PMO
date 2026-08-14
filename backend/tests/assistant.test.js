const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Proyectos, Tareas, PlanesComunicacion, Sedes, EstadosProyecto } = require('../models/index');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

describe('Assistant Controller API', () => {
  let token;
  let pmUser;
  let testProject;
  let testSede;
  let testEstado;

  beforeAll(async () => {
    await sequelize.sync();

    pmUser = await Usuarios.create({
      nombre: 'Test',
      apellidos: 'Assistant',
      correo: `test_assistant_${Date.now()}@pmo.com`,
      password: 'password123',
      perfil: 'ADMINISTRADOR',
      activo: true
    });

    token = jwt.sign({ id_usuario: pmUser.id_usuario }, JWT_SECRET);

    [testSede] = await Sedes.findOrCreate({
      where: { nombre_sede: 'Sede Test Assistant' }
    });

    [testEstado] = await EstadosProyecto.findOrCreate({
      where: { id_estado: 999 },
      defaults: { nombre_estado: 'En Ejecución', icono: '🚀', orden: 1, proyecto_cerrado: false }
    });

    const prjId = `PRJ-AST-${Date.now()}`;
    testProject = await Proyectos.create({
      id_proyecto: prjId,
      nombre_proyecto: 'Proyecto Asistente Test',
      descripcion: 'Descripción del proyecto de prueba para el asistente',
      id_pm: pmUser.id_usuario,
      id_sede: testSede.id_sede,
      id_estado: testEstado.id_estado,
      fecha_inicio: '2026-08-01',
      estado_proyecto: 'En Ejecución'
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Tareas.create({
      id_proyecto: testProject.id_proyecto,
      titulo_tarea: 'Tarea Asistente Pendiente',
      estado: 'SIN INICIAR',
      fecha_limite: tomorrow
    });

    await PlanesComunicacion.create({
      id_proyecto: testProject.id_proyecto,
      titulo: 'Plan Comunicacion Semanal Test',
      periodicidad: 'semanal',
      dia_semana: 1,
      activo: true
    });
  });

  afterAll(async () => {
    if (testProject) {
      await Tareas.destroy({ where: { id_proyecto: testProject.id_proyecto } });
      await PlanesComunicacion.destroy({ where: { id_proyecto: testProject.id_proyecto } });
      await Proyectos.destroy({ where: { id_proyecto: testProject.id_proyecto } });
    }
    if (pmUser) {
      await Usuarios.destroy({ where: { id_usuario: pmUser.id_usuario } });
    }
  });

  it('GET /api/assistant/pending debe retornar las tareas y comunicaciones del gestor PM', async () => {
    const res = await request(app)
      .get('/api/assistant/pending?days=7')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalPendingCount');
    expect(res.body.totalPendingCount).toBeGreaterThan(0);
    expect(Array.isArray(res.body.projects)).toBe(true);

    const projectItem = res.body.projects.find(p => p.id_proyecto === testProject.id_proyecto);
    expect(projectItem).toBeDefined();
    expect(projectItem.tareas.length).toBeGreaterThan(0);
    expect(projectItem.planesComunicacion.length).toBeGreaterThan(0);
  });
});
