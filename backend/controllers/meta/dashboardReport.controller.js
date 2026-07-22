const { 
  Portfolios, Proyectos, Usuarios, EstadosProyecto, Facturas, SubtiposCapex, PortfolioBudgets, TiposCapex 
} = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

const getPortfolioBudgetReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const portfolio = await Portfolios.findByPk(id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio no encontrado.' });
  }

  const budgets = await PortfolioBudgets.findAll({
    where: { portfolio_id: id },
    include: [
      { model: TiposCapex, as: 'TipoCapex', attributes: ['id', 'nombre'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['id', 'nombre'] }
    ]
  });

  const projects = await Proyectos.findAll({
    where: { 
      portfolio_id: id,
      es_capex: true
    },
    include: [
      { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado'] },
      { model: Facturas, attributes: ['importe'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['nombre'] }
    ]
  });

  const budgetProjectsMap = {};
  let matchedProjectIds = new Set();

  budgets.forEach(b => {
    budgetProjectsMap[b.id] = [];
  });

  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.id_subtipo_capex !== null && b.id_subtipo_capex === null) return -1;
    if (a.id_subtipo_capex === null && b.id_subtipo_capex !== null) return 1;
    return 0;
  });

  sortedBudgets.forEach(b => {
    projects.forEach(p => {
      if (matchedProjectIds.has(p.id_proyecto)) return;

      const matchTipo = p.id_tipo_capex === b.id_tipo_capex;
      let matchSubtipo = false;
      if (b.id_subtipo_capex !== null) {
        matchSubtipo = p.id_subtipo_capex === b.id_subtipo_capex;
      } else {
        matchSubtipo = true;
      }

      if (matchTipo && matchSubtipo) {
        budgetProjectsMap[b.id].push(p);
        matchedProjectIds.add(p.id_proyecto);
      }
    });
  });

  const secciones = budgets.map(b => {
    const projectsSec = budgetProjectsMap[b.id] || [];

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
      disponible: parseFloat(b.importe) - totalReservadoSec,
      disponible_compromiso: parseFloat(b.importe) - totalReservadoSec,
      disponible_ejecutado: parseFloat(b.importe) - totalEjecutadoSec,
      proyectos: projectsSec.map(p => {
        const ejecutadoProj = (p.Facturas || []).reduce((sum, f) => sum + parseFloat(f.importe || 0), 0);
        return {
          id_proyecto: p.id_proyecto,
          nombre_proyecto: p.nombre_proyecto,
          subtipo_capex: p.SubtipoCapex ? p.SubtipoCapex.nombre : null,
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
      disponible: -totalReservadoUnmatched,
      disponible_compromiso: -totalReservadoUnmatched,
      disponible_ejecutado: -totalEjecutadoUnmatched,
      proyectos: unmatchedProjects.map(p => {
        const ejecutadoProj = (p.Facturas || []).reduce((sum, f) => sum + parseFloat(f.importe || 0), 0);
        return {
          id_proyecto: p.id_proyecto,
          nombre_proyecto: p.nombre_proyecto,
          subtipo_capex: p.SubtipoCapex ? p.SubtipoCapex.nombre : null,
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
      disponible_total: aprobado_total - reservado_total,
      disponible_compromiso_total: aprobado_total - reservado_total,
      disponible_ejecutado_total: aprobado_total - ejecutado_total
    }
  });
});

module.exports = {
  getPortfolioBudgetReport
};
