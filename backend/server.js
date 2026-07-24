require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models/index');
const umzug = require('./migrate');
const { verifyToken } = require('./middlewares/auth');
const { errorHandler } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const vendorRoutes = require('./routes/vendor.routes');
const metaRoutes = require('./routes/meta.routes');
const itemRoutes = require('./routes/item.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: false
}));

const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*';
app.use(cors({
  origin: allowedOrigins,
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

// Register API Routes
app.use('/api', authRoutes);
app.use('/api', projectRoutes);
app.use('/api', vendorRoutes);
app.use('/api', metaRoutes);
app.use('/api', itemRoutes);
app.use('/api', adminRoutes);

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
