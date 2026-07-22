const { createSede, updateSede, deleteSede } = require('./admin/sede.controller');
const { getStates, createState, updateState, deleteState } = require('./admin/state.controller');
const { getUsers, createUser, updateUser, deleteUser } = require('./admin/user.controller');
const { createPortfolio, updatePortfolio, deletePortfolio, createPortfolioBudget, updatePortfolioBudget, deletePortfolioBudget } = require('./admin/portfolio.controller');
const { getTiposCapex, createTipoCapex, updateTipoCapex, deleteTipoCapex, createSubtipoCapex, updateSubtipoCapex, deleteSubtipoCapex } = require('./admin/capex.controller');

module.exports = {
  createSede,
  updateSede,
  deleteSede,
  getStates,
  createState,
  updateState,
  deleteState,
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
  deletePortfolioBudget
};
