const { Facturas, CambiosAlcance } = require('../../models/index');
const { generateNextId } = require('../../utils/helpers');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- FACTURAS ---
const createInvoice = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;
  if (!data.id_interno_factura || data.id_interno_factura.trim() === '') {
    data.id_interno_factura = await generateNextId(Facturas, 'FAC', 'id_interno_factura');
  } else {
    const facRegex = /^FAC-\d{4}-\d{3}$/;
    if (!facRegex.test(data.id_interno_factura)) {
      return res.status(400).json({ error: 'El ID de factura debe tener el formato FAC-YYYY-XXX.' });
    }
  }
  const fac = await Facturas.create(data);
  res.status(201).json(fac);
});

const updateInvoice = asyncHandler(async (req, res) => {
  const { id_interno_factura } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  const fac = await Facturas.findByPk(id_interno_factura);
  if (!fac) {
    return res.status(404).json({ error: 'Factura no encontrada' });
  }
  await fac.update(data);
  res.json(fac);
});

const deleteInvoice = asyncHandler(async (req, res) => {
  const { id_interno_factura } = req.params;
  const fac = await Facturas.findByPk(id_interno_factura);
  if (!fac) {
    return res.status(404).json({ error: 'Factura no encontrada' });
  }
  await fac.destroy();
  res.json({ message: 'Factura eliminada con éxito' });
});

// --- CAMBIOS DE ALCANCE ---
const createScopeChange = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;
  if (!data.id_cambio || data.id_cambio.trim() === '') {
    data.id_cambio = await generateNextId(CambiosAlcance, 'CR', 'id_cambio');
  } else {
    const crRegex = /^CR-\d{4}-\d{3}$/;
    if (!crRegex.test(data.id_cambio)) {
      return res.status(400).json({ error: 'El ID del cambio de alcance debe tener el formato CR-YYYY-XXX.' });
    }
  }
  if (!data.impacta_importe) {
    data.importe_impacto = 0.00;
  }
  if (!data.impacta_tiempo) {
    data.dias_impacto = 0;
  }
  const cr = await CambiosAlcance.create(data);
  res.status(201).json(cr);
});

const updateScopeChange = asyncHandler(async (req, res) => {
  const { id_cambio } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  const cr = await CambiosAlcance.findByPk(id_cambio);
  if (!cr) {
    return res.status(404).json({ error: 'Cambio de alcance no encontrado' });
  }
  if (data.hasOwnProperty('impacta_importe') && !data.impacta_importe) {
    data.importe_impacto = 0.00;
  }
  if (data.hasOwnProperty('impacta_tiempo') && !data.impacta_tiempo) {
    data.dias_impacto = 0;
  }
  await cr.update(data);
  res.json(cr);
});

module.exports = {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createScopeChange,
  updateScopeChange
};
