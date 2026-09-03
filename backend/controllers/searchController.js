const { Op } = require('sequelize');
const { Proyectos, Riesgos, Incidencias, Tags, Usuarios } = require('../models');

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

    const tagMatchingProjects = await Proyectos.findAll({
      attributes: ['id_proyecto'],
      include: [{ model: Tags, as: 'Tags', where: { nombre: { [Op.like]: searchPattern } }, attributes: [] }],
      raw: true
    });
    const tagProjIds = tagMatchingProjects.map(p => p.id_proyecto);

    const projectOrConditions = [
      { id_proyecto: { [Op.like]: searchPattern } },
      { nombre_proyecto: { [Op.like]: searchPattern } },
      { codigo_capex: { [Op.like]: searchPattern } },
      { descripcion: { [Op.like]: searchPattern } }
    ];
    if (tagProjIds.length > 0) {
      projectOrConditions.push({ id_proyecto: { [Op.in]: tagProjIds } });
    }

    const projectWhere = {
      [Op.or]: projectOrConditions
    };
    if (req.currentAmbitoId && req.currentAmbitoId !== 'ALL') {
      projectWhere.id_ambito = req.currentAmbitoId;
    }

    // 1. Search Proyectos
    const projects = await Proyectos.findAll({
      where: projectWhere,
      attributes: ['id_proyecto', 'nombre_proyecto', 'codigo_capex'],
      include: [
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] }
      ],
      limit: 5
    });

    // 2. Search Riesgos
    const risks = await Riesgos.findAll({
      where: {
        [Op.or]: [
          { id_riesgo: { [Op.like]: searchPattern } },
          { titulo_riesgo: { [Op.like]: searchPattern } },
          { descripcion: { [Op.like]: searchPattern } }
        ]
      },
      attributes: ['id_riesgo', 'titulo_riesgo', 'id_proyecto', 'impacto'],
      limit: 5
    });

    // 3. Search Incidencias
    const incidencias = await Incidencias.findAll({
      where: {
        [Op.or]: [
          { id_incidencia: { [Op.like]: searchPattern } },
          { titulo: { [Op.like]: searchPattern } },
          { descripcion: { [Op.like]: searchPattern } }
        ]
      },
      attributes: ['id_incidencia', 'titulo', 'id_proyecto', 'criticidad'],
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
