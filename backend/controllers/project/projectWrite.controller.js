const { 
  Proyectos, Usuarios, EstadosProyecto, ComentariosProyecto,
  Workflows, WorkflowEstados
} = require('../../models/index');
const { generateNextId } = require('../../utils/helpers');
const { asyncHandler } = require('../../middlewares/errorHandler');
const {
  sanitizeRichTextFields,
  validateCapexFields,
  validateDateFields
} = require('./projectValidation.helper');

// Helper to resolve state and workflow
async function resolveWorkflowAndState(data) {
  // 1. Resolver Workflow si no viene indicado
  if (!data.id_workflow) {
    const defaultWf = await Workflows.findOne({ where: { is_default: true, activo: true } })
      || await Workflows.findOne({ where: { activo: true }, order: [['id', 'ASC']] });
    if (defaultWf) {
      data.id_workflow = defaultWf.id;
    }
  }

  // 2. Si viene texto de estado sin id_estado, buscar id_estado
  if (data.estado_proyecto && !data.id_estado) {
    const stateObj = await EstadosProyecto.findOne({ where: { nombre_estado: data.estado_proyecto } });
    if (stateObj) data.id_estado = stateObj.id_estado;
  }

  // 3. Si hay id_workflow asignado, obtener sus estados ordenados
  if (data.id_workflow) {
    const wfStates = await WorkflowEstados.findAll({
      where: { id_workflow: data.id_workflow },
      order: [['orden', 'ASC']]
    });

    if (wfStates.length > 0) {
      // Si no tiene id_estado o el id_estado no pertenece al flujo, usar el primer estado del flujo
      if (!data.id_estado) {
        data.id_estado = wfStates[0].id_estado;
      }
    }
  }

  // Fallback si todavía no hay id_estado
  if (!data.id_estado) {
    const firstState = await EstadosProyecto.findOne({ order: [['orden', 'ASC']] });
    if (firstState) data.id_estado = firstState.id_estado;
  }
}

const createProject = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;

  sanitizeRichTextFields(data);
  if (data.id_ambito) {
    data.id_ambito = Number(data.id_ambito);
  } else if (req.currentAmbitoId && req.currentAmbitoId !== 'ALL') {
    data.id_ambito = req.currentAmbitoId;
  } else {
    data.id_ambito = 1;
  }
  if (!(await validateCapexFields(data, res))) return;
  if (!validateDateFields(data, res)) return;

  if (!data.id_proyecto || data.id_proyecto.trim() === '') {
    data.id_proyecto = await generateNextId(Proyectos, 'PRJ', 'id_proyecto');
  } else {
    const idRegex = /^PRJ-\d{4}-\d{3}$/;
    if (!idRegex.test(data.id_proyecto)) {
      return res.status(400).json({ error: 'El ID del proyecto debe tener el formato PRJ-YYYY-XXX.' });
    }
  }

  if (data.id_workflow) {
    data.id_workflow = Number(data.id_workflow);
  }

  await resolveWorkflowAndState(data);

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

  sanitizeRichTextFields(data);
  if (data.id_ambito !== undefined) {
    data.id_ambito = data.id_ambito ? Number(data.id_ambito) : null;
  }

  const project = await Proyectos.findByPk(id_proyecto);
  if (!project) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }

  if (!(await validateCapexFields(data, res))) return;
  if (!validateDateFields(data, res)) return;

  if (data.id_workflow !== undefined) {
    data.id_workflow = data.id_workflow ? Number(data.id_workflow) : null;
  }
  if (data.id_estado !== undefined) {
    data.id_estado = data.id_estado ? Number(data.id_estado) : null;
  }

  const targetWorkflowId = data.id_workflow !== undefined ? data.id_workflow : project.id_workflow;
  if (targetWorkflowId) {
    const wfStates = await WorkflowEstados.findAll({
      where: { id_workflow: targetWorkflowId },
      order: [['orden', 'ASC']]
    });

    if (wfStates.length > 0) {
      const validStateIds = wfStates.map(w => w.id_estado);
      // Si se envió un id_estado específico, validar que pertenezca al flujo
      if (data.id_estado && !validStateIds.includes(data.id_estado)) {
        return res.status(400).json({ error: 'El estado seleccionado no pertenece al flujo de trabajo del proyecto.' });
      }
      // Si cambió de flujo y no se especificó id_estado, comprobar si el estado actual sigue siendo válido
      if (data.id_workflow !== undefined && data.id_estado === undefined) {
        if (!validStateIds.includes(project.id_estado)) {
          data.id_estado = wfStates[0].id_estado;
        }
      }
    }
  }

  if (data.estado_proyecto && !data.id_estado) {
    const stateObj = await EstadosProyecto.findOne({ where: { nombre_estado: data.estado_proyecto } });
    if (stateObj) data.id_estado = stateObj.id_estado;
  }

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

module.exports = {
  createProject,
  updateProject,
  deleteProject
};
