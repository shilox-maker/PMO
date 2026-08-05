const { Proyectos, Sedes, Proveedores, EstadosProyecto, Portfolios, Usuarios } = require('../../models');
const { Op } = require('sequelize');

const listProjectsTool = {
  name: 'list_projects',
  description: 'Lista los proyectos de la PMO permitiendo filtrar por estado, departamento/sede, responsable (PM) o búsqueda de texto.',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Texto a buscar en código o nombre del proyecto' },
      estado: { type: 'string', description: 'Nombre o ID del estado del proyecto' },
      sedeId: { type: 'number', description: 'ID de la sede/departamento' },
      limit: { type: 'number', description: 'Número máximo de resultados (por defecto 20)', default: 20 }
    }
  },
  handler: async (args) => {
    const { search, estado, sedeId, limit = 20 } = args || {};
    const where = {};

    if (search) {
      where[Op.or] = [
        { id_proyecto: { [Op.like]: `%${search}%` } },
        { nombre_proyecto: { [Op.like]: `%${search}%` } }
      ];
    }
    if (sedeId) where.id_sede = sedeId;

    const include = [
      { model: Sedes, as: 'Sede', attributes: ['id_sede', 'nombre_sede'] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado'] },
      { model: Usuarios, as: 'PM', attributes: ['id_usuario', 'nombre', 'apellidos'] }
    ];

    if (estado) {
      include[1].where = typeof estado === 'number' ? { id_estado: estado } : { nombre_estado: { [Op.like]: `%${estado}%` } };
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
            estado: p.Estado ? p.Estado.nombre_estado : null,
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
  handler: async (args) => {
    const { id_proyecto } = args;
    const { Riesgos, Incidencias, Tareas } = require('../../models');

    const project = await Proyectos.findByPk(id_proyecto, {
      include: [
        { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado'] },
        { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos', 'correo'] },
        { model: Portfolios, as: 'Portfolio', attributes: ['nombre'] },
        { model: Riesgos, as: 'Riesgos' },
        { model: Incidencias, as: 'Incidencias' },
        { model: Tareas, as: 'Tareas' }
      ]
    });

    if (!project) {
      return { content: [{ type: 'text', text: `Proyecto con ID '${id_proyecto}' no encontrado.` }] };
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
