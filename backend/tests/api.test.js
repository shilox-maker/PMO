const request = require('supertest');
const app = require('../server');
const { sequelize, Usuarios, Proyectos, EstadosProyecto, Sedes, Proveedores, ContactosProveedor, Workflows, WorkflowEstados, Tags } = require('../models');
const bcrypt = require('bcryptjs');

let token = '';

beforeAll(async () => {
  process.env.AZURE_MOCK = 'true';
  process.env.JWT_SECRET = 'test_secret';
  
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
    activo: true,
    metodo_acceso: 'PASSWORD'
  });

  // Create a test user for Entra ID
  await Usuarios.create({
    nombre: 'Azure',
    apellidos: 'Test',
    correo: 'azure-test@dacsa.com',
    password: hash,
    perfil: 'PM',
    activo: true,
    metodo_acceso: 'ENTRA_ID'
  });

  // Create required foreign entities
  await Sedes.create({ nombre_sede: 'Sede Test' });
  await Proveedores.create({ nombre_razon_social: 'Proveedor Test' });
  await ContactosProveedor.create({ id_proveedor: 1, nombre: 'Sponsor', apellidos: 'Test', puesto: 'Sponsor', telefono: '123456789', email: 'sponsor@test.com' });

  // Create mock states
  await EstadosProyecto.create({ id_estado: 1, nombre_estado: 'En Progreso', icono: '🚀', orden: 1, proyecto_cerrado: false });

  // Create default workflow
  const wf = await Workflows.create({ nombre: 'Flujo Estándar', is_default: true, activo: true });
  await WorkflowEstados.create({ id_workflow: wf.id, id_estado: 1, orden: 1 });

  // Create a mock project
  await Proyectos.create({
    id_proyecto: 'PRJ-2026-001',
    nombre_proyecto: 'Proyecto Test',
    descripcion: 'Desc',
    id_estado: 1,
    id_workflow: wf.id,
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
        estado: 'SIN INICIAR'
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
        estado: 'SIN INICIAR'
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

    // 3. Revert to SIN INICIAR
    const revertRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        estado: 'SIN INICIAR'
      });

    expect(revertRes.statusCode).toEqual(200);
    expect(revertRes.body.estado).toBe('SIN INICIAR');
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
        estado: 'SIN INICIAR'
      });

    expect(res.statusCode).toEqual(400);
  });

  // Azure AD (Entra ID) authentication tests
  describe('Azure AD (Entra ID) Authentication', () => {
    it('should authenticate Entra ID user and return local token', async () => {
      const res = await request(app)
        .post('/api/login/azure')
        .send({
          token: 'mock-token-azure-test' // Mock token will resolve to azure-test@dacsa.com
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.correo).toBe('azure-test@dacsa.com');
    });

    it('should fail traditional password login for Entra ID users', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          correo: 'azure-test@dacsa.com',
          password: 'Test_1234!'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toContain('Microsoft Entra ID');
    });

    it('should fail Azure login for traditional password users', async () => {
      const res = await request(app)
        .post('/api/login/azure')
        .send({
          token: 'mock-token-test' // Mock token resolves to test@dacsa.com
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toContain('contraseña local');
    });
  });

  describe('Project Update and Progress', () => {
    it('should update and persist avance_porcentaje successfully', async () => {
      const res = await request(app)
        .put('/api/projects/PRJ-2026-001')
        .set('Authorization', `Bearer ${token}`)
        .send({
          avance_porcentaje: 65
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.avance_porcentaje).toBe(65);

      // Verify persistence with GET
      const getRes = await request(app)
        .get('/api/projects/PRJ-2026-001')
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.statusCode).toEqual(200);
      expect(getRes.body.avance_porcentaje).toBe(65);
    });
  });

  describe('Project Search by Tags and Text', () => {
    it('should find projects by associated tag in projects list, global search and dashboard', async () => {
      // 1. Create a tag and associate to test project
      const testTag = await Tags.create({ nombre: 'SAP-2026' });
      const project = await Proyectos.findByPk('PRJ-2026-001');
      await project.setTags([testTag]);

      // 2. Search in /api/projects?search=SAP-2026
      const resProjects = await request(app)
        .get('/api/projects?search=SAP-2026')
        .set('Authorization', `Bearer ${token}`);
      expect(resProjects.statusCode).toEqual(200);
      expect(Array.isArray(resProjects.body)).toBe(true);
      expect(resProjects.body.length).toBeGreaterThanOrEqual(1);
      expect(resProjects.body.some(p => p.id_proyecto === 'PRJ-2026-001')).toBe(true);

      // 3. Search in /api/search/global?q=SAP-2026
      const resGlobal = await request(app)
        .get('/api/search/global?q=SAP-2026')
        .set('Authorization', `Bearer ${token}`);
      expect(resGlobal.statusCode).toEqual(200);
      expect(Array.isArray(resGlobal.body.projects)).toBe(true);
      expect(resGlobal.body.projects.some(p => p.id_proyecto === 'PRJ-2026-001')).toBe(true);

      // 4. Search in /api/portfolio/dashboard?search=SAP-2026
      const resDash = await request(app)
        .get('/api/portfolio/dashboard?search=SAP-2026')
        .set('Authorization', `Bearer ${token}`);
      expect(resDash.statusCode).toEqual(200);
      const dashProjects = Array.isArray(resDash.body) ? resDash.body : resDash.body.projects;
      expect(dashProjects.some(p => p.id_proyecto === 'PRJ-2026-001')).toBe(true);

      // 5. Search for non-existent tag should return 0 results
      const resNone = await request(app)
        .get('/api/projects?search=TAG_INEXISTENTE_999')
        .set('Authorization', `Bearer ${token}`);
      expect(resNone.statusCode).toEqual(200);
      expect(resNone.body.length).toBe(0);
    });
  });

  describe('Project Deletion', () => {
    it('should delete a project successfully when authorized', async () => {
      const res = await request(app)
        .delete('/api/projects/PRJ-2026-001')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Proyecto eliminado con éxito');

      // Verify it's gone
      const verifyRes = await request(app)
        .get('/api/projects/PRJ-2026-001')
        .set('Authorization', `Bearer ${token}`);
      expect(verifyRes.statusCode).toEqual(404);
    });

    it('should fail to delete a project if not found', async () => {
      const res = await request(app)
        .delete('/api/projects/PRJ-NONEXISTENT')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('Vendor & Contact Management (IDEA-80)', () => {
    let createdContactId = null;

    it('should update vendor general info', async () => {
      const res = await request(app)
        .put('/api/vendors/1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre_razon_social: 'Proveedor Test Actualizado',
          telefono_general: '961234567',
          email_general: 'contacto@proveedortest.com',
          es_grupo_dacsa: true
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.nombre_razon_social).toBe('Proveedor Test Actualizado');
      expect(res.body.telefono_general).toBe('961234567');
      expect(res.body.email_general).toBe('contacto@proveedortest.com');
      expect(res.body.es_grupo_dacsa).toBe(true);
    });

    it('should create a new vendor contact', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id_proveedor: 1,
          nombre: 'Juan',
          apellidos: 'García',
          puesto: 'Lead Tech',
          telefono: '600111222',
          email: 'jgarcia@proveedortest.com'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.nombre).toBe('Juan');
      expect(res.body.id_contacto).toBeDefined();
      createdContactId = res.body.id_contacto;
    });

    it('should update an existing contact (PUT /api/contacts/:id_contacto)', async () => {
      const res = await request(app)
        .put(`/api/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Juan Carlos',
          apellidos: 'García Pérez',
          puesto: 'Director Técnico',
          telefono: '600999888',
          email: 'jcgarcia@proveedortest.com'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.nombre).toBe('Juan Carlos');
      expect(res.body.apellidos).toBe('García Pérez');
      expect(res.body.puesto).toBe('Director Técnico');
      expect(res.body.telefono).toBe('600999888');
      expect(res.body.email).toBe('jcgarcia@proveedortest.com');
    });

    it('should delete a contact successfully', async () => {
      const res = await request(app)
        .delete(`/api/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Contacto eliminado con éxito');
    });

    it('should return 404 when updating non-existent contact', async () => {
      const res = await request(app)
        .put('/api/contacts/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'Fantasma',
          apellidos: 'Nadie',
          puesto: 'Ninguno',
          telefono: '000',
          email: 'fantasma@test.com'
        });

      expect(res.statusCode).toEqual(404);
    });

    it('should create a partner without general phone', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre_razon_social: 'Partner Sin Telefono S.L.',
          email_general: 'info@partner-sin-tel.com'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.nombre_razon_social).toBe('Partner Sin Telefono S.L.');
      expect(res.body.telefono_general).toBeNull();
    });

    it('should create a vendor contact without phone', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id_proveedor: 1,
          nombre: 'Elena',
          apellidos: 'Sin Teléfono',
          puesto: 'Consultora',
          email: 'elena@proveedortest.com',
          telefono: ''
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.nombre).toBe('Elena');
      expect(res.body.telefono).toBeNull();
    });
  });

  describe('Scope Change Management (CR)', () => {
    let testCrId = null;

    beforeAll(async () => {
      // Re-create a test project if needed for CR tests
      await Proyectos.findOrCreate({
        where: { id_proyecto: 'PRJ-2026-CR01' },
        defaults: {
          id_proyecto: 'PRJ-2026-CR01',
          nombre_proyecto: 'Proyecto CR Test',
          descripcion: 'Desc',
          id_estado: 1,
          id_pm: 1,
          id_proveedor: 1,
          id_sede: 1,
          id_sponsor: 1,
          presupuesto_inicial: 15000,
          budget_inicial: 15000,
          fecha_inicio: '2026-01-01',
          fecha_fin_inicial: '2026-12-31'
        }
      });
    });

    it('should create a new scope change (CR)', async () => {
      const res = await request(app)
        .post('/api/scope-changes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          id_proyecto: 'PRJ-2026-CR01',
          fecha_solicitud: '2026-05-01',
          id_solicitante_contacto: 1,
          id_aprobador_contacto: 1,
          descripcion_motivo: 'Ampliación de funcionalidades test',
          impacta_importe: true,
          importe_impacto: 5000,
          impacta_tiempo: true,
          dias_impacto: 15,
          estado_cambio: 'SOLICITADO'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id_cambio');
      testCrId = res.body.id_cambio;
    });

    it('should update a scope change', async () => {
      const res = await request(app)
        .put(`/api/scope-changes/${testCrId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          estado_cambio: 'APROBADO',
          descripcion_motivo: 'Ampliación aprobada por dirección'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.estado_cambio).toBe('APROBADO');
      expect(res.body.descripcion_motivo).toBe('Ampliación aprobada por dirección');
    });

    it('should delete a scope change successfully', async () => {
      const res = await request(app)
        .delete(`/api/scope-changes/${testCrId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Cambio de alcance eliminado con éxito');
    });

    it('should return 404 when deleting non-existent scope change', async () => {
      const res = await request(app)
        .delete('/api/scope-changes/CR-9999-999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toBe('Cambio de alcance no encontrado');
    });
  });
});

