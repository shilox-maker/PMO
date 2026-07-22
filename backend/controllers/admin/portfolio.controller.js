const { Portfolios, Proyectos, TiposCapex, SubtiposCapex, PortfolioBudgets } = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- PORTFOLIOS ---
const createPortfolio = asyncHandler(async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del portfolio es obligatorio.' });
  }
  const existing = await Portfolios.findOne({ where: { nombre: nombre.trim() } });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe un portfolio con ese nombre.' });
  }
  const portfolio = await Portfolios.create({
    nombre: nombre.trim(),
    descripcion: descripcion ? descripcion.trim() : null
  });
  res.json(portfolio);
});

const updatePortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del portfolio es obligatorio.' });
  }
  const portfolio = await Portfolios.findByPk(id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio no encontrado.' });
  }
  const existing = await Portfolios.findOne({ where: { nombre: nombre.trim() } });
  if (existing && existing.id !== portfolio.id) {
    return res.status(400).json({ error: 'Ya existe otro portfolio con ese nombre.' });
  }
  await portfolio.update({
    nombre: nombre.trim(),
    descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : portfolio.descripcion
  });
  res.json(portfolio);
});

const deletePortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const portfolio = await Portfolios.findByPk(id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio no encontrado.' });
  }
  const inUse = await Proyectos.count({ where: { portfolio_id: id } });
  if (inUse > 0) {
    return res.status(400).json({ error: 'No se puede eliminar el portfolio porque tiene proyectos asociados.' });
  }
  await portfolio.destroy();
  res.json({ message: 'Portfolio eliminado con éxito.' });
});

// --- PORTFOLIO BUDGETS ---
const createPortfolioBudget = asyncHandler(async (req, res) => {
  const { id } = req.params; // portfolio_id
  const { id_tipo_capex, id_subtipo_capex, importe } = req.body;

  if (!id_tipo_capex || importe === undefined) {
    return res.status(400).json({ error: 'El tipo de CAPEX y el importe son obligatorios.' });
  }

  const numImporte = parseFloat(importe);
  if (isNaN(numImporte) || numImporte < 0) {
    return res.status(400).json({ error: 'El importe debe ser un número válido mayor o igual a 0.' });
  }

  const portfolio = await Portfolios.findByPk(id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio no encontrado.' });
  }

  const tipo = await TiposCapex.findByPk(id_tipo_capex);
  if (!tipo) {
    return res.status(404).json({ error: 'Tipo de CAPEX no encontrado.' });
  }

  if (id_subtipo_capex) {
    const subtipo = await SubtiposCapex.findByPk(id_subtipo_capex);
    if (!subtipo) {
      return res.status(404).json({ error: 'Subtipo de CAPEX no encontrado.' });
    }
    if (subtipo.id_tipo_capex !== parseInt(id_tipo_capex, 10)) {
      return res.status(400).json({ error: 'El subtipo de CAPEX no pertenece al tipo de CAPEX seleccionado.' });
    }
  }

  // Check for duplicates
  const duplicate = await PortfolioBudgets.findOne({
    where: {
      portfolio_id: id,
      id_tipo_capex,
      id_subtipo_capex: id_subtipo_capex || null
    }
  });

  if (duplicate) {
    return res.status(400).json({ error: 'Ya existe una asignación de presupuesto para esta combinación de Tipo/Subtipo CAPEX en este portfolio.' });
  }

  const budget = await PortfolioBudgets.create({
    portfolio_id: id,
    id_tipo_capex,
    id_subtipo_capex: id_subtipo_capex || null,
    importe: numImporte
  });

  res.status(201).json(budget);
});

const updatePortfolioBudget = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  const { importe } = req.body;

  if (importe === undefined) {
    return res.status(400).json({ error: 'El importe es obligatorio.' });
  }

  const numImporte = parseFloat(importe);
  if (isNaN(numImporte) || numImporte < 0) {
    return res.status(400).json({ error: 'El importe debe ser un número válido mayor o igual a 0.' });
  }

  const budget = await PortfolioBudgets.findByPk(budgetId);
  if (!budget) {
    return res.status(404).json({ error: 'Presupuesto no encontrado.' });
  }

  await budget.update({ importe: numImporte });
  res.json(budget);
});

const deletePortfolioBudget = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  const budget = await PortfolioBudgets.findByPk(budgetId);
  if (!budget) {
    return res.status(404).json({ error: 'Presupuesto no encontrado.' });
  }
  await budget.destroy();
  res.json({ message: 'Presupuesto eliminado correctamente.' });
});

module.exports = {
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  createPortfolioBudget,
  updatePortfolioBudget,
  deletePortfolioBudget
};
