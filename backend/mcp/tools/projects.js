const { Proyectos, Sedes, Proveedores, EstadosProyecto, Portfolios, Usuarios, Ambitos, Workflows, Tags } = require('../../models');
const { Op } = require('sequelize');

const listProjectsTool = {
  name: 'list_projects',
  description: 'Lista los proyectos de la PMO permitiendo filtrar por ámbito/departamento, estado, sede, responsable (PM) o búsqueda de texto (nombre, código o etiquetas/tags).',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Texto a buscar en código, nombre o etiquetas/tags del proyecto' },
      estado: { type: 'string', description: 'Nombre o ID del estado del proyecto' },
      macroEtapa: { type: 'string', description: 'Macro-Etapa del ciclo de vida (INICIATIVA, PLANIFICACION, EJECUCION, PAUSA, CIERRE)' },
      workflowId: { type: 'number', description: 'ID del flujo de trabajo (workflow)' },
      sedeId: { type: 'number', description: 'ID de la sede/departamento' },
      ambitoId: { type: 'number', description: 'ID del ámbito/unidad de negocio' },
      limit: { type: 'number', description: 'Número máximo de resultados (por defecto 20)', default: 20 }
    }
  },
  handler: async (args, mcpScope = { isGlobal: true }) => {
    const { search, estado, macroEtapa, workflowId, sedeId, ambitoId, limit = 20 } = args || {};
    const where = {};

    // Scope isolation rule
    if (!mcpScope.isGlobal && mcpScope.id_ambito) {
      where.id_ambito = mcpScope.id_ambito;
    } else if (ambitoId) {
      where.id_ambito = ambitoId;
    }

    if (search) {
      const pTags = await Proyectos.findAll({
        attributes: ['id_proyecto'],
        include: [{ model: Tags, as: 'Tags', where: { nombre: { [Op.like]: `%${search}%` } }, attributes: [] }],
        raw: true
      });
      const tagProjIds = pTags.map(p => p.id_proyecto);
      const searchConditions = [
        { id_proyecto: { [Op.like]: `%${search}%` } },
        { nombre_proyecto: { [Op.like]: `%${search}%` } },
        { codigo_capex: { [Op.like]: `%${search}%` } }
      ];
      if (tagProjIds.length > 0) {
        searchConditions.push({ id_proyecto: { [Op.in]: tagProjIds } });
      }
      where[Op.or] = searchConditions;
    }
    if (sedeId) where.id_sede = sedeId;
    if (workflowId) where.id_workflow = workflowId;

    const include = [
      { model: Sedes, as: 'Sede', attributes: ['id_sede', 'nombre_sede'] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'macro_etapa'] },
      { model: Workflows, as: 'Workflow', attributes: ['id', 'nombre'] },
      { model: Usuarios, as: 'PM', attributes: ['id_usuario', 'nombre', 'apellidos'] },
      { model: Ambitos, as: 'Ambito', attributes: ['id_ambito', 'nombre', 'code'] }
    ];

    const estadoFilter = {};
    if (estado) {
      if (typeof estado === 'number') {
        estadoFilter.id_estado = estado;
      } else {
        estadoFilter.nombre_estado = { [Op.like]: `%${estado}%` };
      }
    }
    if (macroEtapa) {
      estadoFilter.macro_etapa = macroEtapa.toUpperCase();
    }
    if (Object.keys(estadoFilter).length > 0) {
      include[1].where = estadoFilter;
    }

    const projects = await Proyectos.findAll({
      where,
      include,
      limit: Math.min(limit, 50),
      order: [['createdAt', 'DESC']]
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projects.map(p => ({
            id: p.id_proyecto,
            nombre: p.nombre_proyecto,
            ambito: p.Ambito ? `${p.Ambito.nombre} (${p.Ambito.code})` : null,
            workflow: p.Workflow ? p.Workflow.nombre : null,
            estado: p.Estado ? p.Estado.nombre_estado : null,
            macro_etapa: p.Estado ? p.Estado.macro_etapa : null,
            rag: p.indicador_rag,
            pm: p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : null,
            sede: p.Sede ? p.Sede.nombre_sede : null,
            fecha_inicio: p.fecha_inicio
          })), null, 2)
        }
      ]
    };
  }
};

const getProjectDetailTool = {
  name: 'get_project_detail',
  description: 'Obtiene el detalle completo de un proyecto por su ID (código PRJ-YYYY-XXX), incluyendo sus KPIs, riesgos, incidencias y tareas asociadas.',
  inputSchema: {
    type: 'object',
    properties: {
      id_proyecto: { type: 'string', description: 'Código del proyecto (ej: PRJ-2026-001)' }
    },
    required: ['id_proyecto']
  },
  handler: async (args, mcpScope = { isGlobal: true }) => {
    const { id_proyecto } = args || {};
    if (!id_proyecto) {
      return { content: [{ type: 'text', text: 'Error: id_proyecto es obligatorio.' }], isError: true };
    }

    const { Riesgos, Incidencias, Tareas } = require('../../models');

    const project = await Proyectos.findByPk(id_proyecto, {
      include: [
        { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado'] },
        { model: Workflows, as: 'Workflow', attributes: ['id', 'nombre', 'descripcion', 'code'] },
        { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos', 'correo'] },
        { model: Portfolios, as: 'Portfolio', attributes: ['nombre'] },
        { model: Ambitos, as: 'Ambito', attributes: ['id_ambito', 'nombre', 'code'] },
        { model: Riesgos, as: 'Riesgos' },
        { model: Incidencias, as: 'Incidencias' },
        { model: Tareas, as: 'Tareas' }
      ]
    });

    if (!project) {
      return { content: [{ type: 'text', text: `Proyecto con ID '${id_proyecto}' no encontrado.` }], isError: true };
    }

    // Security check: Verify scope access
    if (!mcpScope.isGlobal && mcpScope.id_ambito && project.id_ambito !== mcpScope.id_ambito) {
      return {
        content: [{ type: 'text', text: `Acceso denegado: El proyecto con ID '${id_proyecto}' pertenece a un ámbito no autorizado.` }],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(project, null, 2)
        }
      ]
    };
  }
};

module.exports = { listProjectsTool, getProjectDetailTool };
