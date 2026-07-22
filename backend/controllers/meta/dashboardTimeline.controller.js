const { 
  Proyectos, Usuarios, Proveedores, EstadosProyecto, Tareas 
} = require('../../models/index');
const { getProjectCalculations } = require('../../models/automations');
const { asyncHandler } = require('../../middlewares/errorHandler');

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

module.exports = {
  getTimeline
};
