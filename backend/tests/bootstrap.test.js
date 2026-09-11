const request = require('supertest');
const app = require('../server');
const { 
  sequelize, Usuarios, EstadosProyecto, Sedes, Proveedores, 
  ContactosProveedor, Workflows, WorkflowEstados, Ambitos, Portfolios, Tags, TiposCapex 
} = require('../models');
const bcrypt = require('bcryptjs');

let userToken = '';

beforeAll(async () => {
  process.env.AZURE_MOCK = 'true';
  process.env.JWT_SECRET = 'test_secret';

  await sequelize.sync({ force: true });

  const amb = await Ambitos.create({ id_ambito: 1, nombre: 'Global', code: 'GLB' });

  const hash = await bcrypt.hash('Test_1234!', 10);
  await Usuarios.create({
    nombre: 'PM',
    apellidos: 'Tester',
    correo: 'pm_tester@dacsa.com',
    password: hash,
    perfil: 'PM',
    activo: true,
    metodo_acceso: 'PASSWORD'
  });

  const sede = await Sedes.create({ nombre_sede: 'Valencia Test', code: 'VLC', orden: 1 });
  const prov = await Proveedores.create({ nombre_razon_social: 'Proveedor Test S.L.', es_grupo_dacsa: true });
  await ContactosProveedor.create({ nombre: 'Contacto', apellidos: 'Uno', puesto: 'Lead', email: 'c1@test.com', id_proveedor: prov.id_proveedor });
  
  const est1 = await EstadosProyecto.create({ id_estado: 1, nombre_estado: 'Inicio', icono: '🚀', orden: 1, proyecto_cerrado: false });
  const wf = await Workflows.create({ nombre: 'Workflow Test', is_default: true, activo: true, id_ambito: 1 });
  await WorkflowEstados.create({ id_workflow: wf.id, id_estado: est1.id_estado, orden: 1 });

  await Portfolios.create({ nombre: 'Portfolio Tech', id_ambito: 1 });
  await Tags.create({ nombre: 'Digital' });
  await TiposCapex.create({ nombre: 'Hardware', orden: 1 });

  const pmRes = await request(app)
    .post('/api/login')
    .send({ correo: 'pm_tester@dacsa.com', password: 'Test_1234!' });
  userToken = pmRes.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/meta/bootstrap Endpoint Tests', () => {
  test('Should return all unified master catalogs in a single response', async () => {
    const res = await request(app)
      .get('/api/meta/bootstrap')
      .set('Authorization', `Bearer ${userToken}`)
      .set('X-Ambito-Id', '1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pms');
    expect(res.body).toHaveProperty('vendors');
    expect(res.body).toHaveProperty('sedes');
    expect(res.body).toHaveProperty('contactos');
    expect(res.body).toHaveProperty('states');
    expect(res.body).toHaveProperty('workflows');
    expect(res.body).toHaveProperty('portfolios');
    expect(res.body).toHaveProperty('tags');
    expect(res.body).toHaveProperty('capexTypes');
    expect(res.body).toHaveProperty('invoiceTypes');

    // Verify content structures
    expect(Array.isArray(res.body.pms)).toBe(true);
    expect(res.body.pms.length).toBeGreaterThan(0);
    expect(res.body.pms[0].nombre).toBe('PM');

    expect(Array.isArray(res.body.vendors)).toBe(true);
    expect(res.body.vendors[0].nombre_razon_social).toBe('Proveedor Test S.L.');
    expect(res.body.vendors[0].es_grupo_dacsa).toBe(true);

    expect(Array.isArray(res.body.sedes)).toBe(true);
    expect(res.body.sedes[0].nombre_sede).toBe('Valencia Test');

    expect(Array.isArray(res.body.contactos)).toBe(true);
    expect(res.body.contactos[0].nombre).toBe('Contacto');
    expect(res.body.contactos[0].apellidos).toBe('Uno');

    expect(Array.isArray(res.body.states)).toBe(true);
    expect(Array.isArray(res.body.workflows)).toBe(true);
    expect(Array.isArray(res.body.portfolios)).toBe(true);
    expect(Array.isArray(res.body.tags)).toBe(true);
    expect(Array.isArray(res.body.capexTypes)).toBe(true);
  });

  test('Should also respond on /api/bootstrap alias', async () => {
    const res = await request(app)
      .get('/api/bootstrap')
      .set('Authorization', `Bearer ${userToken}`)
      .set('X-Ambito-Id', '1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pms');
    expect(res.body).toHaveProperty('vendors');
  });
});
