const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { 
  Sedes, ContactosProveedor, Proveedores, Usuarios, EstadosProyecto, 
  Proyectos, Facturas, CambiosAlcance, Riesgos, Incidencias, Tareas, ComentariosProyecto,
  Portfolios, Tags, TiposCapex, SubtiposCapex, PortfolioBudgets
} = require('../models/index');
const { getProjectCalculations } = require('../models/automations');
const { asyncHandler } = require('../middlewares/errorHandler');

const getSedes = asyncHandler(async (req, res) => {
  const sedes = await Sedes.findAll({ order: [['nombre_sede', 'ASC']] });
  res.json(sedes);
});

const getContactos = asyncHandler(async (req, res) => {
  const kus = await ContactosProveedor.findAll({
    include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }],
    order: [['nombre', 'ASC']]
  });
  res.json(kus);
});

const getPms = asyncHandler(async (req, res) => {
  const pms = await Usuarios.findAll({
    where: { activo: true },
    order: [['nombre', 'ASC']]
  });
  res.json(pms);
});

const getChangelog = asyncHandler(async (req, res) => {
  const filePath = path.join(__dirname, '..', '..', 'CHANGELOG.md');
  const content = fs.readFileSync(filePath, 'utf8');
  res.json({ content });
});

const getPortfolioStates = asyncHandler(async (req, res) => {
  const states = await EstadosProyecto.findAll({
    order: [['orden', 'ASC']]
  });
  res.json(states);
});

