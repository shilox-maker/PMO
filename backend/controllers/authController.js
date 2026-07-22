const { login, verify, changePassword } = require('./auth/local.controller');
const { loginAzure } = require('./auth/azure.controller');

module.exports = {
  login,
  verify,
  changePassword,
  loginAzure
};
