const { Op } = require('sequelize');
const { 
  Proyectos, Usuarios, Proveedores, Sedes, ContactosProveedor,
  Tareas, EstadosProyecto, CambiosAlcance, Facturas, ComentariosProyecto,
  Incidencias, Riesgos, LeccionesAprendidas, Portfolios, Tags, TiposCapex, SubtiposCapex
} = require('../../models/index');
const { getProjectCalculations } = require('../../models/automations');
const { asyncHandler } = require('../../middlewares/errorHandler');

const getProjects = asyncHandler(async (req, res) => {
  const { pm, vendor, rag, search, state, estrategico, portfolio, tag } = req.query;
  const user = await Usuarios.findByPk(req.currentPmId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');
  
  const where = {};
  if (pm) where.id_pm = pm;
  if (vendor) where.id_proveedor = vendor;
  if (rag) where.indicador_rag = rag;
  if (estrategico) {
    where.es_estrategico = estrategico === 'true';
  }
  if (portfolio) {
    where.portfolio_id = portfolio;
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
    include: [
      { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
      { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
      { model: ContactosProveedor, as: 'Sponsor', attributes: ['nombre', 'apellidos'] },
      { model: Portfolios, as: 'Portfolio', attributes: ['id', 'nombre'] },
      { model: Tags, as: 'Tags', through: { attributes: [] } },
      { model: TiposCapex, as: 'TipoCapex', attributes: ['id', 'nombre'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['id', 'nombre'] },
      { 
        model: EstadosProyecto, 
        as: 'Estado', 
        attributes: ['id_estado', 'nombre_estado', 'icono'],
        ...(state ? { where: { nombre_estado: { [Op.in]: state.split(',') } } } : {})
      }
    ],
    order: [['createdAt', 'DESC']]
  });

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

      const commentWhere = { id_proyecto: project.id_proyecto };
      if (!canSeeDireccion) {
        commentWhere.para_direccion = false;
      }

      const lastComment = await ComentariosProyecto.findOne({
        where: commentWhere,
        order: [['fecha_registro', 'DESC']]
      });
      const ultimo_comentario = lastComment ? lastComment.texto_comentario.replace(/<[^>]+>/g, '') : '';

      return {
        ...project.toJSON(),
        calculations: calc,
        nextMilestone: nextMilestone ? nextMilestone.toJSON() : null,
        ultimo_comentario
      };
    })
  );

  res.json(projectsWithCalculations);
});

const getProjectDetail = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  
  const project = await Proyectos.findByPk(id_proyecto, {
    include: [
      { model: Usuarios, as: 'PM', attributes: ['id_usuario', 'nombre', 'apellidos', 'correo'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['id_proveedor', 'nombre_razon_social'] },
      { model: Sedes, as: 'Sede', attributes: ['id_sede', 'nombre_sede'] },
      { model: Sedes, as: 'SedeDistribuir', attributes: ['id_sede', 'nombre_sede'] },
      { model: ContactosProveedor, as: 'Sponsor', attributes: ['id_contacto', 'nombre', 'apellidos', 'email'] },
      { model: Portfolios, as: 'Portfolio', attributes: ['id', 'nombre', 'descripcion'] },
      { model: Tags, as: 'Tags', through: { attributes: [] } },
      { model: TiposCapex, as: 'TipoCapex', attributes: ['id', 'nombre'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['id', 'nombre'] },
      { 
        model: ContactosProveedor, 
        as: 'InvolvedContacts', 
        through: { attributes: ['rol', 'raci'] },
        include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }]
      },
      { 
        model: ContactosProveedor, 
        as: 'ComSemanalContactos', 
        through: { attributes: [] },
        include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }]
      },
      { 
        model: ContactosProveedor, 
        as: 'ComMensualContactos', 
        through: { attributes: [] },
        include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }]
      },
      { 
        model: ContactosProveedor, 
        as: 'ComSteerCoContactos', 
        through: { attributes: [] },
        include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }]
      },
      { model: Incidencias, order: [['fecha_apertura', 'DESC']] },
      { model: Riesgos, order: [['fecha_proxima_revision', 'ASC']] },
      { model: LeccionesAprendidas, order: [['fecha_registro', 'DESC']] },
      { model: Facturas, order: [['fecha_factura', 'DESC']] },
      { model: CambiosAlcance, include: [
        { model: ContactosProveedor, as: 'Solicitante', attributes: ['nombre', 'apellidos'] },
        { model: ContactosProveedor, as: 'Aprobador', attributes: ['nombre', 'apellidos'] }
      ], order: [['fecha_solicitud', 'DESC']] },
      { model: Tareas, order: [['fecha_limite', 'ASC']] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'icono', 'descripcion', 'pasos'] }
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
});

module.exports = {
  getProjects,
  getProjectDetail
};
