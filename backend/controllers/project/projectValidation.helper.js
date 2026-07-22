const { sanitizeHTML, isValidISODate, parseToISODate } = require('../../utils/helpers');
const { TiposCapex, SubtiposCapex } = require('../../models/index');

function sanitizeRichTextFields(data) {
  const richTextFields = [
    'alcance_por_que', 'alcance_objetivo', 'alcance_resultados', 
    'alcance_limitaciones', 'alcance_integraciones', 'alcance_desarrollo',
    'cierre_aceptacion', 'cierre_exito'
  ];
  richTextFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      data[field] = sanitizeHTML(data[field]);
    }
  });
}

async function validateCapexFields(data, res) {
  if (data.es_capex && (!data.codigo_capex || data.codigo_capex.trim() === '')) {
    res.status(400).json({ error: 'El código CAPEX es obligatorio para proyectos CAPEX.' });
    return false;
  }
  if (data.es_capex && !data.id_tipo_capex) {
    res.status(400).json({ error: 'El tipo de CAPEX es obligatorio para proyectos CAPEX.' });
    return false;
  }
  if (data.es_capex && data.id_tipo_capex) {
    const tipo = await TiposCapex.findByPk(data.id_tipo_capex, {
      include: [{ model: SubtiposCapex, as: 'Subtipos' }]
    });
    if (tipo && tipo.Subtipos && tipo.Subtipos.length > 0 && !data.id_subtipo_capex) {
      res.status(400).json({ error: 'El subtipo de CAPEX es obligatorio para el tipo seleccionado.' });
      return false;
    }
  }
  if (!data.es_capex) {
    data.id_tipo_capex = null;
    data.id_subtipo_capex = null;
  }
  return true;
}

function validateDateFields(data, res) {
  const dateFields = [
    'fecha_peticion', 'fecha_alcance_definido', 'fecha_aprobacion', 
    'fecha_planificacion', 'fecha_kickoff', 'fecha_go_live', 'fecha_cierre'
  ];
  for (const field of dateFields) {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'string' && data[field].trim() !== '') {
        data[field] = parseToISODate(data[field].trim());
      }
      if (data[field] === '' || data[field] === null) {
        data[field] = null;
      } else {
        if (!isValidISODate(data[field])) {
          res.status(400).json({ error: `La fecha ${field} no cumple con el formato ISO 8601 (YYYY-MM-DD).` });
          return false;
        }
      }
    }
  }
  return true;
}

module.exports = {
  sanitizeRichTextFields,
  validateCapexFields,
  validateDateFields
};
