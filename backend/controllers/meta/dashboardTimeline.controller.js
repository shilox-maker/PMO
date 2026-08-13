const { 
  Proyectos, Usuarios, Proveedores, ContactosProveedor, EstadosProyecto, Tareas 
} = require('../../models/index');
const { getProjectCalculations } = require('../../models/automations');
const { asyncHandler } = require('../../middlewares/errorHandler');

const getTimeline = asyncHandler(async (req, res) => {
  const where = {};
  if (req.currentAmbitoId && req.currentAmbitoId !== 'ALL') {
    where.id_ambito = req.currentAmbitoId;
  }

  const projects = await Proyectos.findAll({
    where,
    include: [
      { model: Usuarios, as: 'PM', attributes: ['id_usuario', 'nombre', 'apellidos'] },
      { model: ContactosProveedor, as: 'Sponsor', attributes: ['id_contacto', 'nombre', 'apellidos'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['id_proveedor', 'nombre_razon_social'] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'icono', 'proyecto_cerrado', 'pasos'] },
      { model: Tareas, required: false, attributes: ['id_tarea', 'titulo_tarea', 'fecha_limite', 'fecha_original_cierre', 'estado', 'es_hito'] }
    ],
    order: [['fecha_inicio', 'ASC']]
  });

  const timelineData = await Promise.all(
    projects.map(async (p) => {
      const calc = await getProjectCalculations(p.id_proyecto, p.budget_inicial, p.fecha_fin_inicial);
      const allTasks = p.Tareas || [];
      const hitos = allTasks.filter(t => t.es_hito).map(t => ({
        id_tarea: t.id_tarea,
        titulo_tarea: t.titulo_tarea,
        fecha_limite: t.fecha_limite,
        estado: t.estado
      }));
      const tareas = allTasks.map(t => ({
        id_tarea: t.id_tarea,
        titulo_tarea: t.titulo_tarea,
        fecha_inicio: t.fecha_original_cierre || p.fecha_inicio,
        fecha_limite: t.fecha_limite,
        estado: t.estado,
        es_hito: t.es_hito
      }));

      return {
        id_proyecto: p.id_proyecto,
        nombre_proyecto: p.nombre_proyecto,
        id_pm: p.PM ? p.PM.id_usuario : null,
        pm_nombre: p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin PM',
        id_sponsor: p.Sponsor ? p.Sponsor.id_contacto : null,
        sponsor_nombre: p.Sponsor ? `${p.Sponsor.nombre || ''} ${p.Sponsor.apellidos || ''}`.trim() : '',
        id_proveedor: p.Proveedor ? p.Proveedor.id_proveedor : null,
        prov_nombre: p.Proveedor ? p.Proveedor.nombre_razon_social : 'Sin Partner',
        indicador_rag: p.indicador_rag,
        id_estado: p.Estado ? p.Estado.id_estado : null,
        estado_proyecto: p.Estado ? p.Estado.nombre_estado : 'Sin Estado',
        proyecto_cerrado: p.Estado ? p.Estado.proyecto_cerrado : false,
        es_estrategico: p.es_estrategico,
        es_iniciativa_ligera: p.es_iniciativa_ligera,
        portfolio_id: p.portfolio_id,
        fecha_inicio: p.fecha_inicio,
        fecha_fin_estimada: calc.fecha_fin_estimada,
        fecha_kickoff: p.fecha_kickoff,
        fecha_go_live: p.fecha_go_live,
        hitos,
        tareas
      };
    })
  );

  res.json(timelineData);
});

module.exports = {
  getTimeline
};
