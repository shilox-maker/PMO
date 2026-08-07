const path = require('path');
const fs = require('fs');
const winston = require('winston');
require('winston-daily-rotate-file');

// Directo fuera del proyecto (un nivel por detrás del proyecto: ../pmo-logs)
const logDir = process.env.LOG_DIR 
  ? path.resolve(process.env.LOG_DIR)
  : path.resolve(__dirname, '../../../pmo-logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para fichero
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato personalizado para consola
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Transport rotativo para errores
const errorRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true
});

// Transport rotativo para access logs (HTTP)
const accessRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true
});

// Transport rotativo combinado
const combinedRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports: [
    errorRotateTransport,
    accessRotateTransport,
    combinedRotateTransport
  ]
});

// Añadir consola en todos los entornos
logger.add(new winston.transports.Console({
  format: consoleFormat
}));

logger.logDir = logDir;

module.exports = logger;
