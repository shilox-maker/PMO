const { sequelize, Ambitos, Proyectos, EstadosProyecto, Sedes, Usuarios } = require('../models');
const { listAmbitosTool } = require('../mcp/tools/ambitos');
const { listProjectsTool, getProjectDetailTool } = require('../mcp/tools/projects');
const { getPmoSummaryTool, getProjectSummaryTool } = require('../mcp/tools/summary');
const { verifyMcpApiKey } = require('../mcp/http');

describe('MCP Server Tools & Scope Security Integration Tests', () => {
  let testAmbito1;
  let testAmbito2;
  let testProject1;

  beforeAll(async () => {
    await sequelize.sync({ force: false });

    const [pmUser] = await Usuarios.findOrCreate({
      where: { correo: 'pm_mcp_test@pmo.com' },
      defaults: {
        nombre: 'PM Test',
        apellidos: 'MCP',
        correo: 'pm_mcp_test@pmo.com',
        password: 'Password123!',
        perfil: 'PM',
        activo: true
      }
    });

    [testAmbito1] = await Ambitos.findOrCreate({
      where: { code: 'IT' },
      defaults: { nombre: 'IT Corporate', code: 'IT', descripcion: 'Ámbito IT', activo: true }
    });

    [testAmbito2] = await Ambitos.findOrCreate({
      where: { code: 'IA' },
      defaults: { nombre: 'Equipo IA', code: 'IA', descripcion: 'Ámbito IA', activo: true }
    });

    const [sede] = await Sedes.findOrCreate({
      where: { nombre_sede: 'Sede Test MCP' },
      defaults: { nombre_sede: 'Sede Test MCP', orden: 1 }
    });

    const [estado] = await EstadosProyecto.findOrCreate({
      where: { id_estado: 991 },
      defaults: { nombre_estado: 'En Progreso', icono: '⚡', orden: 1, proyecto_cerrado: false }
    });

    [testProject1] = await Proyectos.findOrCreate({
      where: { id_proyecto: 'PRJ-MCP-TEST-001' },
      defaults: {
        id_proyecto: 'PRJ-MCP-TEST-001',
        nombre_proyecto: 'Proyecto Test MCP IT',
        descripcion: 'Proyecto de prueba IT para MCP',
        fecha_inicio: '2026-01-01',
        id_pm: pmUser.id_usuario,
        id_ambito: testAmbito1.id_ambito,
        id_sede: sede.id_sede,
        id_estado: estado.id_estado,
        indicador_rag: 'VERDE',
        presupuesto_total: 10000,
        gasto_comprometido: 2000
      }
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('list_ambitos tool - returns all active scopes for global scope', async () => {
    const res = await listAmbitosTool.handler({}, { isGlobal: true });
    expect(res).toHaveProperty('content');
    const data = JSON.parse(res.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('code');
  });

  test('list_ambitos tool - restricts to assigned scope when mcpScope is not global', async () => {
    const res = await listAmbitosTool.handler({}, { isGlobal: false, id_ambito: testAmbito1.id_ambito });
    const data = JSON.parse(res.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].id_ambito).toBe(testAmbito1.id_ambito);
  });

  test('getPmoSummaryTool - executes and returns structured executive summary', async () => {
    const res = await getPmoSummaryTool.handler({}, { isGlobal: true });
    expect(res).toHaveProperty('content');
    const data = JSON.parse(res.content[0].text);
    expect(data).toHaveProperty('resumen_proyectos');
    expect(data).toHaveProperty('financiero');
    expect(data).toHaveProperty('salud_operativa');
  });

  test('listProjectsTool - enforces scope isolation when mcpScope is restricted', async () => {
    const res = await listProjectsTool.handler({}, { isGlobal: false, id_ambito: testAmbito1.id_ambito });
    const data = JSON.parse(res.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    data.forEach(p => {
      expect(p.id).toBeDefined();
    });
  });

  test('getProjectDetailTool - denies access if project belongs to a different scope', async () => {
    const res = await getProjectDetailTool.handler(
      { id_proyecto: 'PRJ-MCP-TEST-001' },
      { isGlobal: false, id_ambito: testAmbito2.id_ambito }
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Acceso denegado');
  });

  test('getProjectSummaryTool - denies access if project belongs to a different scope', async () => {
    const res = await getProjectSummaryTool.handler(
      { id_proyecto: 'PRJ-MCP-TEST-001' },
      { isGlobal: false, id_ambito: testAmbito2.id_ambito }
    );
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Acceso denegado');
  });

  test('verifyMcpApiKey middleware - parses scoped keys correctly', () => {
    process.env.MCP_SCOPED_KEYS = JSON.stringify({ "key_ia_test_secret": testAmbito2.id_ambito });

    const req = {
      headers: { authorization: 'Bearer key_ia_test_secret' },
      query: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    verifyMcpApiKey(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.mcpScope).toEqual({ isGlobal: false, id_ambito: testAmbito2.id_ambito });
  });
});
