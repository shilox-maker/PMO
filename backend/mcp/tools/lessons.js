const { LeccionesAprendidas, Proyectos, Proveedores } = require('../../models');
const { Op } = require('sequelize');

const getLessonsLearnedTool = {
  name: 'get_lessons_learned',
  description: 'Consulta y busca lecciones aprendidas registradas en la PMO (buenas prácticas o errores a evitar), filtrables por proyecto, proveedor o búsqueda de texto.',
  inputSchema: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Texto a buscar en título, contexto o recomendación' },
      tipo: { type: 'string', enum: ['BUENA_PRACTICA', 'ERROR_A_EVITAR'], description: 'Tipo de lección aprendida' },
      id_proyecto: { type: 'string', description: 'Código del proyecto (ej: PRJ-2026-001)' },
      id_proveedor: { type: 'number', description: 'ID del proveedor' },
      limit: { type: 'number', description: 'Número máximo de resultados (por defecto 20)', default: 20 }
    }
  },
  handler: async (args) => {
    const { search, tipo, id_proyecto, id_proveedor, limit = 20 } = args || {};
    const where = {};

    if (tipo) where.tipo_leccion = tipo;
    if (id_proyecto) where.id_proyecto = id_proyecto;
    if (id_proveedor) where.id_proveedor = id_proveedor;

    if (search) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { contexto: { [Op.like]: `%${search}%` } },
        { recomendacion_futura: { [Op.like]: `%${search}%` } }
      ];
    }

    const lessons = await LeccionesAprendidas.findAll({
      where,
      include: [
        { model: Proyectos, as: 'Proyecto', attributes: ['id_proyecto', 'nombre_proyecto'] },
        { model: Proveedores, as: 'Proveedore', attributes: ['id_proveedor', 'nombre_razon_social'] }
      ],
      limit: Math.min(limit, 50),
      order: [['fecha_registro', 'DESC']]
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(lessons.map(l => ({
            id: l.id_leccion,
            tipo: l.tipo_leccion,
            titulo: l.titulo,
            contexto: l.contexto,
            recomendacion: l.recomendacion_futura,
            proyecto: l.Proyecto ? `${l.Proyecto.id_proyecto} - ${l.Proyecto.nombre_proyecto}` : null,
            proveedor: l.Proveedore ? l.Proveedore.nombre_razon_social : null,
            fecha: l.fecha_registro
          })), null, 2)
        }
      ]
    };
  }
};

module.exports = { getLessonsLearnedTool };
