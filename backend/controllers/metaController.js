const { 
  getSedes, getContactos, getPms, getChangelog, 
  getPortfolioStates, getPortfolioWorkflows, getPortfolios, getTags, createTag, 
  getCapexTypes, getPortfolioBudgets, getInvoiceTypes, getHealth, getBootstrap 
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
  getPortfolioWorkflows,
  getPortfolioDashboard,
  getTimeline,
  getPortfolios,
  getTags,
  createTag,
  getCapexTypes,
  getPortfolioBudgets,
  getPortfolioBudgetReport,
  getInvoiceTypes,
  getHealth,
  getBootstrap
};

