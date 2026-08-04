const { Op } = require('sequelize');
const { Proyectos, Riesgos, Incidencias } = require('../models');

/**
 * Controller for global search across projects, risks, and issues.
 */
const globalSearch = async (req, res) => {
  try {
    const query = (req.query.q || '').trim();

    if (!query || query.length < 2) {
      return res.json({
        projects: [],
        risks: [],
        incidencias: []
      });
    }

    const searchPattern = `%${query}%`;

    // 1. Search Proyectos
    const projects = await Proyectos.findAll({
      where: {
        [Op.or]: [
          { codigo_proyecto: { [Op.like]: searchPattern } },
          { nombre_proyecto: { [Op.like]: searchPattern } },
          { cliente: { [Op.like]: searchPattern } },
          { pm_nombre: { [Op.like]: searchPattern } }
        ]
      },
      attributes: ['id_proyecto', 'codigo_proyecto', 'nombre_proyecto', 'cliente', 'pm_nombre'],
      limit: 5
    });

    // 2. Search Riesgos
    const risks = await Riesgos.findAll({
      where: {
        [Op.or]: [
          { codigo_riesgo: { [Op.like]: searchPattern } },
          { titulo: { [Op.like]: searchPattern } },
          { descripcion: { [Op.like]: searchPattern } }
        ]
      },
      attributes: ['id_riesgo', 'codigo_riesgo', 'titulo', 'id_proyecto', 'nivel_impacto'],
      limit: 5
    });

    // 3. Search Incidencias
    const incidencias = await Incidencias.findAll({
      where: {
        [Op.or]: [
          { codigo_incidencia: { [Op.like]: searchPattern } },
          { titulo: { [Op.like]: searchPattern } },
          { descripcion: { [Op.like]: searchPattern } }
        ]
      },
      attributes: ['id_incidencia', 'codigo_incidencia', 'titulo', 'id_proyecto', 'prioridad'],
      limit: 5
    });

    return res.json({
      projects,
      risks,
      incidencias
    });
  } catch (error) {
    console.error('Error in globalSearch:', error);
    return res.status(500).json({ error: 'Error al realizar la búsqueda global' });
  }
};

module.exports = {
  globalSearch
};
