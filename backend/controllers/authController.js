const { login, verify, changePassword, updateLanguage } = require('./auth/local.controller');
const { loginAzure } = require('./auth/azure.controller');

module.exports = {
  login,
  verify,
  changePassword,
  updateLanguage,
  loginAzure
};
