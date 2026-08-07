const morgan = require('morgan');
const logger = require('../config/logger');

// Formato personalizado para HTTP Access Logs
const accessLogFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

const stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

const httpLogger = morgan(accessLogFormat, { stream });

module.exports = httpLogger;
