const fs = require('fs');
const path = require('path');
const { 
  Sedes, ContactosProveedor, Proveedores, Usuarios, EstadosProyecto, EstadoTareasPlantilla,
  Portfolios, Tags, TiposCapex, SubtiposCapex, PortfolioBudgets, TiposFactura
} = require('../../models/index');

const { asyncHandler } = require('../../middlewares/errorHandler');

const getSedes = asyncHandler(async (req, res) => {
  const sedes = await Sedes.findAll({ order: [['orden', 'ASC'], ['nombre_sede', 'ASC']] });
  res.json(sedes);
});

const getContactos = asyncHandler(async (req, res) => {
  const kus = await ContactosProveedor.findAll({
    include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }],
    order: [['nombre', 'ASC']]
  });
  res.json(kus);
});

const getPms = asyncHandler(async (req, res) => {
  const pms = await Usuarios.findAll({
    where: { activo: true },
    order: [['nombre', 'ASC']]
  });
  res.json(pms);
});

const getChangelog = asyncHandler(async (req, res) => {
  const filePath = path.join(__dirname, '..', '..', '..', 'CHANGELOG.md');
  const content = fs.readFileSync(filePath, 'utf8');
  res.json({ content });
});

const getPortfolioStates = asyncHandler(async (req, res) => {
  const states = await EstadosProyecto.findAll({
    include: [{ model: EstadoTareasPlantilla, as: 'TareasPlantilla' }],
    order: [['orden', 'ASC']]
  });
  res.json(states);
});


const getPortfolios = asyncHandler(async (req, res) => {
  const portfolios = await Portfolios.findAll({ order: [['nombre', 'ASC']] });
  res.json(portfolios);
});

const getTags = asyncHandler(async (req, res) => {
  const tags = await Tags.findAll({ order: [['nombre', 'ASC']] });
  res.json(tags);
});

const createTag = asyncHandler(async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del tag es obligatorio.' });
  }
  const existing = await Tags.findOne({ where: { nombre: nombre.trim() } });
  if (existing) {
    return res.json(existing);
  }
  const tag = await Tags.create({ nombre: nombre.trim() });
  res.status(201).json(tag);
});

const getCapexTypes = asyncHandler(async (req, res) => {
  const tipos = await TiposCapex.findAll({
    include: [{ model: SubtiposCapex, as: 'Subtipos' }],
    order: [['orden', 'ASC'], [{ model: SubtiposCapex, as: 'Subtipos' }, 'orden', 'ASC']]
  });
  res.json(tipos);
});

const getPortfolioBudgets = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budgets = await PortfolioBudgets.findAll({
    where: { portfolio_id: id },
    include: [
      { model: TiposCapex, as: 'TipoCapex', attributes: ['id', 'nombre'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['id', 'nombre'] }
    ]
  });
  res.json(budgets);
});

const getInvoiceTypes = asyncHandler(async (req, res) => {
  await TiposFactura.sync();
  let tipos = await TiposFactura.findAll({
    order: [['orden', 'ASC'], ['nombre', 'ASC']]
  });
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

module.exports = {
  getSedes,
  getContactos,
  getPms,
  getChangelog,
  getPortfolioStates,
  getPortfolios,
  getTags,
  createTag,
  getCapexTypes,
  getPortfolioBudgets,
  getInvoiceTypes
};
