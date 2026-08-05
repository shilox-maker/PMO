const { Proyectos, Riesgos, Incidencias } = require('../../models');
const { Op } = require('sequelize');

const searchPmoTool = {
  name: 'search_pmo',
  description: 'Búsqueda global rápida en todo el repositorio de la PMO (proyectos, riesgos e incidencias).',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Término de búsqueda' },
      limit: { type: 'number', description: 'Límite de resultados por categoría', default: 5 }
    },
    required: ['query']
  },
  handler: async (args) => {
    const { query, limit = 5 } = args;
    const l = Math.min(limit, 10);

    const [projects, risks, issues] = await Promise.all([
      Proyectos.findAll({
        where: {
          [Op.or]: [
            { id_proyecto: { [Op.like]: `%${query}%` } },
            { nombre_proyecto: { [Op.like]: `%${query}%` } },
            { descripcion: { [Op.like]: `%${query}%` } }
          ]
        },
        limit: l,
        attributes: ['id_proyecto', 'nombre_proyecto', 'indicador_rag']
      }),
      Riesgos.findAll({
        where: {
          [Op.or]: [
            { id_riesgo: { [Op.like]: `%${query}%` } },
            { titulo_riesgo: { [Op.like]: `%${query}%` } },
            { descripcion: { [Op.like]: `%${query}%` } }
          ]
        },
        limit: l,
        attributes: ['id_riesgo', 'id_proyecto', 'titulo_riesgo', 'probabilidad', 'impacto', 'estado_riesgo']
      }),
      Incidencias.findAll({
        where: {
          [Op.or]: [
            { id_incidencia: { [Op.like]: `%${query}%` } },
            { titulo: { [Op.like]: `%${query}%` } },
            { descripcion: { [Op.like]: `%${query}%` } }
          ]
        },
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
