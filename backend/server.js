const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ExcelJS = require('exceljs');
const { 
  sequelize, Sedes, Proveedores, ContactosProveedor, Usuarios, KeyUsers, 
  Proyectos, ProyectoKeyUsers, ProyectoComSemanalKU, ProyectoComMensualKU, 
  ProyectoComSteerCoKU, Incidencias, Riesgos, LeccionesAprendidas, Facturas, 
  CambiosAlcance, Tareas, EstadosProyecto, ComentariosProyecto 
} = require('./models/index');
const { getProjectCalculations } = require('./models/automations');

const app = express();
const PORT = process.env.PORT || 5000;
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'pmo-secret-key-change-in-production') {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: JWT_SECRET not set or using default key in production! Generating a secure random key for this session...');
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
  } else {
    JWT_SECRET = 'pmo-secret-key-change-in-production';
  }
}

// Security Headers
app.use(helmet());

// Login Rate Limiter (10 req / 15 min)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login, por favor intenta más tarde.' }
});

// Enable CORS for frontend requests (Restrict to frontend URL in production)
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*';
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Auth Middleware: Verify JWT from Authorization header
app.use((req, res, next) => {
  // Ignorar middleware de auth en login (que maneja su propio error si falla)
  if (req.path === '/api/login') {
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.currentPmId = decoded.id_usuario;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
  } else {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
  }
});

// Helper: Format error messages
const handleErr = (res, error, status = 400) => {
  console.error(error);
  res.status(status).json({ error: error.message || 'Error del servidor' });
};

// Helper: Password Hashing using bcrypt
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Helper: Validate ISO 8601 date (YYYY-MM-DD)
function isValidISODate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

// Middleware: Validate date in task creation / update
function validateTaskDate(req, res, next) {
  const { fecha_limite } = req.body;
  if (fecha_limite !== undefined) {
    if (!isValidISODate(fecha_limite)) {
      return res.status(400).json({ error: 'La fecha límite de la tarea debe tener el formato YYYY-MM-DD y ser una fecha válida.' });
    }
  }
  next();
}

// Middleware: Restrict access to administrators
async function restrictToAdmin(req, res, next) {
  const pmId = req.currentPmId;
  if (!pmId) {
    return res.status(401).json({ error: 'Acceso denegado. Inicie sesión.' });
  }
  try {
    const user = await Usuarios.findByPk(pmId);
    if (!user || user.perfil !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso restringido a administradores.' });
    }
    next();
  } catch (error) {
    handleErr(res, error, 500);
  }
}

