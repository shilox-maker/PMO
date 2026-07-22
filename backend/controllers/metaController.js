const { 
  getSedes, getContactos, getPms, getChangelog, 
  getPortfolioStates, getPortfolios, getTags, createTag, 
  getCapexTypes, getPortfolioBudgets 
} = require('./meta/taxonomy.controller');

const { 
  getPortfolioDashboard, getTimeline, getPortfolioBudgetReport 
} = require('./meta/dashboard.controller');

module.exports = {
  getSedes,
  getContactos,
  getPms,
  getChangelog,
  getPortfolioStates,
  getPortfolioDashboard,
  getTimeline,
  getPortfolios,
  getTags,
  createTag,
  getCapexTypes,
  getPortfolioBudgets,
  getPortfolioBudgetReport
};
