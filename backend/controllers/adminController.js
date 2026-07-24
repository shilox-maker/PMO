const { createSede, updateSede, deleteSede } = require('./admin/sede.controller');
const { getStates, createState, updateState, deleteState, createStateTask, deleteStateTask } = require('./admin/state.controller');

const { getUsers, createUser, updateUser, deleteUser } = require('./admin/user.controller');
const { createPortfolio, updatePortfolio, deletePortfolio, createPortfolioBudget, updatePortfolioBudget, deletePortfolioBudget } = require('./admin/portfolio.controller');
const { getTiposCapex, createTipoCapex, updateTipoCapex, deleteTipoCapex, createSubtipoCapex, updateSubtipoCapex, deleteSubtipoCapex } = require('./admin/capex.controller');
const { getTiposFactura, createTipoFactura, updateTipoFactura, deleteTipoFactura } = require('./admin/invoiceTypes.controller');

module.exports = {
  createSede,
  updateSede,
  deleteSede,
  getStates,
  createState,
  updateState,
  deleteState,
  createStateTask,
  deleteStateTask,

  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getTiposCapex,
  createTipoCapex,
  updateTipoCapex,
  deleteTipoCapex,
  createSubtipoCapex,
  updateSubtipoCapex,
  deleteSubtipoCapex,
  createPortfolioBudget,
  updatePortfolioBudget,
  deletePortfolioBudget,
  getTiposFactura,
  createTipoFactura,
  updateTipoFactura,
  deleteTipoFactura
};
