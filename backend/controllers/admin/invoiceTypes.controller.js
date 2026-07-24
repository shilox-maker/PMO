const { TiposFactura, Facturas } = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

const getTiposFactura = asyncHandler(async (req, res) => {
  await TiposFactura.sync();
  let tipos = await TiposFactura.findAll({ order: [['orden', 'ASC'], ['nombre', 'ASC']] });
  if (tipos.length === 0) {
    const defaultData = [
      'Consultoría Externa', 'Licencias de Software', 'Desarrollos e Integraciones',
      'Infraestructura Tecnológica', 'Migración y Calidad de Datos', 'Viajes y Desplazamientos',
      'Alojamiento', 'Dietas y Comidas', 'Formación', 'Hardware y Equipamiento',
      'Recursos Internos', 'Otros Gastos'
    ].map(nombre => ({ nombre }));
    await TiposFactura.bulkCreate(defaultData);
    tipos = await TiposFactura.findAll({ order: [['orden', 'ASC'], ['nombre', 'ASC']] });
  }
  res.json(tipos);
});

const createTipoFactura = asyncHandler(async (req, res) => {
  const { nombre, orden } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del tipo de factura es obligatorio.' });
  }
  const existing = await TiposFactura.findOne({ where: { nombre: nombre.trim() } });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe un tipo de factura con ese nombre.' });
  }
  const ordenVal = orden !== undefined && orden !== '' ? parseInt(orden, 10) : 0;
  const tipo = await TiposFactura.create({ nombre: nombre.trim(), orden: Number.isNaN(ordenVal) ? 0 : ordenVal });
  res.status(201).json(tipo);
});

const updateTipoFactura = asyncHandler(async (req, res) => {
  const tipo = await TiposFactura.findByPk(req.params.id);
  if (!tipo) return res.status(404).json({ error: 'Tipo de factura no encontrado.' });
  const { nombre, orden } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del tipo de factura es obligatorio.' });
  }
  const dup = await TiposFactura.findOne({ where: { nombre: nombre.trim() } });
  if (dup && dup.id_tipo_factura != tipo.id_tipo_factura) {
    return res.status(400).json({ error: 'Ya existe otro tipo de factura con ese nombre.' });
  }
  const ordenVal = orden !== undefined && orden !== '' ? parseInt(orden, 10) : tipo.orden;
  await tipo.update({ nombre: nombre.trim(), orden: Number.isNaN(ordenVal) ? 0 : ordenVal });
  res.json(tipo);
});

const deleteTipoFactura = asyncHandler(async (req, res) => {
  const tipo = await TiposFactura.findByPk(req.params.id);
  if (!tipo) return res.status(404).json({ error: 'Tipo de factura no encontrado.' });
  const inUse = await Facturas.count({ where: { id_tipo_factura: req.params.id } });
  if (inUse > 0) {
    return res.status(400).json({ error: `No se puede eliminar: hay ${inUse} factura(s) asociada(s) a este tipo.` });
  }
  await tipo.destroy();
  res.json({ message: 'Tipo de factura eliminado correctamente.' });
});

module.exports = {
  getTiposFactura,
  createTipoFactura,
  updateTipoFactura,
  deleteTipoFactura
};
