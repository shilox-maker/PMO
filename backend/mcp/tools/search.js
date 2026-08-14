const { Proyectos, Riesgos, Incidencias, Ambitos } = require('../../models');
const { Op } = require('sequelize');

const searchPmoTool = {
  name: 'search_pmo',
  description: 'Búsqueda global rápida en todo el repositorio de la PMO (proyectos, riesgos e incidencias), respetando el ámbito de la conexión actual.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Término de búsqueda' },
      ambitoId: { type: 'number', description: 'ID del ámbito/unidad de negocio' },
      limit: { type: 'number', description: 'Límite de resultados por categoría', default: 5 }
    },
    required: ['query']
  },
  handler: async (args, mcpScope = { isGlobal: true }) => {
    const { query, ambitoId, limit = 5 } = args || {};
    const l = Math.min(limit, 10);

    const projectWhere = {
      [Op.or]: [
        { id_proyecto: { [Op.like]: `%${query}%` } },
        { nombre_proyecto: { [Op.like]: `%${query}%` } },
        { descripcion: { [Op.like]: `%${query}%` } }
      ]
    };

    if (!mcpScope.isGlobal && mcpScope.id_ambito) {
      projectWhere.id_ambito = mcpScope.id_ambito;
    } else if (ambitoId) {
      projectWhere.id_ambito = ambitoId;
    }

    // First find matching projects to restrict risk/issue searches if scope is restricted
    let allowedProjectIds = null;
    if (!mcpScope.isGlobal && mcpScope.id_ambito) {
      const scopeProjects = await Proyectos.findAll({
        where: { id_ambito: mcpScope.id_ambito },
        attributes: ['id_proyecto']
      });
      allowedProjectIds = scopeProjects.map(p => p.id_proyecto);
    } else if (ambitoId) {
      const scopeProjects = await Proyectos.findAll({
        where: { id_ambito: ambitoId },
        attributes: ['id_proyecto']
      });
      allowedProjectIds = scopeProjects.map(p => p.id_proyecto);
    }

    const riskWhere = {
      [Op.or]: [
        { id_riesgo: { [Op.like]: `%${query}%` } },
        { titulo_riesgo: { [Op.like]: `%${query}%` } },
        { descripcion: { [Op.like]: `%${query}%` } }
      ]
    };
    if (allowedProjectIds !== null) {
      riskWhere.id_proyecto = { [Op.in]: allowedProjectIds };
    }

    const issueWhere = {
      [Op.or]: [
        { id_incidencia: { [Op.like]: `%${query}%` } },
        { titulo: { [Op.like]: `%${query}%` } },
        { descripcion: { [Op.like]: `%${query}%` } }
      ]
    };
    if (allowedProjectIds !== null) {
      issueWhere.id_proyecto = { [Op.in]: allowedProjectIds };
    }

    const [projects, risks, issues] = await Promise.all([
      Proyectos.findAll({
        where: projectWhere,
        include: [{ model: Ambitos, as: 'Ambito', attributes: ['id_ambito', 'nombre', 'code'] }],
        limit: l,
        attributes: ['id_proyecto', 'nombre_proyecto', 'indicador_rag', 'id_ambito']
      }),
      Riesgos.findAll({
        where: riskWhere,
        limit: l,
        attributes: ['id_riesgo', 'id_proyecto', 'titulo_riesgo', 'probabilidad', 'impacto', 'estado_riesgo']
      }),
      Incidencias.findAll({
        where: issueWhere,
        limit: l,
        attributes: ['id_incidencia', 'id_proyecto', 'titulo', 'criticidad', 'estado']
      })
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ query, projects, risks, issues }, null, 2)
        }
      ]
    };
  }
};

module.exports = { searchPmoTool };
