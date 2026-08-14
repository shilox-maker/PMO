const { Ambitos } = require('../../models');

const listAmbitosTool = {
  name: 'list_ambitos',
  description: 'Lista los ámbitos/unidades de negocio de la PMO autorizados para la conexión actual.',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  handler: async (args, mcpScope = { isGlobal: true }) => {
    const where = { activo: true };
    if (!mcpScope.isGlobal && mcpScope.id_ambito) {
      where.id_ambito = mcpScope.id_ambito;
    }

    const ambitos = await Ambitos.findAll({
      where,
      attributes: ['id_ambito', 'nombre', 'code', 'descripcion', 'activo'],
      order: [['id_ambito', 'ASC']]
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(ambitos, null, 2)
        }
      ]
    };
  }
};

module.exports = { listAmbitosTool };
