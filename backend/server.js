require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models/index');
const umzug = require('./migrate');
const { verifyToken } = require('./middlewares/auth');
const { checkMaintenance } = require('./middlewares/maintenance');
const { errorHandler } = require('./middlewares/errorHandler');

// Prevent Node process crashes from throwing 502 Bad Gateway on IIS
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [PROCESS WARNING] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ [PROCESS ERROR] Uncaught Exception thrown:', err);
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const vendorRoutes = require('./routes/vendor.routes');
const metaRoutes = require('./routes/meta.routes');
const itemRoutes = require('./routes/item.routes');
const adminRoutes = require('./routes/admin.routes');
const searchRoutes = require('./routes/search.routes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

const isProdOrPre = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'pre';

// Global Middlewares (FEATURE-43: HSTS en producción/pre)
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: isProdOrPre ? { maxAge: 31536000, includeSubDomains: true } : false
}));

// FEATURE-44: Política estricta de CORS sin comodín '*'
const trustedOrigins = ['https://pmo.dacsa.com', 'https://prepmo.dacsa.com', 'http://localhost:5173', 'http://localhost:5000', 'http://localhost:5100'];
const allowedOrigins = process.env.FRONTEND_URL ? [...new Set([process.env.FRONTEND_URL, ...trustedOrigins])] : trustedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }
    return callback(new Error('Acceso restringido por política de seguridad CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


// Production: serve frontend static files (before auth to skip JWT)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Apply global JWT Authentication Middleware
app.use(verifyToken);

// Apply Maintenance Mode Middleware
app.use(checkMaintenance);

// Register API Routes
app.use('/api', authRoutes);
app.use('/api', projectRoutes);
app.use('/api', vendorRoutes);
app.use('/api', metaRoutes);
app.use('/api', itemRoutes);
app.use('/api', adminRoutes);
app.use('/api/search', searchRoutes);

// API 404 JSON Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: `HAY UN ERROR EN EL BACKEND (HTTP 404): Ruta de API no encontrada (${req.method} ${req.originalUrl})` 
  });
});

// Global Error Handler Middleware
app.use(errorHandler);


// Database Initialization and Server Start
if (process.env.NODE_ENV !== 'test') {
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Connection to database established successfully.');
      return umzug.up();
    })
    .then((migrations) => {
      if (migrations.length > 0) {
        console.log(`✅ Executed ${migrations.length} migrations`);
      } else {
        console.log('✅ Database is up to date');
      }
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT} and listening on 0.0.0.0`);
      });
    })
    .catch(err => {
      console.error('❌ Error during database initialization:', err);
    });
}

module.exports = app;
