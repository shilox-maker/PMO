const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { 
  Proyectos, Usuarios, Proveedores, Sedes, ContactosProveedor,
  ProyectoContactos, Tareas, EstadosProyecto, CambiosAlcance, Facturas, ComentariosProyecto,
  Incidencias, Riesgos, LeccionesAprendidas, Portfolios, Tags, TiposCapex, SubtiposCapex
} = require('../models/index');
const { getProjectCalculations } = require('../models/automations');
const { 
  sanitizeHTML, sanitizeExcelValue, isValidISODate, generateNextId, parseToISODate
} = require('../utils/helpers');
const { asyncHandler } = require('../middlewares/errorHandler');

// Helper to resolve state
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

const createProject = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;

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

  if (data.es_capex && (!data.codigo_capex || data.codigo_capex.trim() === '')) {
    return res.status(400).json({ error: 'El código CAPEX es obligatorio para proyectos CAPEX.' });
  }
  if (data.es_capex && !data.id_tipo_capex) {
    return res.status(400).json({ error: 'El tipo de CAPEX es obligatorio para proyectos CAPEX.' });
  }
  if (data.es_capex && data.id_tipo_capex) {
    const tipo = await TiposCapex.findByPk(data.id_tipo_capex, {
      include: [{ model: SubtiposCapex, as: 'Subtipos' }]
    });
    if (tipo && tipo.Subtipos.length > 0 && !data.id_subtipo_capex) {
      return res.status(400).json({ error: 'El subtipo de CAPEX es obligatorio para el tipo seleccionado.' });
    }
  }
  if (!data.es_capex) {
    data.id_tipo_capex = null;
    data.id_subtipo_capex = null;
  }

  const dateFields = [
    'fecha_peticion', 'fecha_alcance_definido', 'fecha_aprobacion', 
    'fecha_planificacion', 'fecha_kickoff', 'fecha_go_live', 'fecha_cierre'
  ];
  for (const field of dateFields) {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'string' && data[field].trim() !== '') {
        data[field] = parseToISODate(data[field].trim());
      }
      if (data[field] === '' || data[field] === null) {
        data[field] = null;
      } else {
        if (!isValidISODate(data[field])) {
          return res.status(400).json({ error: `La fecha ${field} no cumple con el formato ISO 8601 (YYYY-MM-DD).` });
        }
      }
    }
  }

  if (!data.id_proyecto || data.id_proyecto.trim() === '') {
    data.id_proyecto = await generateNextId(Proyectos, 'PRJ', 'id_proyecto');
  } else {
    const idRegex = /^PRJ-\d{4}-\d{3}$/;
    if (!idRegex.test(data.id_proyecto)) {
      return res.status(400).json({ error: 'El ID del proyecto debe tener el formato PRJ-YYYY-XXX.' });
    }
  }

  await resolveStateId(data);

  if (!data.id_estado) {
    const firstState = await EstadosProyecto.findOne({ order: [['orden', 'ASC']] });
    if (firstState) data.id_estado = firstState.id_estado;
  }

  const project = await Proyectos.create(data);

  if (data.involvedKus) await project.setInvolvedContacts(data.involvedKus);
  if (data.comSemanalKus) await project.setComSemanalContactos(data.comSemanalKus);
  if (data.comMensualKus) await project.setComMensualContactos(data.comMensualKus);
  if (data.comSteercoKus) await project.setComSteerCoContactos(data.comSteercoKus);
  if (data.tagIds) await project.setTags(data.tagIds);

  res.status(201).json(project);
});

const updateProject = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;

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

  if (data.es_capex && (!data.codigo_capex || data.codigo_capex.trim() === '')) {
    return res.status(400).json({ error: 'El código CAPEX es obligatorio para proyectos CAPEX.' });
  }
  if (data.es_capex && !data.id_tipo_capex) {
    return res.status(400).json({ error: 'El tipo de CAPEX es obligatorio para proyectos CAPEX.' });
  }
  if (data.es_capex && data.id_tipo_capex) {
    const tipo = await TiposCapex.findByPk(data.id_tipo_capex, {
      include: [{ model: SubtiposCapex, as: 'Subtipos' }]
    });
    if (tipo && tipo.Subtipos.length > 0 && !data.id_subtipo_capex) {
      return res.status(400).json({ error: 'El subtipo de CAPEX es obligatorio para el tipo seleccionado.' });
    }
  }
  if (!data.es_capex) {
    data.id_tipo_capex = null;
    data.id_subtipo_capex = null;
  }

  const dateFields = [
    'fecha_peticion', 'fecha_alcance_definido', 'fecha_aprobacion', 
    'fecha_planificacion', 'fecha_kickoff', 'fecha_go_live', 'fecha_cierre'
  ];
  for (const field of dateFields) {
    if (data[field] !== undefined) {
      if (typeof data[field] === 'string' && data[field].trim() !== '') {
        data[field] = parseToISODate(data[field].trim());
      }
      if (data[field] === '' || data[field] === null) {
        data[field] = null;
      } else {
        if (!isValidISODate(data[field])) {
          return res.status(400).json({ error: `La fecha ${field} no cumple con el formato ISO 8601 (YYYY-MM-DD).` });
        }
      }
    }
  }

  await resolveStateId(data);

  const autorId = req.currentPmId || 0;
  const autorObj = await Usuarios.findByPk(autorId);
  const nombreAutor = autorObj ? `${autorObj.nombre} ${autorObj.apellidos}` : 'Sistema';

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
    if (!currentKickoff || (typeof currentKickoff === 'string' && currentKickoff.trim() === '')) {
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
    if (!currentGoLive || (typeof currentGoLive === 'string' && currentGoLive.trim() === '')) {
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

  if (data.involvedKus) await project.setInvolvedContacts(data.involvedKus);
  if (data.comSemanalKus) await project.setComSemanalContactos(data.comSemanalKus);
  if (data.comMensualKus) await project.setComMensualContactos(data.comMensualKus);
  if (data.comSteercoKus) await project.setComSteerCoContactos(data.comSteercoKus);
  if (data.tagIds !== undefined) await project.setTags(data.tagIds);

  res.json(project);
});

