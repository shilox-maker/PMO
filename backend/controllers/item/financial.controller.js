const { Facturas, CambiosAlcance, ProyectoContactos } = require('../../models/index');
const { Op } = require('sequelize');
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
  if (!data.id_proveedor || data.id_proveedor === '') data.id_proveedor = null;
  if (!data.id_tipo_factura || data.id_tipo_factura === '') data.id_tipo_factura = null;
  if (!data.numero_factura || data.numero_factura === '') data.numero_factura = null;
  if (!data.concepto || data.concepto === '') data.concepto = null;
  const fac = await Facturas.create(data);
  res.status(201).json(fac);
});

const createBatchInvoices = asyncHandler(async (req, res) => {
  const { facturas } = req.body;
  if (!facturas || !Array.isArray(facturas) || facturas.length === 0) {
    return res.status(400).json({ error: 'Se requiere una lista no vacía de facturas.' });
  }

  const createdInvoices = [];
  for (const item of facturas) {
    item.createdBy = req.currentPmId;
    item.modifiedBy = req.currentPmId;
    if (!item.id_interno_factura || item.id_interno_factura.trim() === '') {
      item.id_interno_factura = await generateNextId(Facturas, 'FAC', 'id_interno_factura');
    }
    if (!item.id_proveedor || item.id_proveedor === '') item.id_proveedor = null;
    if (!item.id_tipo_factura || item.id_tipo_factura === '') item.id_tipo_factura = null;
    if (!item.numero_factura || item.numero_factura === '') item.numero_factura = null;
    if (!item.concepto || item.concepto === '') item.concepto = null;
    const created = await Facturas.create(item);
    createdInvoices.push(created);
  }

  res.status(201).json(createdInvoices);
});

const updateInvoice = asyncHandler(async (req, res) => {
  const { id_interno_factura } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  if (data.id_proveedor === '') data.id_proveedor = null;
  if (data.id_tipo_factura === '') data.id_tipo_factura = null;
  if (data.numero_factura === '') data.numero_factura = null;
  if (data.concepto === '') data.concepto = null;
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

  // Validar que solicitante y aprobador pertenezcan a la matriz RACI del proyecto
  if (data.id_proyecto && (data.id_solicitante_contacto || data.id_aprobador_contacto)) {
    const contactIds = [data.id_solicitante_contacto, data.id_aprobador_contacto].filter(Boolean);
    const uniqueIds = [...new Set(contactIds.map(Number))];
    const count = await ProyectoContactos.count({
      where: {
        id_proyecto: data.id_proyecto,
        id_contacto: { [Op.in]: uniqueIds }
      }
    });
    if (count < uniqueIds.length) {
      return res.status(400).json({ error: 'Tanto el solicitante como el aprobador deben pertenecer a la matriz RACI del proyecto.' });
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

  const targetProjectId = data.id_proyecto || cr.id_proyecto;
  const solicitanteId = data.id_solicitante_contacto !== undefined ? data.id_solicitante_contacto : cr.id_solicitante_contacto;
  const aprobadorId = data.id_aprobador_contacto !== undefined ? data.id_aprobador_contacto : cr.id_aprobador_contacto;

  if (targetProjectId && (solicitanteId || aprobadorId)) {
    const contactIds = [solicitanteId, aprobadorId].filter(Boolean);
    const uniqueIds = [...new Set(contactIds.map(Number))];
    const count = await ProyectoContactos.count({
      where: {
        id_proyecto: targetProjectId,
        id_contacto: { [Op.in]: uniqueIds }
      }
    });
    if (count < uniqueIds.length) {
      return res.status(400).json({ error: 'Tanto el solicitante como el aprobador deben pertenecer a la matriz RACI del proyecto.' });
    }
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

const deleteScopeChange = asyncHandler(async (req, res) => {
  const { id_cambio } = req.params;
  const cr = await CambiosAlcance.findByPk(id_cambio);
  if (!cr) {
    return res.status(404).json({ error: 'Cambio de alcance no encontrado' });
  }
  await cr.destroy();
  res.json({ message: 'Cambio de alcance eliminado con éxito' });
});

module.exports = {
  createInvoice,
  createBatchInvoices,
  updateInvoice,
  deleteInvoice,
  createScopeChange,
  updateScopeChange,
  deleteScopeChange
};

