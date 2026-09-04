const { Proyectos, Sedes, Proveedores, EstadosProyecto, Portfolios, Usuarios, Riesgos, Incidencias, Tareas, Ambitos, ComentariosProyecto } = require('../../models');

const getProjectSummaryTool = {
  name: 'get_project_summary',
  description: 'Obtiene una ficha técnica y ejecutiva condensada de un proyecto concreto por su ID (ej: PRJ-2026-001), incluyendo salud de fechas, retrasos, KPIs financieros, próximo hito y últimos comentarios PMO.',
  inputSchema: {
    type: 'object',
    properties: {
      id_proyecto: { type: 'string', description: 'Código del proyecto (ej: PRJ-2026-001)' }
    },
    required: ['id_proyecto']
  },
  handler: async (args, mcpScope = { isGlobal: true }) => {
    const { id_proyecto } = args || {};
    if (!id_proyecto) {
      return { content: [{ type: 'text', text: 'Error: id_proyecto es obligatorio.' }], isError: true };
    }

    const project = await Proyectos.findByPk(id_proyecto, {
      include: [
        { model: Sedes, as: 'Sede', attributes: ['id_sede', 'nombre_sede'] },
        { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado'] },
        { model: Proveedores, as: 'Proveedor', attributes: ['id_proveedor', 'nombre_razon_social'] },
        { model: Usuarios, as: 'PM', attributes: ['id_usuario', 'nombre', 'apellidos', 'correo'] },
        { model: Portfolios, as: 'Portfolio', attributes: ['id', 'nombre'] },
        { model: Ambitos, as: 'Ambito', attributes: ['id_ambito', 'nombre', 'code'] }
      ]
    });

    if (!project) {
      return { content: [{ type: 'text', text: `Proyecto '${id_proyecto}' no encontrado.` }], isError: true };
    }

    if (!mcpScope.isGlobal && mcpScope.id_ambito && project.id_ambito !== mcpScope.id_ambito) {
      return {
        content: [{ type: 'text', text: `Acceso denegado: El proyecto '${id_proyecto}' pertenece a un ámbito no autorizado.` }],
        isError: true
      };
    }

    const [risks, issues, tasks, comments] = await Promise.all([
      Riesgos.findAll({ where: { id_proyecto }, attributes: ['id_riesgo', 'titulo_riesgo', 'probabilidad', 'impacto', 'estado_riesgo'] }),
      Incidencias.findAll({ where: { id_proyecto }, attributes: ['id_incidencia', 'titulo', 'criticidad', 'estado'] }),
      Tareas.findAll({ where: { id_proyecto }, attributes: ['id_tarea', 'nombre_tarea', 'es_hito', 'completada', 'fecha_fin_estimada'] }),
      ComentariosProyecto ? ComentariosProyecto.findAll({ where: { id_proyecto }, limit: 3, order: [['createdAt', 'DESC']] }) : Promise.resolve([])
    ]);

    const openRisks = risks.filter(r => r.estado_riesgo !== 'CERRADO');
    const openIssues = issues.filter(i => i.estado !== 'RESUELTA');
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completada).length;
    const hitos = tasks.filter(t => t.es_hito);

    let diasRetraso = 0;
    if (project.fecha_fin_inicial && project.fecha_fin_estimada) {
      const fIni = new Date(project.fecha_fin_inicial);
      const fEst = new Date(project.fecha_fin_estimada);
      const diffMs = fEst.getTime() - fIni.getTime();
      diasRetraso = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const summary = {
      id_proyecto: project.id_proyecto,
      nombre_proyecto: project.nombre_proyecto,
      descripcion: project.descripcion,
      ambito: project.Ambito ? `${project.Ambito.nombre} (${project.Ambito.code})` : null,
      estado: project.Estado ? project.Estado.nombre_estado : null,
      rag: project.indicador_rag,
      pm: project.PM ? `${project.PM.nombre} ${project.PM.apellidos}` : null,
      portfolio: project.Portfolio ? project.Portfolio.nombre : null,
      sede: project.Sede ? project.Sede.nombre_sede : null,
      proveedor: project.Proveedor ? project.Proveedor.nombre_razon_social : null,
      salud_cronograma: {
        fecha_inicio: project.fecha_inicio,
        fecha_fin_inicial: project.fecha_fin_inicial,
        fecha_fin_estimada: project.fecha_fin_estimada,
        dias_retraso: diasRetraso,
        porcentaje_avance: project.porcentaje_avance || 0
      },
      financiero: {
        presupuesto_total_eur: Number(project.presupuesto_total || 0),
        gasto_comprometido_eur: Number(project.gasto_comprometido || 0)
      },
      hito_y_comentarios: {
        proximo_hito: project.proximo_hito || null,
        ultimos_comentarios: comments.map(c => ({ fecha: c.createdAt, texto: c.comentario, autor: c.autor_nombre }))
      },
      resumen_elementos: {
        tareas: { total: totalTasks, completadas: completedTasks },
        hitos: { total: hitos.length, completados: hitos.filter(h => h.completada).length },
        riesgos_abiertos: openRisks.length,
        incidencias_abiertas: openIssues.length
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

module.exports = { getProjectSummaryTool };