const deleteProject = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const project = await Proyectos.findByPk(id_proyecto);
  if (!project) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }

  const user = await Usuarios.findByPk(req.currentPmId);
  if (!user) {
    return res.status(401).json({ error: 'Acceso denegado. Usuario no encontrado.' });
  }

  const isAuthorized = user.perfil === 'ADMINISTRADOR' || 
                       user.perfil === 'DIRECTOR' || 
                       project.id_pm === req.currentPmId;

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para eliminar este proyecto.' });
  }

  await project.destroy();
  res.json({ message: 'Proyecto eliminado con éxito' });
});

const exportProjects = asyncHandler(async (req, res) => {
  const { pm, vendor, rag, search, state, cols, estrategico, ids } = req.query;

  const where = {};
  if (ids) {
    where.id_proyecto = { [Op.in]: ids.split(',') };
  } else {
    if (pm) where.id_pm = pm;
    if (vendor) where.id_proveedor = vendor;
    if (rag) where.indicador_rag = rag;
    if (estrategico) {
      where.es_estrategico = estrategico === 'true';
    }
    if (search) {
      where.nombre_proyecto = { [Op.like]: `%${search}%` };
    }
    if (state) {
      where['$Estado.nombre_estado$'] = { [Op.in]: state.split(',') };
    }
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
    const mappedAllowed = new Set(allowedCols);
    if (mappedAllowed.has('budget')) {
      mappedAllowed.add('budget_inicial');
      mappedAllowed.add('budget_actualizado');
      mappedAllowed.add('presupuesto_disponible');
    }
    if (mappedAllowed.has('progreso')) {
      mappedAllowed.add('consumo_real');
    }
    if (mappedAllowed.has('proveedor')) {
      mappedAllowed.add('proveedor');
    }
    if (mappedAllowed.has('pm')) {
      mappedAllowed.add('pm');
    }
    if (mappedAllowed.has('estado_proyecto')) {
      mappedAllowed.add('estado_proyecto');
    }

    exportCols = exportCols.filter(c => mappedAllowed.has(c.key) || c.key === 'id_proyecto' || c.key === 'nombre_proyecto');
  }

  worksheet.columns = exportCols;

  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1A1A2E' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  const rowsData = await Promise.all(
    projectsList.map(async (p) => {
      const id_proyecto = p.id_proyecto;

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

      return {
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
      };
    })
  );

  const hasCol = (key) => exportCols.some(c => c.key === key);

  for (const data of rowsData) {
    const row = worksheet.addRow(data);
    if (hasCol('budget_inicial')) row.getCell('budget_inicial').numFmt = '#,##0.00" €"';
    if (hasCol('budget_actualizado')) row.getCell('budget_actualizado').numFmt = '#,##0.00" €"';
    if (hasCol('consumo_real')) row.getCell('consumo_real').numFmt = '#,##0.00" €"';
    if (hasCol('presupuesto_disponible')) row.getCell('presupuesto_disponible').numFmt = '#,##0.00" €"';
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
});

const addParticipant = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const { id_contacto, rol, raci } = req.body;
  if (!id_contacto || !rol || !raci) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: id_contacto, rol, raci.' });
  }
  const project = await Proyectos.findByPk(id_proyecto);
  if (!project) {
    return res.status(404).json({ error: 'Proyecto no encontrado.' });
  }
  
  const [association, created] = await ProyectoContactos.findOrCreate({
    where: { id_proyecto, id_contacto },
    defaults: { rol, raci }
  });

  if (!created) {
    await association.update({ rol, raci });
  }

  res.json({ message: 'Participante guardado con éxito', association });
});

const removeParticipant = asyncHandler(async (req, res) => {
  const { id_proyecto, id_contacto } = req.params;
  const count = await ProyectoContactos.destroy({
    where: { id_proyecto, id_contacto }
  });
  if (count === 0) {
    return res.status(404).json({ error: 'Participante no encontrado en este proyecto.' });
  }
  res.json({ message: 'Participante eliminado con éxito.' });
});

module.exports = {
  getProjects,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  exportProjects,
  addParticipant,
  removeParticipant
};
