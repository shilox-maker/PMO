const { Proyectos, EstadosProyecto, Riesgos, Incidencias, Ambitos } = require('../../models');
const { Op } = require('sequelize');

const getPmoSummaryTool = {
  name: 'get_pmo_summary',
  description: 'Devuelve un resumen ejecutivo consolidado de la PMO (conteo de proyectos por estado, distribución semafórica RAG, agregados financieros de presupuesto y resumen de riesgos/incidencias). Permite filtrar por ámbito.',
  inputSchema: {
    type: 'object',
    properties: {
      ambitoId: { type: 'number', description: 'ID del ámbito/departamento a resumir (opcional si la API Key es global)' }
    }
  },
  handler: async (args = {}, mcpScope = { isGlobal: true }) => {
    const requestedAmbitoId = args.ambitoId;
    let targetAmbitoId = null;

    if (!mcpScope.isGlobal && mcpScope.id_ambito) {
      targetAmbitoId = mcpScope.id_ambito;
    } else if (requestedAmbitoId) {
      targetAmbitoId = requestedAmbitoId;
    }

    const where = {};
    if (targetAmbitoId) {
      where.id_ambito = targetAmbitoId;
    }

    let ambitoInfo = null;
    if (targetAmbitoId) {
      const amb = await Ambitos.findByPk(targetAmbitoId, { attributes: ['id_ambito', 'nombre', 'code'] });
      if (amb) {
        ambitoInfo = { id: amb.id_ambito, nombre: amb.nombre, code: amb.code };
      }
    }

    const projects = await Proyectos.findAll({
      where,
      include: [
        { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'macro_etapa'] },
        { model: Ambitos, as: 'Ambito', attributes: ['id_ambito', 'nombre', 'code'] }
      ]
    });

    const totalProjects = projects.length;
    const byRag = { VERDE: 0, AMARILLO: 0, ROJO: 0, DESCONOCIDO: 0 };
    const byMacroEtapa = { INICIATIVA: 0, PLANIFICACION: 0, EJECUCION: 0, PAUSA: 0, CIERRE: 0 };
    const byEstado = {};
    let totalPresupuesto = 0;
    let totalComprometido = 0;

    projects.forEach(p => {
      const rag = (p.indicador_rag || 'DESCONOCIDO').toUpperCase();
      byRag[rag] = (byRag[rag] || 0) + 1;

      const macro = (p.Estado?.macro_etapa || 'EJECUCION').toUpperCase();
      byMacroEtapa[macro] = (byMacroEtapa[macro] || 0) + 1;

      const estadoName = p.Estado ? p.Estado.nombre_estado : 'Sin Estado';
      byEstado[estadoName] = (byEstado[estadoName] || 0) + 1;

      totalPresupuesto += Number(p.presupuesto_total || 0);
      totalComprometido += Number(p.gasto_comprometido || 0);
    });

    const projectIds = projects.map(p => p.id_proyecto);
    let openRisksCount = 0;
    let criticalRisksCount = 0;
    let openIssuesCount = 0;
    let criticalIssuesCount = 0;

    if (projectIds.length > 0) {
      const [risks, issues] = await Promise.all([
        Riesgos.findAll({
          where: {
            id_proyecto: { [Op.in]: projectIds },
            estado_riesgo: { [Op.ne]: 'CERRADO' }
          },
          attributes: ['probabilidad', 'impacto', 'estado_riesgo']
        }),
        Incidencias.findAll({
          where: {
            id_proyecto: { [Op.in]: projectIds },
            estado: { [Op.ne]: 'RESUELTA' }
          },
          attributes: ['criticidad', 'estado']
        })
      ]);

      openRisksCount = risks.length;
      criticalRisksCount = risks.filter(r => (r.probabilidad === 'ALTA' || r.impacto === 'ALTO')).length;
      openIssuesCount = issues.length;
      criticalIssuesCount = issues.filter(i => (i.criticidad === 'ALTA' || i.criticidad === 'CRITICA')).length;
    }

    const summary = {
      ambito: ambitoInfo || 'Todos los Ámbitos (Vista Global)',
      resumen_proyectos: {
        total: totalProjects,
        distribucion_rag: byRag,
        distribucion_macro_etapa: byMacroEtapa,
        distribucion_estado: byEstado
      },
      financiero: {
        presupuesto_total_eur: totalPresupuesto,
        gasto_comprometido_eur: totalComprometido,
        diferencia_eur: totalPresupuesto - totalComprometido
      },
      salud_operativa: {
        riesgos_abiertos: openRisksCount,
        riesgos_criticos: criticalRisksCount,
        incidencias_abiertas: openIssuesCount,
        incidencias_criticas: criticalIssuesCount
      }
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2)
        }
      ]
    };
  }
};

module.exports = { getPmoSummaryTool };