// Helper: Sanitize HTML content to prevent Stored XSS
function sanitizeHTML(html) {
  if (typeof html !== 'string') return '';
  
  // 1. Remove script tags and their content
  let clean = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  
  // 2. Remove style tags and their content
  // clean = clean.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, ''); // Permitted style
  
  // 3. Remove inline events (onmouseover, onclick, onerror, etc.)
  clean = clean.replace(/on\w+\s*=\s*(['"])(.*?)\1/gi, '');
  clean = clean.replace(/on\w+\s*=\s*([^\s>]+)/gi, '');
  
  // 4. Remove javascript: URIs
  clean = clean.replace(/href\s*=\s*(['"])\s*javascript:(.*?)\1/gi, '');
  clean = clean.replace(/href\s*=\s*javascript:([^\s>]+)/gi, '');
  
  // 5. Remove other risky protocols (allow data:image/... for embedded images)
  clean = clean.replace(/href\s*=\s*(['"])\s*(data|vbscript):(.*?)\1/gi, '');
  clean = clean.replace(/src\s*=\s*(['"])\s*(data:(?!image\/)|javascript|vbscript):(.*?)\1/gi, '');

  // 6. Strip non-whitelisted HTML tags
  clean = clean.replace(/<[^>]+>/g, (match) => {
    if (match.match(/^<\/?(p|strong|em|br|ul|ol|li|span|div|h1|h2|h3|h4|h5|h6|blockquote|table|thead|tbody|tr|th|td|b|i|u|s|font|img)(\s[^>]*)?>$/i)) {
      return match.replace(/\s+on\w+\s*=\s*(['"])(.*?)\1/gi, '')
                  .replace(/\s+on\w+\s*=\s*([^\s>]+)/gi, '')
                  .replace(/\s+href\s*=\s*(['"])\s*javascript:(.*?)\1/gi, '')
                  .replace(/\s+href\s*=\s*javascript:([^\s>]+)/gi, '');
    }
    return '';
  });
  
  return clean;
}

// Helper: Sanitize values for Excel export to prevent Formula / CSV Injection
function sanitizeExcelValue(val) {
  if (typeof val !== 'string') return val;
  if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
    return `'${val}`;
  }
  return val;
}

// Helper: Auto-generate code IDs (Format: PREFIX-YYYY-XXX)
async function generateNextId(Model, prefix, keyName) {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;
  
  const lastRecord = await Model.findOne({
    where: {
      [keyName]: {
        [Op.like]: pattern
      }
    },
    order: [[keyName, 'DESC']]
  });

  let nextNum = 1;
  if (lastRecord) {
    const lastId = lastRecord[keyName];
    const parts = lastId.split('-');
    if (parts.length === 3) {
      const lastNum = parseInt(parts[2], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
  }
  
  const paddedNum = String(nextNum).padStart(3, '0');
  return `${prefix}-${year}-${paddedNum}`;
}

// ==========================================
// 0. System Info / Changelog
// ==========================================
app.get('/api/changelog', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'CHANGELOG.md');
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Error reading changelog.' });
  }
});

// ==========================================
// 1. Authentication / Login Endpoint
// ==========================================
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'El correo y la contraseña son obligatorios.' });
    }

    const user = await Usuarios.scope('withPassword').findOne({ where: { correo } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no registrado o credenciales incorrectas.' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Tu usuario se encuentra inactivo. Contacta a un administrador.' });
    }

    let isValid = false;
    
    // Si la contraseña parece estar hasheada con bcrypt (empieza por $2a$ o $2b$)
    if (user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Soporte legado para SHA256 (para poder migrar sin que los usuarios pierdan acceso)
      let hashedInput;
      if (!user.password_salt) {
        hashedInput = crypto.createHash('sha256').update(password).digest('hex');
      } else {
        hashedInput = crypto.createHash('sha256').update(password + user.password_salt).digest('hex');
      }
      
      if (user.password === hashedInput) {
        isValid = true;
        // Migrar automáticamente la contraseña a Bcrypt
        const newHash = await hashPassword(password);
        await user.update({ password: newHash, password_salt: null }); // Salt ya no es necesario con bcrypt
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id_usuario: user.id_usuario, perfil: user.perfil },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellidos: user.apellidos,
        correo: user.correo,
        perfil: user.perfil,
        activo: user.activo
      }
    });
  } catch (error) {
    handleErr(res, error);
  }
});

// Auth Verify Endpoint (Para cuando el frontend recarga la página con el JWT en el Header)
app.get('/api/auth/verify', async (req, res) => {
  try {
    const pmId = req.currentPmId;
    if (!pmId) {
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }

    const user = await Usuarios.findByPk(pmId);
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Usuario inactivo o no encontrado.' });
    }

    res.json({
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellidos: user.apellidos,
        correo: user.correo,
        perfil: user.perfil,
        activo: user.activo
      }
    });
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 2. PMs / Active Users Endpoints
// ==========================================
app.get('/api/pms', async (req, res) => {
  try {
    const pms = await Usuarios.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });
    res.json(pms);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 3. Sedes Endpoints
// ==========================================

// ==========================================
// 3.5 Sedes CRUD
// ==========================================
app.post('/api/sedes', async (req, res) => {
  try {
    const sede = await Sedes.create(req.body);
    res.status(201).json(sede);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/sedes/:id', async (req, res) => {
  try {
    const sede = await Sedes.findByPk(req.params.id);
    if (!sede) return res.status(404).json({ error: 'Not found' });
    await sede.update(req.body);
    res.json(sede);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/sedes/:id', async (req, res) => {
  try {
    const sede = await Sedes.findByPk(req.params.id);
    if (!sede) return res.status(404).json({ error: 'Not found' });
    await sede.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/sedes', async (req, res) => {
  try {
    const sedes = await Sedes.findAll({ order: [['nombre_sede', 'ASC']] });
    res.json(sedes);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 4. Key Users Endpoints
// ==========================================
app.get('/api/key-users', async (req, res) => {
  try {
    const kus = await KeyUsers.findAll({
      include: [{ model: Proveedores, attributes: ['nombre_razon_social'] }],
      order: [['nombre', 'ASC']]
    });
    res.json(kus);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 5. Portfolio Optimized Dashboard Endpoints
// ==========================================

// Get unique project states from table Estados_Proyecto
app.get('/api/portfolio/states', async (req, res) => {
  try {
    const states = await EstadosProyecto.findAll({
      order: [['orden', 'ASC']]
    });
    res.json(states);
  } catch (error) {
    handleErr(res, error);
  }
});

// Get consolidated portfolio dashboard data with date range and PM filtering
app.get('/api/portfolio/dashboard', async (req, res) => {
  try {
    const { pm, fecha_desde, fecha_hasta, search, vendor, rag, state } = req.query;
    
    const where = {};
    if (pm) {
      where.id_pm = parseInt(pm, 10);
    }
    if (vendor) {
      where.id_proveedor = parseInt(vendor, 10);
    }
    if (rag) {
      where.indicador_rag = rag;
    }
    if (search) {
      where.nombre_proyecto = { [Op.like]: `%${search}%` };
    }

    const projectsList = await Proyectos.findAll({
      where,
      include: [
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
        { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
        { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
        { 
          model: EstadosProyecto, 
          as: 'Estado', 
          attributes: ['nombre_estado', 'icono'],
          ...(state ? { where: { nombre_estado: { [Op.in]: state.split(',') } } } : {})
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const dashboardData = await Promise.all(
      projectsList.map(async (p) => {
        const id_proyecto = p.id_proyecto;
        
        // 1. Approved delay days
        const approvedCRs = await CambiosAlcance.findAll({
          where: { id_proyecto, estado_cambio: 'APROBADO' }
        });
        let totalCRDays = 0;
        approvedCRs.forEach(cr => {
          if (cr.impacta_tiempo) {
            totalCRDays += parseInt(cr.dias_impacto || 0, 10);
          }
        });

        // Calculate estimated end date
        const initialEndDate = new Date(p.fecha_fin_inicial);
        initialEndDate.setDate(initialEndDate.getDate() + totalCRDays);
        const year = initialEndDate.getFullYear();
        const month = String(initialEndDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialEndDate.getDate()).padStart(2, '0');
        const fecha_fin_estimada = `${year}-${month}-${day}`;

        // 2. Committed budget (status RECIBIDA or PENDIENTE_DE_RECIBIR) and PO gathering
        const invoices = await Facturas.findAll({
          where: { id_proyecto }
        });
        let gasto_total_facturas = 0;
        let pos = new Set();
        invoices.forEach(f => {
          if (f.PO) pos.add(f.PO);
          if (f.estado === 'RECIBIDA' || f.estado === 'PENDIENTE_DE_RECIBIR') {
            gasto_total_facturas += parseFloat(f.importe || 0);
          }
        });
        const po_list = Array.from(pos).join(', ');

        // 3. Next pending milestone
        const nextMilestone = await Tareas.findOne({
          where: {
            id_proyecto,
            es_hito: true,
            estado: 'PENDIENTE'
          },
          order: [['fecha_limite', 'ASC']]
        });

        // 4. Overdue milestones indicator (pending milestone with deadline in past)
        const overdueCount = await Tareas.count({
          where: {
            id_proyecto,
            es_hito: true,
            estado: 'PENDIENTE',
            fecha_limite: { [Op.lt]: todayStr }
          }
        });

        // 5. Inactivity checking: max updatedAt across related tables in past 30 days
        let maxUpdated = new Date(p.updatedAt);
        const childTables = [Facturas, CambiosAlcance, Riesgos, Incidencias, Tareas];
        for (const Model of childTables) {
          const latestChild = await Model.findOne({
            where: { id_proyecto },
            order: [['updatedAt', 'DESC']]
          });
          if (latestChild && new Date(latestChild.updatedAt) > maxUpdated) {
            maxUpdated = new Date(latestChild.updatedAt);
          }
        }


        const lastComment = await ComentariosProyecto.findOne({
          where: { id_proyecto },
          order: [['fecha_registro', 'DESC']]
        });
        const ultimo_comentario = lastComment ? lastComment.texto_comentario.replace(/<[^>]+>/g, '').substring(0, 100) + (lastComment.texto_comentario.length > 100 ? '...' : '') : '';

        return {
          id_proyecto: p.id_proyecto,
          nombre_proyecto: p.nombre_proyecto,
          id_pm: p.id_pm,
          pm_nombre: p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin PM',
          id_proveedor: p.id_proveedor,
          prov_nombre: p.Proveedor ? p.Proveedor.nombre_razon_social : 'Sin Partner',
          sede_nombre: p.Sede ? p.Sede.nombre_sede : '',
          id_estado: p.id_estado,
          estado_proyecto: p.Estado ? p.Estado.nombre_estado : 'Sin Estado',
          estado_icono: p.Estado ? p.Estado.icono : '❓',
          indicador_rag: p.indicador_rag,
          es_capex: p.es_capex,
          codigo_capex: p.codigo_capex,
          budget_inicial: parseFloat(p.budget_inicial),
          fecha_inicio: p.fecha_inicio,
          fecha_fin_inicial: p.fecha_fin_inicial,
          fecha_fin_estimada,
          dias_retraso_aprobados: totalCRDays,
          gasto_total_facturas: Number(gasto_total_facturas.toFixed(2)),
          po_list,
          proximo_hito: nextMilestone ? { titulo_tarea: nextMilestone.titulo_tarea, fecha_limite: nextMilestone.fecha_limite } : null,
          has_hito_vencido: overdueCount > 0,
          com_semanal_activo: p.com_semanal_activo,
          com_mensual_activo: p.com_mensual_activo,
          com_steerco_activo: p.com_steerco_activo,
          ultima_actualizacion: maxUpdated.toISOString(),
          ultimo_comentario
        };
      })
    );

    // Apply time-range filter on calculated estimated dates
    let finalData = dashboardData;
    if (fecha_desde || fecha_hasta) {
      finalData = dashboardData.filter(p => {
        const matchesDesde = !fecha_desde || p.fecha_fin_estimada >= fecha_desde;
        const matchesHasta = !fecha_hasta || p.fecha_inicio <= fecha_hasta;
        return matchesDesde && matchesHasta;
      });
    }

    res.json(finalData);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 5.5 Timeline / Gantt (Portfolio View)
// ==========================================
app.get('/api/timeline', async (req, res) => {
  try {
    const projects = await Proyectos.findAll({
      include: [
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
        { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'icono', 'proyecto_cerrado'] },
        { model: Tareas, where: { es_hito: true }, required: false, attributes: ['id_tarea', 'titulo_tarea', 'fecha_limite', 'estado'] }
      ],
      order: [['fecha_inicio', 'ASC']]
    });

    const timelineData = await Promise.all(
      projects.map(async (p) => {
        const calc = await getProjectCalculations(p.id_proyecto, p.budget_inicial, p.fecha_fin_inicial);
        return {
          id_proyecto: p.id_proyecto,
          nombre_proyecto: p.nombre_proyecto,
          pm_nombre: p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin PM',
          prov_nombre: p.Proveedor ? p.Proveedor.nombre_razon_social : 'Sin Partner',
          indicador_rag: p.indicador_rag,
          estado_proyecto: p.Estado ? p.Estado.nombre_estado : 'Sin Estado',
          proyecto_cerrado: p.Estado ? p.Estado.proyecto_cerrado : false,
          fecha_inicio: p.fecha_inicio,
          fecha_fin_estimada: calc.fecha_fin_estimada,
          fecha_kickoff: p.fecha_kickoff,
          fecha_go_live: p.fecha_go_live,
          hitos: (p.Tareas || []).map(t => ({
            id_tarea: t.id_tarea,
            titulo_tarea: t.titulo_tarea,
            fecha_limite: t.fecha_limite,
            estado: t.estado
          }))
        };
      })
    );

    res.json(timelineData);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 6. Proyectos (Portfolio Dashboard & CRUD)
// ==========================================

// Get all projects with filters and calculations
app.get('/api/projects', async (req, res) => {
  try {
    const { pm, vendor, rag, search, state } = req.query;
    
    // Construct query filters
    const where = {};
    if (pm) where.id_pm = pm;
    if (vendor) where.id_proveedor = vendor;
    if (rag) where.indicador_rag = rag;
    if (search) {
      where.nombre_proyecto = { [Op.like]: `%${search}%` };
    }

    const projectsList = await Proyectos.findAll({
      where,
      include: [
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos', 'correo'] },
        { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
        { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
        { model: KeyUsers, as: 'Sponsor', attributes: ['nombre', 'apellidos'] },
        { 
          model: EstadosProyecto, 
          as: 'Estado', 
          attributes: ['id_estado', 'nombre_estado', 'icono'],
          ...(state ? { where: { nombre_estado: { [Op.in]: state.split(',') } } } : {})
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Populate calculations and next milestone for each project
    const projectsWithCalculations = await Promise.all(
      projectsList.map(async (project) => {
        const calc = await getProjectCalculations(
          project.id_proyecto,
          project.budget_inicial,
          project.fecha_fin_inicial
        );

        const nextMilestone = await Tareas.findOne({
          where: {
            id_proyecto: project.id_proyecto,
            es_hito: true,
            estado: 'PENDIENTE'
          },
          order: [['fecha_limite', 'ASC']]
        });

        return {
          ...project.toJSON(),
          calculations: calc,
          nextMilestone: nextMilestone ? nextMilestone.toJSON() : null
        };
      })
    );

    res.json(projectsWithCalculations);
  } catch (error) {
    handleErr(res, error);
  }
});

// Export projects list to Excel format (.xlsx)
app.get('/api/projects/export', async (req, res) => {
  try {
    const { pm, vendor, rag, search, state, cols } = req.query;

    const where = {};
    if (pm) where.id_pm = pm;
    if (vendor) where.id_proveedor = vendor;
    if (rag) where.indicador_rag = rag;
    if (search) {
      where.nombre_proyecto = { [Op.like]: `%${search}%` };
    }
    if (state) {
      where['$Estado.nombre_estado$'] = state;
    }

    const projectsList = await Proyectos.findAll({
      where,
      include: [
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
        { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
        { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado', 'icono'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Proyectos');

    // Define columns structure
    let exportCols = [
      { header: 'Código', key: 'id_proyecto', width: 15 },
      { header: 'Nombre del Proyecto', key: 'nombre_proyecto', width: 30 },
      { header: 'Estado / Fase', key: 'estado_proyecto', width: 15 },
      { header: 'RAG', key: 'indicador_rag', width: 12 },
      { header: 'Socio Tecnológico', key: 'proveedor', width: 25 },
      { header: 'Gestor PM', key: 'pm', width: 20 },
      { header: 'Sede', key: 'sede', width: 15 },
      { header: 'PO (Purchase Order)', key: 'po_list', width: 20 },
      { header: 'Presupuesto Inicial', key: 'budget_inicial', width: 20 },
      { header: 'Budget Actualizado', key: 'budget_actualizado', width: 20 },
      { header: 'Consumo Real', key: 'consumo_real', width: 20 },
      { header: 'Presupuesto Disponible', key: 'presupuesto_disponible', width: 22 },
      { header: 'Fecha Inicio', key: 'fecha_inicio', width: 15 },
      { header: 'Fecha Fin Inicial', key: 'fecha_fin_inicial', width: 15 },
      { header: 'Fecha Fin Estimada', key: 'fecha_fin_estimada', width: 18 }
    ];

    if (cols) {
      const allowedCols = cols.split(',');
      exportCols = exportCols.filter(c => allowedCols.includes(c.key) || c.key === 'id_proyecto' || c.key === 'nombre_proyecto');
    }

    worksheet.columns = exportCols;

    // Format headers (dark mode themed)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1A1A2E' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

    for (const p of projectsList) {
      const id_proyecto = p.id_proyecto;

      // Approved CR calculations
      const approvedCRs = await CambiosAlcance.findAll({
        where: { id_proyecto, estado_cambio: 'APROBADO' }
      });
      let totalCRDays = 0;
      let totalCRAmount = 0;
      approvedCRs.forEach(cr => {
        if (cr.impacta_tiempo) {
          totalCRDays += parseInt(cr.dias_impacto || 0, 10);
        }
        if (cr.impacta_importe) {
          totalCRAmount += parseFloat(cr.importe_impacto || 0);
        }
      });

      const budget_inicial = parseFloat(p.budget_inicial) || 0;
      const budget_actualizado = budget_inicial + totalCRAmount;

      const initialEndDate = new Date(p.fecha_fin_inicial);
      initialEndDate.setDate(initialEndDate.getDate() + totalCRDays);
      const year = initialEndDate.getFullYear();
      const month = String(initialEndDate.getMonth() + 1).padStart(2, '0');
      const day = String(initialEndDate.getDate()).padStart(2, '0');
      const fecha_fin_estimada = `${year}-${month}-${day}`;

      // Invoices sum and PO gathering
      const invoices = await Facturas.findAll({
        where: { id_proyecto }
      });
      let consumo_real = 0;
      let pos = new Set();
      invoices.forEach(f => {
        if (f.PO) pos.add(f.PO);
        if (f.estado === 'RECIBIDA' || f.estado === 'PENDIENTE_DE_RECIBIR') {
          consumo_real += parseFloat(f.importe || 0);
        }
      });
      const po_list = Array.from(pos).join(', ');

      const presupuesto_disponible = budget_actualizado - consumo_real;

      // Filter by estimated end dates if timeframe is specified
      if (fecha_desde && fecha_fin_estimada < fecha_desde) continue;
      if (fecha_hasta && p.fecha_inicio > fecha_hasta) continue;

      const row = worksheet.addRow({
        id_proyecto: sanitizeExcelValue(p.id_proyecto),
        nombre_proyecto: sanitizeExcelValue(p.nombre_proyecto),
        estado_proyecto: sanitizeExcelValue(p.Estado ? p.Estado.nombre_estado : 'Sin Estado'),
        indicador_rag: sanitizeExcelValue(p.indicador_rag),
        proveedor: sanitizeExcelValue(p.Proveedor ? p.Proveedor.nombre_razon_social : 'Sin Partner'),
        pm: sanitizeExcelValue(p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin PM'),
        sede: sanitizeExcelValue(p.Sede ? p.Sede.nombre_sede : ''),
        po_list: sanitizeExcelValue(po_list),
        budget_inicial,
        budget_actualizado,
        consumo_real,
        presupuesto_disponible,
        fecha_inicio: p.fecha_inicio,
        fecha_fin_inicial: p.fecha_fin_inicial,
        fecha_fin_estimada
      });

      // Excel formatting for monetary cells
      row.getCell('budget_inicial').numFmt = '#,##0.00" €"';
      row.getCell('budget_actualizado').numFmt = '#,##0.00" €"';
      row.getCell('consumo_real').numFmt = '#,##0.00" €"';
      row.getCell('presupuesto_disponible').numFmt = '#,##0.00" €"';
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Reporte_Proyectos.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    handleErr(res, error);
  }
});

// Get single project detailed info
app.get('/api/projects/:id_proyecto', async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    
    const project = await Proyectos.findByPk(id_proyecto, {
      include: [
        { model: Usuarios, as: 'PM', attributes: ['id_usuario', 'nombre', 'apellidos', 'correo'] },
        { model: Proveedores, as: 'Proveedor', attributes: ['id_proveedor', 'nombre_razon_social'] },
        { model: Sedes, as: 'Sede', attributes: ['id_sede', 'nombre_sede'] },
        { model: KeyUsers, as: 'Sponsor', attributes: ['id_ku', 'nombre', 'apellidos', 'correo'] },
        { model: KeyUsers, as: 'InvolvedKeyUsers', through: { attributes: ['rol', 'raci'] } },
        { model: KeyUsers, as: 'ComSemanalKUs', through: { attributes: [] } },
        { model: KeyUsers, as: 'ComMensualKUs', through: { attributes: [] } },
        { model: KeyUsers, as: 'ComSteerCoKUs', through: { attributes: [] } },
        { model: Incidencias, order: [['fecha_apertura', 'DESC']] },
        { model: Riesgos, order: [['fecha_proxima_revision', 'ASC']] },
        { model: LeccionesAprendidas, order: [['fecha_registro', 'DESC']] },
        { model: Facturas, order: [['fecha_factura', 'DESC']] },
        { model: CambiosAlcance, include: [
          { model: KeyUsers, as: 'Solicitante', attributes: ['nombre', 'apellidos'] },
          { model: KeyUsers, as: 'Aprobador', attributes: ['nombre', 'apellidos'] }
        ], order: [['fecha_solicitud', 'DESC']] },
        { model: Tareas, order: [['fecha_limite', 'ASC']] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'icono'] }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const calc = await getProjectCalculations(
      project.id_proyecto,
      project.budget_inicial,
      project.fecha_fin_inicial
    );

    res.json({
      ...project.toJSON(),
      calculations: calc
    });
  } catch (error) {
    handleErr(res, error);
  }
});

// Helper: Resolve legacy estado_proyecto string to id_estado
async function resolveStateId(data) {
  if (data.estado_proyecto && !data.id_estado) {
    const stateObj = await EstadosProyecto.findOne({ where: { nombre_estado: data.estado_proyecto } });
    if (stateObj) {
      data.id_estado = stateObj.id_estado;
    } else {
      const firstState = await EstadosProyecto.findOne({ order: [['orden', 'ASC']] });
      if (firstState) data.id_estado = firstState.id_estado;
    }
  }
}

// Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const data = req.body;

    // Sanitize rich text inputs
    const richTextFields = [
      'alcance_por_que', 'alcance_objetivo', 'alcance_resultados', 
      'alcance_limitaciones', 'alcance_integraciones', 'alcance_desarrollo',
      'cierre_aceptacion', 'cierre_exito'
    ];
    richTextFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        data[field] = sanitizeHTML(data[field]);
      }
    });

    // Validate CAPEX requirements
    if (data.es_capex && (!data.codigo_capex || data.codigo_capex.trim() === '')) {
      return res.status(400).json({ error: 'El código CAPEX es obligatorio para proyectos CAPEX.' });
    }

    // Validate ISO date format for lifecycle dates
    const dateFields = [
      'fecha_peticion', 'fecha_alcance_definido', 'fecha_aprobacion', 
      'fecha_planificacion', 'fecha_kickoff', 'fecha_go_live', 'fecha_cierre'
    ];
    for (const field of dateFields) {
      if (data[field] && data[field].trim() !== '') {
        if (!isValidISODate(data[field])) {
          return res.status(400).json({ error: `La fecha ${field} no cumple con el formato ISO 8601 (YYYY-MM-DD).` });
        }
      }
    }

    // Auto-generate project code if missing
    if (!data.id_proyecto || data.id_proyecto.trim() === '') {
      data.id_proyecto = await generateNextId(Proyectos, 'PRJ', 'id_proyecto');
    } else {
      const idRegex = /^PRJ-\d{4}-\d{3}$/;
      if (!idRegex.test(data.id_proyecto)) {
        return res.status(400).json({ error: 'El ID del proyecto debe tener el formato PRJ-YYYY-XXX.' });
      }
    }

    // Resolve state name to state ID if needed
    await resolveStateId(data);

    // Fallback: If still no id_estado, assign first state in DB
    if (!data.id_estado) {
      const firstState = await EstadosProyecto.findOne({ order: [['orden', 'ASC']] });
      if (firstState) data.id_estado = firstState.id_estado;
    }

    const project = await Proyectos.create(data);

    // Add Many-to-Many associations if provided
    if (data.involvedKus) await project.setInvolvedKeyUsers(data.involvedKus);
    if (data.comSemanalKus) await project.setComSemanalKUs(data.comSemanalKus);
    if (data.comMensualKus) await project.setComMensualKUs(data.comMensualKus);
    if (data.comSteercoKus) await project.setComSteerCoKUs(data.comSteercoKus);

    res.status(201).json(project);
  } catch (error) {
    handleErr(res, error);
  }
});

// Update project
app.put('/api/projects/:id_proyecto', async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const data = req.body;

    // Sanitize rich text inputs
    const richTextFields = [
      'alcance_por_que', 'alcance_objetivo', 'alcance_resultados', 
      'alcance_limitaciones', 'alcance_integraciones', 'alcance_desarrollo',
      'cierre_aceptacion', 'cierre_exito'
    ];
    richTextFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        data[field] = sanitizeHTML(data[field]);
      }
    });

    const project = await Proyectos.findByPk(id_proyecto);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Validate CAPEX requirements
    if (data.es_capex && (!data.codigo_capex || data.codigo_capex.trim() === '')) {
      return res.status(400).json({ error: 'El código CAPEX es obligatorio para proyectos CAPEX.' });
    }    // Validate ISO date format for lifecycle dates
    const dateFields = [
      'fecha_peticion', 'fecha_alcance_definido', 'fecha_aprobacion', 
      'fecha_planificacion', 'fecha_kickoff', 'fecha_go_live', 'fecha_cierre'
    ];
    for (const field of dateFields) {
      if (data[field] && data[field].trim() !== '') {
        if (!isValidISODate(data[field])) {
          return res.status(400).json({ error: `La fecha ${field} no cumple con el formato ISO 8601 (YYYY-MM-DD).` });
        }
      }
    }

    // Resolve state name to state ID if needed
    await resolveStateId(data);

    // Auditoría de cambios (Fechas y Presupuesto)
    const autorId = req.currentPmId || 0;
    const autorObj = await Usuarios.findByPk(autorId);
    const nombreAutor = autorObj ? `${autorObj.nombre} ${autorObj.apellidos}` : 'Sistema';

    // Auto-fill dates on status change
    let newStatusName = '';
    if (data.id_estado !== undefined) {
      const stateObj = await EstadosProyecto.findByPk(data.id_estado);
      if (stateObj) {
        newStatusName = stateObj.nombre_estado;
      }
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (newStatusName === 'Kickoff') {
      const currentKickoff = data.fecha_kickoff !== undefined ? data.fecha_kickoff : project.fecha_kickoff;
      if (!currentKickoff || currentKickoff.trim() === '') {
        data.fecha_kickoff = todayStr;
        await ComentariosProyecto.create({
          id_proyecto,
          texto_comentario: `El sistema ha registrado automáticamente la <strong>Fecha de Kickoff</strong> como ${todayStr} al cambiar el estado a Kickoff.`,
          id_usuario: autorId,
          es_importante: true
        });
      }
    }
    if (newStatusName === 'Go Live') {
      const currentGoLive = data.fecha_go_live !== undefined ? data.fecha_go_live : project.fecha_go_live;
      if (!currentGoLive || currentGoLive.trim() === '') {
        data.fecha_go_live = todayStr;
        await ComentariosProyecto.create({
          id_proyecto,
          texto_comentario: `El sistema ha registrado automáticamente la <strong>Fecha de Go Live</strong> como ${todayStr} al cambiar el estado a Go Live.`,
          id_usuario: autorId,
          es_importante: true
        });
      }
    }

    if (data.fecha_fin_inicial && project.fecha_fin_inicial !== data.fecha_fin_inicial) {
      await ComentariosProyecto.create({
        id_proyecto,
        texto_comentario: `El usuario <strong>${nombreAutor}</strong> ha modificado la <strong>Fecha Fin Base</strong> de ${project.fecha_fin_inicial || 'N/A'} a ${data.fecha_fin_inicial}`,
        id_usuario: autorId,
        es_importante: true
      });
    }

    if (data.budget_inicial !== undefined && parseFloat(project.budget_inicial) !== parseFloat(data.budget_inicial)) {
      await ComentariosProyecto.create({
        id_proyecto,
        texto_comentario: `El usuario <strong>${nombreAutor}</strong> ha modificado el <strong>Presupuesto Inicial</strong> de ${project.budget_inicial || '0'} a ${data.budget_inicial}`,
        id_usuario: autorId,
        es_importante: true
      });
    }

    await project.update(data);

    // Update Many-to-Many relations
    if (data.involvedKus) await project.setInvolvedKeyUsers(data.involvedKus);
    if (data.comSemanalKus) await project.setComSemanalKUs(data.comSemanalKus);
    if (data.comMensualKus) await project.setComMensualKUs(data.comMensualKus);
    if (data.comSteercoKus) await project.setComSteerCoKUs(data.comSteercoKus);

    res.json(project);
  } catch (error) {
    handleErr(res, error);
  }
});

// Delete project
app.delete('/api/projects/:id_proyecto', async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const project = await Proyectos.findByPk(id_proyecto);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const user = await Usuarios.findByPk(req.currentPmId);
    if (!user) {
      return res.status(401).json({ error: 'Acceso denegado. Usuario no encontrado.' });
    }

    // Allow ADMINISTRADOR or DIRECTOR to delete any project.
    // Allow PM to delete only if they are the owner of the project.
    const isAuthorized = user.perfil === 'ADMINISTRADOR' || 
                         user.perfil === 'DIRECTOR' || 
                         project.id_pm === req.currentPmId;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para eliminar este proyecto.' });
    }

    await project.destroy();
    res.json({ message: 'Proyecto eliminado con éxito' });
  } catch (error) {
    handleErr(res, error);
  }
});

// Add or update participant in project RACI matrix
app.post('/api/projects/:id_proyecto/participants', async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const { id_ku, rol, raci } = req.body;
    if (!id_ku || !rol || !raci) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: id_ku, rol, raci.' });
    }
    const project = await Proyectos.findByPk(id_proyecto);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }
    
    // Check if association exists
    const [association, created] = await ProyectoKeyUsers.findOrCreate({
      where: { id_proyecto, id_ku },
      defaults: { rol, raci }
    });

    if (!created) {
      // Update existing association
      await association.update({ rol, raci });
    }

    res.json({ message: 'Participante guardado con éxito', association });
  } catch (error) {
    handleErr(res, error);
  }
});

// Remove participant from project RACI matrix
app.delete('/api/projects/:id_proyecto/participants/:id_ku', async (req, res) => {
  try {
    const { id_proyecto, id_ku } = req.params;
    const count = await ProyectoKeyUsers.destroy({
      where: { id_proyecto, id_ku }
    });
    if (count === 0) {
      return res.status(404).json({ error: 'Participante no encontrado en este proyecto.' });
    }
    res.json({ message: 'Participante eliminado con éxito.' });
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 7. Proveedores (Vendor 360 & CRUD)
// ==========================================
app.get('/api/vendors', async (req, res) => {
  try {
    const vendors = await Proveedores.findAll({
      order: [['nombre_razon_social', 'ASC']]
    });
    res.json(vendors);
  } catch (error) {
    handleErr(res, error);
  }
});

// Vendor 360º View
app.get('/api/vendors/:id_proveedor', async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const vendor = await Proveedores.findByPk(id_proveedor, {
      include: [
        { model: ContactosProveedor }
      ]
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const projects = await Proyectos.findAll({
      where: { id_proveedor },
      include: [
        { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
        { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado', 'icono'] }
      ]
    });

    const projectsWithCalculations = await Promise.all(
      projects.map(async (project) => {
        const calc = await getProjectCalculations(
          project.id_proyecto,
          project.budget_inicial,
          project.fecha_fin_inicial
        );
        return {
          ...project.toJSON(),
          calculations: calc
        };
      })
    );

    const projectIds = projects.map(p => p.id_proyecto);
    const incidents = await Incidencias.findAll({
      where: { id_proyecto: projectIds },
      include: [{ model: Proyectos, attributes: ['nombre_proyecto'] }],
      order: [['fecha_apertura', 'DESC']]
    });

    const lessons = await LeccionesAprendidas.findAll({
      where: {
        [Op.or]: [
          { id_proveedor },
          { id_proyecto: projectIds }
        ]
      },
      include: [
        { model: Proyectos, as: 'Proyecto', attributes: ['nombre_proyecto'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      vendor: vendor.toJSON(),
      projects: projectsWithCalculations,
      incidents,
      lessons
    });
  } catch (error) {
    handleErr(res, error);
  }
});

// Create vendor
app.post('/api/vendors', async (req, res) => {
  try {
    const vendor = await Proveedores.create(req.body);
    res.status(201).json(vendor);
  } catch (error) {
    handleErr(res, error);
  }
});

// Update vendor
app.put('/api/vendors/:id_proveedor', async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const vendor = await Proveedores.findByPk(id_proveedor);
    if (!vendor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    await vendor.update(req.body);
    res.json(vendor);
  } catch (error) {
    handleErr(res, error);
  }
});

// Delete vendor
app.delete('/api/vendors/:id_proveedor', restrictToAdmin, async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const vendor = await Proveedores.findByPk(id_proveedor);
    if (!vendor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const projectCount = await Proyectos.count({ where: { id_proveedor } });
    if (projectCount > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el proveedor porque tiene proyectos activos asociados.' });
    }

    await vendor.destroy();
    res.json({ message: 'Proveedor eliminado con éxito' });
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 8. Contactos Proveedor Endpoints
// ==========================================
app.post('/api/contacts', async (req, res) => {
  try {
    const contact = await ContactosProveedor.create(req.body);
    res.status(201).json(contact);
  } catch (error) {
    handleErr(res, error);
  }
});

app.delete('/api/contacts/:id_contacto', async (req, res) => {
  try {
    const { id_contacto } = req.params;
    const contact = await ContactosProveedor.findByPk(id_contacto);
    if (!contact) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    await contact.destroy();
    res.json({ message: 'Contacto eliminado con éxito' });
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 9. Cambios de Alcance (CR) Endpoints
// ==========================================
app.post('/api/scope-changes', async (req, res) => {
  try {
    const data = req.body;

    // Auto-generate CR code if missing
    if (!data.id_cambio || data.id_cambio.trim() === '') {
      data.id_cambio = await generateNextId(CambiosAlcance, 'CR', 'id_cambio');
    } else {
      const crRegex = /^CR-\d{4}-\d{3}$/;
      if (!crRegex.test(data.id_cambio)) {
        return res.status(400).json({ error: 'El ID del cambio de alcance debe tener el formato CR-YYYY-XXX.' });
      }
    }

    if (!data.impacta_importe) {
      data.importe_impacto = 0.00;
    }
    if (!data.impacta_tiempo) {
      data.dias_impacto = 0;
    }

    const cr = await CambiosAlcance.create(data);
    res.status(201).json(cr);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/scope-changes/:id_cambio', async (req, res) => {
  try {
    const { id_cambio } = req.params;
    const data = req.body;

    const cr = await CambiosAlcance.findByPk(id_cambio);
    if (!cr) {
      return res.status(404).json({ error: 'Cambio de alcance no encontrado' });
    }

    if (data.hasOwnProperty('impacta_importe') && !data.impacta_importe) {
      data.importe_impacto = 0.00;
    }
    if (data.hasOwnProperty('impacta_tiempo') && !data.impacta_tiempo) {
      data.dias_impacto = 0;
    }

    await cr.update(data);
    res.json(cr);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 10. Facturas Endpoints
// ==========================================
app.post('/api/invoices', async (req, res) => {
  try {
    const data = req.body;

    // Auto-generate Invoice code if missing
    if (!data.id_interno_factura || data.id_interno_factura.trim() === '') {
      data.id_interno_factura = await generateNextId(Facturas, 'FAC', 'id_interno_factura');
    } else {
      const facRegex = /^FAC-\d{4}-\d{3}$/;
      if (!facRegex.test(data.id_interno_factura)) {
        return res.status(400).json({ error: 'El ID de factura debe tener el formato FAC-YYYY-XXX.' });
      }
    }

    const fac = await Facturas.create(data);
    res.status(201).json(fac);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/invoices/:id_interno_factura', async (req, res) => {
  try {
    const { id_interno_factura } = req.params;
    const fac = await Facturas.findByPk(id_interno_factura);
    if (!fac) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    await fac.update(req.body);
    res.json(fac);
  } catch (error) {
    handleErr(res, error);
  }
});

app.delete('/api/invoices/:id_interno_factura', async (req, res) => {
  try {
    const { id_interno_factura } = req.params;
    const fac = await Facturas.findByPk(id_interno_factura);
    if (!fac) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    await fac.destroy();
    res.json({ message: 'Factura eliminada con éxito' });
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 11. Riesgos Endpoints
// ==========================================
app.post('/api/risks', async (req, res) => {
  try {
    const data = req.body;

    // Auto-generate Risk code if missing
    if (!data.id_riesgo || data.id_riesgo.trim() === '') {
      data.id_riesgo = await generateNextId(Riesgos, 'RSG', 'id_riesgo');
    } else {
      const rsgRegex = /^RSG-\d{4}-\d{3}$/;
      if (!rsgRegex.test(data.id_riesgo)) {
        return res.status(400).json({ error: 'El ID de riesgo debe tener el formato RSG-YYYY-XXX.' });
      }
    }

    const rsg = await Riesgos.create(data);
    res.status(201).json(rsg);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/risks/:id_riesgo', async (req, res) => {
  try {
    const { id_riesgo } = req.params;
    const rsg = await Riesgos.findByPk(id_riesgo);
    if (!rsg) {
      return res.status(404).json({ error: 'Riesgo no encontrado' });
    }
    await rsg.update(req.body);
    res.json(rsg);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 12. Incidencias Endpoints
// ==========================================
app.post('/api/issues', async (req, res) => {
  try {
    const data = req.body;

    // Auto-generate Incident code if missing
    if (!data.id_incidencia || data.id_incidencia.trim() === '') {
      data.id_incidencia = await generateNextId(Incidencias, 'INC', 'id_incidencia');
    } else {
      const incRegex = /^INC-\d{4}-\d{3}$/;
      if (!incRegex.test(data.id_incidencia)) {
        return res.status(400).json({ error: 'El ID de incidencia debe tener el formato INC-YYYY-XXX.' });
      }
    }

    if (data.estado === 'RESUELTA' && (!data.solucion_aplicada || data.solucion_aplicada.trim() === '')) {
      return res.status(400).json({ error: 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' });
    }

    const inc = await Incidencias.create(data);
    res.status(201).json(inc);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/issues/:id_incidencia', async (req, res) => {
  try {
    const { id_incidencia } = req.params;
    const data = req.body;

    const inc = await Incidencias.findByPk(id_incidencia);
    if (!inc) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    const newStatus = data.estado || inc.estado;
    const newSolution = data.hasOwnProperty('solucion_aplicada') ? data.solucion_aplicada : inc.solucion_aplicada;
    if (newStatus === 'RESUELTA' && (!newSolution || newSolution.trim() === '')) {
      return res.status(400).json({ error: 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' });
    }

    await inc.update(data);
    res.json(inc);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 13. Tareas (PM Internal Checklist)
// ==========================================
app.post('/api/tasks', validateTaskDate, async (req, res) => {
  try {
    const task = await Tareas.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/tasks/:id_tarea', validateTaskDate, async (req, res) => {
  try {
    const { id_tarea } = req.params;
    const task = await Tareas.findByPk(id_tarea);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    await task.update(req.body);
    res.json(task);
  } catch (error) {
    handleErr(res, error);
  }
});

app.delete('/api/tasks/:id_tarea', async (req, res) => {
  try {
    const { id_tarea } = req.params;
    const task = await Tareas.findByPk(id_tarea);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    await task.destroy();
    res.json({ message: 'Tarea eliminada con éxito' });
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 14. Lecciones Aprendidas (Knowledge Base)
// ==========================================
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await LeccionesAprendidas.findAll({
      include: [
        { model: Proyectos, as: 'Proyecto', attributes: ['nombre_proyecto'] },
        { model: Proveedores, as: 'Proveedore', attributes: ['nombre_razon_social'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(lessons);
  } catch (error) {
    handleErr(res, error);
  }
});

app.post('/api/lessons', async (req, res) => {
  try {
    const data = req.body;

    // Auto-generate LEA code if missing
    if (!data.id_leccion || data.id_leccion.trim() === '') {
      data.id_leccion = await generateNextId(LeccionesAprendidas, 'LEA', 'id_leccion');
    } else {
      const leaRegex = /^LEA-\d{4}-\d{3}$/;
      if (!leaRegex.test(data.id_leccion)) {
        return res.status(400).json({ error: 'El ID de lección debe tener el formato LEA-YYYY-XXX.' });
      }
    }

    const lesson = await LeccionesAprendidas.create(data);
    res.status(201).json(lesson);
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 15. ComentariosProyecto Endpoints
// ==========================================
app.get('/api/projects/:id_proyecto/comments', async (req, res) => {
  try {
    const comments = await ComentariosProyecto.findAll({
      where: { id_proyecto: req.params.id_proyecto },
      include: [
        { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
        { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
      ],
      order: [['fecha_registro', 'DESC']]
    });
    res.json(comments);
  } catch (error) {
    handleErr(res, error);
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { id_proyecto, texto_comentario, es_importante } = req.body;
    const authorId = req.currentPmId;
    if (!authorId) {
      return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
    }
    if (!id_proyecto || !texto_comentario || texto_comentario.trim() === '') {
      return res.status(400).json({ error: 'El código del proyecto y el texto del comentario son obligatorios.' });
    }

    const comment = await ComentariosProyecto.create({
      id_proyecto,
      id_usuario: authorId,
      texto_comentario: sanitizeHTML(texto_comentario),
      es_importante: es_importante !== undefined ? !!es_importante : false,
      fecha_registro: new Date()
    });

    const fullComment = await ComentariosProyecto.findByPk(comment.id_comentario, {
      include: [
        { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
        { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
      ]
    });

    res.status(201).json(fullComment);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/comments/:id_comentario', async (req, res) => {
  try {
    const { id_comentario } = req.params;
    const { texto_comentario, es_importante } = req.body;
    const editorId = req.currentPmId;
    if (!editorId) {
      return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
    }
    if (!texto_comentario || texto_comentario.trim() === '') {
      return res.status(400).json({ error: 'El texto del comentario es obligatorio.' });
    }

    const comment = await ComentariosProyecto.findByPk(id_comentario);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }

    const updateData = {
      texto_comentario: sanitizeHTML(texto_comentario),
      editado: true,
      id_usuario_modificacion: editorId,
      fecha_modificacion: new Date()
    };
    if (es_importante !== undefined) {
      updateData.es_importante = !!es_importante;
    }

    await comment.update(updateData);

    const fullComment = await ComentariosProyecto.findByPk(id_comentario, {
      include: [
        { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
        { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
      ]
    });

    res.json(fullComment);
  } catch (error) {
    handleErr(res, error);
  }
});

app.delete('/api/comments/:id_comentario', async (req, res) => {
  try {
    const { id_comentario } = req.params;
    const comment = await ComentariosProyecto.findByPk(id_comentario);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado.' });
    }
    await comment.destroy();
    res.json({ message: 'Comentario eliminado con éxito.' });
  } catch (error) {
    handleErr(res, error);
  }
});

// ==========================================
// 16. Admin Endpoints (Estados & Usuarios CRUD)
// ==========================================

// --- SEDES ---
app.post('/api/admin/sedes', restrictToAdmin, async (req, res) => {
  try {
    const { nombre_sede } = req.body;
    if (!nombre_sede || !nombre_sede.trim()) {
      return res.status(400).json({ error: 'El nombre de la sede es obligatorio.' });
    }
    const existing = await Sedes.findOne({ where: { nombre_sede: nombre_sede.trim() } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una sede con ese nombre.' });
    }
    const sede = await Sedes.create({ nombre_sede: nombre_sede.trim() });
    res.json(sede);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/admin/sedes/:id_sede', restrictToAdmin, async (req, res) => {
  try {
    const { nombre_sede } = req.body;
    if (!nombre_sede || !nombre_sede.trim()) {
      return res.status(400).json({ error: 'El nombre de la sede es obligatorio.' });
    }
    const sede = await Sedes.findByPk(req.params.id_sede);
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });

    const existing = await Sedes.findOne({ where: { nombre_sede: nombre_sede.trim() } });
    if (existing && existing.id_sede !== sede.id_sede) {
      return res.status(400).json({ error: 'Ya existe otra sede con ese nombre.' });
    }

    await sede.update({ nombre_sede: nombre_sede.trim() });
    res.json(sede);
  } catch (error) {
    handleErr(res, error);
  }
});

app.delete('/api/admin/sedes/:id_sede', restrictToAdmin, async (req, res) => {
  try {
    const sede = await Sedes.findByPk(req.params.id_sede);
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });

    const inUse = await Proyectos.count({ where: { id_sede: req.params.id_sede } });
    if (inUse > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la sede porque existen proyectos en ella.' });
    }

    await sede.destroy();
    res.json({ message: 'Sede eliminada correctamente.' });
  } catch (error) {
    handleErr(res, error);
  }
});

// --- ESTADOS ---
app.get('/api/admin/states', restrictToAdmin, async (req, res) => {
  try {
    const states = await EstadosProyecto.findAll({ order: [['orden', 'ASC']] });
    res.json(states);
  } catch (error) {
    handleErr(res, error);
  }
});

app.post('/api/admin/states', restrictToAdmin, async (req, res) => {
  try {
    const { nombre_estado, icono, orden, proyecto_cerrado } = req.body;
    if (!nombre_estado || orden === undefined) {
      return res.status(400).json({ error: 'El nombre del estado y el orden son obligatorios.' });
    }
    const state = await EstadosProyecto.create({
      nombre_estado,
      icono,
      orden: parseInt(orden, 10),
      proyecto_cerrado: proyecto_cerrado !== undefined ? !!proyecto_cerrado : false
    });
    res.status(201).json(state);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/admin/states/:id_estado', restrictToAdmin, async (req, res) => {
  try {
    const { id_estado } = req.params;
    const { nombre_estado, icono, orden, proyecto_cerrado } = req.body;
    const state = await EstadosProyecto.findByPk(id_estado);
    if (!state) {
      return res.status(404).json({ error: 'Estado no encontrado.' });
    }
    await state.update({
      nombre_estado: nombre_estado !== undefined ? nombre_estado : state.nombre_estado,
      icono: icono !== undefined ? icono : state.icono,
      orden: orden !== undefined ? parseInt(orden, 10) : state.orden,
      proyecto_cerrado: proyecto_cerrado !== undefined ? !!proyecto_cerrado : state.proyecto_cerrado
    });
    res.json(state);
  } catch (error) {
    handleErr(res, error);
  }
});

app.delete('/api/admin/states/:id_estado', restrictToAdmin, async (req, res) => {
  try {
    const { id_estado } = req.params;
    const state = await EstadosProyecto.findByPk(id_estado);
    if (!state) {
      return res.status(404).json({ error: 'Estado no encontrado.' });
    }
    const count = await Proyectos.count({ where: { id_estado } });
    if (count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el estado porque hay proyectos activos asociados a él.' });
    }
    await state.destroy();
    res.json({ message: 'Estado eliminado con éxito.' });
  } catch (error) {
    handleErr(res, error);
  }
});

// --- USUARIOS ---
app.get('/api/admin/users', restrictToAdmin, async (req, res) => {
  try {
    const users = await Usuarios.findAll({ order: [['nombre', 'ASC']] });
    res.json(users);
  } catch (error) {
    handleErr(res, error);
  }
});

app.post('/api/admin/users', restrictToAdmin, async (req, res) => {
  try {
    const { nombre, apellidos, correo, password, perfil, activo } = req.body;
    if (!nombre || !apellidos || !correo || !password || !perfil) {
      return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos.' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{10,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'La contraseña no cumple con la política de seguridad requerida' });
    }
    const user = await Usuarios.create({
      nombre,
      apellidos,
      correo,
      password: await hashPassword(password),
      password_salt: null,
      perfil,
      activo: activo !== undefined ? activo : true
    });
    res.status(201).json(user);
  } catch (error) {
    handleErr(res, error);
  }
});

app.put('/api/admin/users/:id_usuario', restrictToAdmin, async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { nombre, apellidos, correo, password, perfil, activo } = req.body;
    const user = await Usuarios.findByPk(id_usuario);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const updates = {
      nombre: nombre !== undefined ? nombre : user.nombre,
      apellidos: apellidos !== undefined ? apellidos : user.apellidos,
      correo: correo !== undefined ? correo : user.correo,
      perfil: perfil !== undefined ? perfil : user.perfil,
      activo: activo !== undefined ? activo : user.activo
    };
    if (password && password.trim() !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{10,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'La contraseña no cumple con la política de seguridad requerida' });
      }
      updates.password_salt = null;
      updates.password = await hashPassword(password);
    }
    await user.update(updates);
    res.json(user);
  } catch (error) {
    handleErr(res, error);
  }
});

app.delete('/api/admin/users/:id_usuario', restrictToAdmin, async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const user = await Usuarios.findByPk(id_usuario);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const count = await Proyectos.count({ where: { id_pm: id_usuario } });
    if (count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el usuario porque tiene proyectos asignados.' });
    }
    await user.destroy();
    res.json({ message: 'Usuario eliminado con éxito.' });
  } catch (error) {
    handleErr(res, error);
  }
});

// --- CAMBIO DE CONTRASEÑA ---
app.put('/api/users/me/change-password', async (req, res) => {
  try {
    const userId = req.currentPmId;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Ambas contraseñas son obligatorias.' });
    }

    const user = await Usuarios.scope('withPassword').findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Check current password
    let isValid = false;
    if (user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      let hashedCurrent = crypto.createHash('sha256').update(currentPassword).digest('hex');
      if (user.password_salt) {
         hashedCurrent = crypto.createHash('sha256').update(currentPassword + user.password_salt).digest('hex');
      }
      if (user.password === hashedCurrent) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    // Check new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{10,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña no cumple con la política de seguridad requerida.' });
    }

    // Generate new hash using bcrypt
    const newHash = await hashPassword(newPassword);

    await user.update({ password: newHash, password_salt: null });

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    handleErr(res, error);
  }
});


const umzug = require('./migrate');

// ==========================================
// LECCIONES APRENDIDAS CRUD
// ==========================================
app.post('/api/lessons', async (req, res) => {
  try {
    const lesson = await LeccionesAprendidas.create(req.body);
    res.status(201).json(lesson);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/lessons/:id', async (req, res) => {
  try {
    const lesson = await LeccionesAprendidas.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Not found' });
    await lesson.update(req.body);
    res.json(lesson);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/lessons/:id', async (req, res) => {
  try {
    const lesson = await LeccionesAprendidas.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Not found' });
    await lesson.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ alter: false })
    .then(() => {
      console.log('✅ Connection to database established successfully. Database synced.');
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