const getPortfolioDashboard = asyncHandler(async (req, res) => {
  const { pm, fecha_desde, fecha_hasta, search, vendor, rag, state, portfolio, tag } = req.query;
  const user = await Usuarios.findByPk(req.currentPmId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');
  
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
  if (portfolio) {
    where.portfolio_id = parseInt(portfolio, 10);
  }
  if (search) {
    where.nombre_proyecto = { [Op.like]: `%${search}%` };
  }
  if (tag) {
    const projectIdsWithTag = await Proyectos.findAll({
      attributes: ['id_proyecto'],
      include: [{
        model: Tags,
        as: 'Tags',
        where: { id: tag },
        attributes: []
      }],
      raw: true
    });
    const ids = projectIdsWithTag.map(p => p.id_proyecto);
    where.id_proyecto = { [Op.in]: ids };
  }

  const projectsList = await Proyectos.findAll({
    where,
    attributes: {
      exclude: [
        'descripcion',
        'alcance_por_que', 'alcance_objetivo', 'alcance_resultados', 
        'alcance_limitaciones', 'alcance_integraciones', 'alcance_desarrollo',
        'cierre_aceptacion', 'cierre_exito',
        'com_semanal_finalidad', 'com_mensual_finalidad', 'com_steerco_finalidad'
      ]
    },
    include: [
      { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
      { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
      { model: Sedes, as: 'SedeDistribuir', attributes: ['nombre_sede'] },
      { model: Portfolios, as: 'Portfolio', attributes: ['id', 'nombre'] },
      { model: Tags, as: 'Tags', through: { attributes: [] } },
      { 
        model: EstadosProyecto, 
        as: 'Estado', 
        attributes: ['nombre_estado', 'icono', 'descripcion'],
        ...(state ? { where: { nombre_estado: { [Op.in]: state.split(',') } } } : {})
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const dashboardData = await Promise.all(
    projectsList.map(async (p) => {
      const id_proyecto = p.id_proyecto;
      
      const calc = await getProjectCalculations(
        id_proyecto,
        p.budget_inicial,
        p.fecha_fin_inicial
      );

      const approvedCRs = await CambiosAlcance.findAll({
        where: { id_proyecto, estado_cambio: 'APROBADO' }
      });
      let totalCRDays = 0;
      approvedCRs.forEach(cr => {
        if (cr.impacta_tiempo) {
          totalCRDays += parseInt(cr.dias_impacto || 0, 10);
        }
      });

      const invoices = await Facturas.findAll({
        where: { id_proyecto }
      });
      let pos = new Set();
      invoices.forEach(f => {
        if (f.PO) pos.add(f.PO);
      });
      const po_list = Array.from(pos).join(', ');

      const nextMilestone = await Tareas.findOne({
        where: {
          id_proyecto,
          es_hito: true,
          estado: 'PENDIENTE'
        },
        order: [['fecha_limite', 'ASC']]
      });

      const overdueCount = await Tareas.count({
        where: {
          id_proyecto,
          es_hito: true,
          estado: 'PENDIENTE',
          fecha_limite: { [Op.lt]: todayStr }
        }
      });

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

      const cambiosAlcanceCount = await CambiosAlcance.count({
        where: { id_proyecto }
      });

      const commentWhere = { id_proyecto };
      if (!canSeeDireccion) {
        commentWhere.para_direccion = false;
      }

      const lastComment = await ComentariosProyecto.findOne({
        where: commentWhere,
        order: [['fecha_registro', 'DESC']]
      });
      const ultimo_comentario = lastComment ? lastComment.texto_comentario.replace(/<[^>]+>/g, '') : '';

      return {
        ...p.toJSON(),
        calculations: calc,
        id_proyecto: p.id_proyecto,
        nombre_proyecto: p.nombre_proyecto,
        id_pm: p.id_pm,
        pm_nombre: p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin PM',
        id_proveedor: p.id_proveedor,
        prov_nombre: p.Proveedor ? p.Proveedor.nombre_razon_social : 'Sin Partner',
        sede_nombre: p.Sede ? p.Sede.nombre_sede : '',
        id_sede_distribuir: p.id_sede_distribuir,
        distribuir_sede_nombre: p.SedeDistribuir ? p.SedeDistribuir.nombre_sede : '',
        id_estado: p.id_estado,
        estado_proyecto: p.Estado ? p.Estado.nombre_estado : 'Sin Estado',
        estado_descripcion: p.Estado ? p.Estado.descripcion : null,
        estado_icono: p.Estado ? p.Estado.icono : '❓',
        indicador_rag: p.indicador_rag,
        es_capex: p.es_capex,
        codigo_capex: p.codigo_capex,
        budget_inicial: parseFloat(p.budget_inicial),
        fecha_inicio: p.fecha_inicio,
        fecha_fin_inicial: p.fecha_fin_inicial,
        fecha_fin_estimada: calc.fecha_fin_estimada,
        dias_retraso_aprobados: totalCRDays,
        gasto_total_facturas: calc.consumo_real,
        cambios_alcance_count: cambiosAlcanceCount,
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

  let finalData = dashboardData;
  if (fecha_desde || fecha_hasta) {
    finalData = dashboardData.filter(p => {
      const matchesDesde = !fecha_desde || p.fecha_fin_estimada >= fecha_desde;
      const matchesHasta = !fecha_hasta || p.fecha_inicio <= fecha_hasta;
      return matchesDesde && matchesHasta;
    });
  }

  res.json(finalData);
});

const getTimeline = asyncHandler(async (req, res) => {
  const projects = await Proyectos.findAll({
    include: [
      { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'icono', 'proyecto_cerrado', 'pasos'] },
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
});

const getPortfolios = asyncHandler(async (req, res) => {
  const portfolios = await Portfolios.findAll({ order: [['nombre', 'ASC']] });
  res.json(portfolios);
});

const getTags = asyncHandler(async (req, res) => {
  const tags = await Tags.findAll({ order: [['nombre', 'ASC']] });
  res.json(tags);
});

const createTag = asyncHandler(async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del tag es obligatorio.' });
  }
  const existing = await Tags.findOne({ where: { nombre: nombre.trim() } });
  if (existing) {
    return res.json(existing);
  }
  const tag = await Tags.create({ nombre: nombre.trim() });
  res.status(201).json(tag);
});

const getCapexTypes = asyncHandler(async (req, res) => {
  const tipos = await TiposCapex.findAll({
    include: [{ model: SubtiposCapex, as: 'Subtipos' }],
    order: [['orden', 'ASC'], [{ model: SubtiposCapex, as: 'Subtipos' }, 'orden', 'ASC']]
  });
  res.json(tipos);
});

const getPortfolioBudgets = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budgets = await PortfolioBudgets.findAll({
    where: { portfolio_id: id },
    include: [
      { model: TiposCapex, as: 'TipoCapex', attributes: ['id', 'nombre'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['id', 'nombre'] }
    ]
  });
  res.json(budgets);
});

const getPortfolioBudgetReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const portfolio = await Portfolios.findByPk(id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio no encontrado.' });
  }

  // Get budget lines configured for this portfolio
  const budgets = await PortfolioBudgets.findAll({
    where: { portfolio_id: id },
    include: [
      { model: TiposCapex, as: 'TipoCapex', attributes: ['id', 'nombre'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['id', 'nombre'] }
    ]
  });

  // Get all projects associated with this portfolio
  const projects = await Proyectos.findAll({
    where: { portfolio_id: id },
    include: [
      { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado'] },
      { model: Facturas, attributes: ['importe'] }
    ]
  });

  // Match projects with budgets
  let matchedProjectIds = new Set();
  const secciones = budgets.map(b => {
    // Filter projects matching this budget criteria
    const projectsSec = projects.filter(p => {
      const matchTipo = p.id_tipo_capex === b.id_tipo_capex;
      let matchSubtipo = false;
      if (b.id_subtipo_capex === null) {
        matchSubtipo = p.id_subtipo_capex === null;
      } else {
        matchSubtipo = p.id_subtipo_capex === b.id_subtipo_capex;
      }

      const isMatch = matchTipo && matchSubtipo;
      if (isMatch) {
        matchedProjectIds.add(p.id_proyecto);
      }
      return isMatch;
    });

    const totalReservadoSec = projectsSec.reduce((acc, p) => acc + parseFloat(p.budget_inicial || 0), 0);
    const totalEjecutadoSec = projectsSec.reduce((acc, p) => {
      const ejecutadoProj = (p.Facturas || []).reduce((sum, f) => sum + parseFloat(f.importe || 0), 0);
      return acc + ejecutadoProj;
    }, 0);

    return {
      id_presupuesto: b.id,
      tipo: b.TipoCapex ? b.TipoCapex.nombre : 'Desconocido',
      id_tipo_capex: b.id_tipo_capex,
      subtipo: b.SubtipoCapex ? b.SubtipoCapex.nombre : null,
      id_subtipo_capex: b.id_subtipo_capex,
      aprobado: parseFloat(b.importe),
      reservado: totalReservadoSec,
      ejecutado: totalEjecutadoSec,
      disponible: parseFloat(b.importe) - totalReservadoSec, // mantener para compatibilidad
      disponible_compromiso: parseFloat(b.importe) - totalReservadoSec,
      disponible_ejecutado: parseFloat(b.importe) - totalEjecutadoSec,
      proyectos: projectsSec.map(p => {
        const ejecutadoProj = (p.Facturas || []).reduce((sum, f) => sum + parseFloat(f.importe || 0), 0);
        return {
          id_proyecto: p.id_proyecto,
          nombre_proyecto: p.nombre_proyecto,
          budget_inicial: parseFloat(p.budget_inicial || 0),
          budget_notas: p.budget_notas,
          ejecutado: ejecutadoProj,
          indicador_rag: p.indicador_rag,
          estado: p.Estado ? p.Estado.nombre_estado : null,
          pm: p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin Asignar'
        };
      })
    };
  });

  // Collect unmatched projects (projects in portfolio but no matching budget line)
  const unmatchedProjects = projects.filter(p => !matchedProjectIds.has(p.id_proyecto));
  if (unmatchedProjects.length > 0) {
    const totalReservadoUnmatched = unmatchedProjects.reduce((acc, p) => acc + parseFloat(p.budget_inicial || 0), 0);
    const totalEjecutadoUnmatched = unmatchedProjects.reduce((acc, p) => {
      const ejecutadoProj = (p.Facturas || []).reduce((sum, f) => sum + parseFloat(f.importe || 0), 0);
      return acc + ejecutadoProj;
    }, 0);

    secciones.push({
      id_presupuesto: 'sin_presupuesto',
      tipo: 'Otros / Sin Presupuesto Asignado',
      id_tipo_capex: null,
      subtipo: null,
      id_subtipo_capex: null,
      aprobado: 0.00,
      reservado: totalReservadoUnmatched,
      ejecutado: totalEjecutadoUnmatched,
      disponible: -totalReservadoUnmatched, // mantener para compatibilidad
      disponible_compromiso: -totalReservadoUnmatched,
      disponible_ejecutado: -totalEjecutadoUnmatched,
      proyectos: unmatchedProjects.map(p => {
        const ejecutadoProj = (p.Facturas || []).reduce((sum, f) => sum + parseFloat(f.importe || 0), 0);
        return {
          id_proyecto: p.id_proyecto,
          nombre_proyecto: p.nombre_proyecto,
          budget_inicial: parseFloat(p.budget_inicial || 0),
          budget_notas: p.budget_notas,
          ejecutado: ejecutadoProj,
          indicador_rag: p.indicador_rag,
          estado: p.Estado ? p.Estado.nombre_estado : null,
          pm: p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin Asignar'
        };
      })
    });
  }

  // Calculate overall summary
  const aprobado_total = budgets.reduce((acc, b) => acc + parseFloat(b.importe), 0);
  const reservado_total = projects.reduce((acc, p) => acc + parseFloat(p.budget_inicial || 0), 0);
  const ejecutado_total = projects.reduce((acc, p) => {
    const ejecutadoProj = (p.Facturas || []).reduce((sum, f) => sum + parseFloat(f.importe || 0), 0);
    return acc + ejecutadoProj;
  }, 0);

  res.json({
    portfolio: {
      id: portfolio.id,
      nombre: portfolio.nombre,
      descripcion: portfolio.descripcion
    },
    secciones,
    resumen: {
      aprobado_total,
      reservado_total,
      ejecutado_total,
      disponible_total: aprobado_total - reservado_total, // mantener para compatibilidad
      disponible_compromiso_total: aprobado_total - reservado_total,
      disponible_ejecutado_total: aprobado_total - ejecutado_total
    }
  });
});

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
