const { Workflows, WorkflowEstados, EstadosProyecto, EstadoTareasPlantilla, Proyectos, Ambitos, sequelize } = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- GET ALL WORKFLOWS (Admin) ---
const getWorkflows = asyncHandler(async (req, res) => {
  const where = {};
  if (req.currentAmbitoId && req.currentAmbitoId !== 'ALL') {
    // Si se especifica ámbito en cabecera de admin, filtrar flujos globales o de ese ámbito
    // Para administradores en vista global, req.currentAmbitoId es 'ALL'
  }

  const workflows = await Workflows.findAll({
    where,
    include: [
      {
        model: EstadosProyecto,
        as: 'Estados',
        include: [{ model: EstadoTareasPlantilla, as: 'TareasPlantilla' }],
        through: { attributes: ['orden', 'id'] }
      },
      {
        model: Ambitos,
        as: 'Ambito',
        attributes: ['id_ambito', 'nombre', 'code']
      }
    ],
    order: [
      ['is_default', 'DESC'],
      ['nombre', 'ASC']
    ]
  });

  // Ordenar los estados de cada workflow según el orden especificado en la tabla intermedia
  const formatted = await Promise.all(workflows.map(async (wf) => {
    const wfJson = wf.toJSON();
    if (wfJson.Estados && Array.isArray(wfJson.Estados)) {
      wfJson.Estados.sort((a, b) => {
        const ordA = a.Workflow_Estados?.orden ?? 0;
        const ordB = b.Workflow_Estados?.orden ?? 0;
        return ordA - ordB;
      });
    }
    const projectCount = await Proyectos.count({ where: { id_workflow: wf.id } });
    wfJson.projectCount = projectCount;
    return wfJson;
  }));

  res.json(formatted);
});

// --- CREATE WORKFLOW ---
const createWorkflow = asyncHandler(async (req, res) => {
  const { nombre, descripcion, activo, is_default, id_ambito, code, stateIds, states } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del flujo es obligatorio.' });
  }

  const trimmedNombre = nombre.trim();
  const existing = await Workflows.findOne({ where: { nombre: trimmedNombre } });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe un flujo de trabajo con ese nombre.' });
  }

  let finalAmbitoId = null;
  if (id_ambito !== undefined && id_ambito !== null && id_ambito !== '') {
    finalAmbitoId = Number(id_ambito);
  }

  const stateList = Array.isArray(states) ? states : (Array.isArray(stateIds) ? stateIds : []);

  const result = await sequelize.transaction(async (t) => {
    if (is_default) {
      await Workflows.update({ is_default: false }, { where: {}, transaction: t });
    }

    const workflow = await Workflows.create({
      nombre: trimmedNombre,
      descripcion: descripcion ? descripcion.trim() : null,
      activo: activo !== undefined ? !!activo : true,
      is_default: !!is_default,
      id_ambito: finalAmbitoId,
      code: code ? code.trim() : null
    }, { transaction: t });

    // Si se pasan states o stateIds al crear, asociarlos
    if (stateList.length > 0) {
      const links = stateList.map((item, idx) => ({
        id_workflow: workflow.id,
        id_estado: typeof item === 'object' && item !== null ? Number(item.id_estado) : Number(item),
        orden: typeof item === 'object' && item !== null && item.orden !== undefined ? Number(item.orden) : idx + 1
      }));
      await WorkflowEstados.bulkCreate(links, { transaction: t });
    }

    return workflow;
  });

  const fullWorkflow = await Workflows.findByPk(result.id, {
    include: [
      {
        model: EstadosProyecto,
        as: 'Estados',
        include: [{ model: EstadoTareasPlantilla, as: 'TareasPlantilla' }],
        through: { attributes: ['orden', 'id'] }
      },
      {
        model: Ambitos,
        as: 'Ambito',
        attributes: ['id_ambito', 'nombre', 'code']
      }
    ]
  });

  res.status(201).json(fullWorkflow);
});

// --- UPDATE WORKFLOW ---
const updateWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, activo, is_default, id_ambito, code } = req.body;

  const workflow = await Workflows.findByPk(id);
  if (!workflow) {
    return res.status(404).json({ error: 'Flujo de trabajo no encontrado.' });
  }

  if (nombre !== undefined && !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del flujo no puede estar vacío.' });
  }

  if (nombre) {
    const existing = await Workflows.findOne({ where: { nombre: nombre.trim() } });
    if (existing && existing.id !== Number(id)) {
      return res.status(400).json({ error: 'Ya existe otro flujo de trabajo con ese nombre.' });
    }
  }

  let finalAmbitoId = workflow.id_ambito;
  if (id_ambito !== undefined) {
    finalAmbitoId = (id_ambito === null || id_ambito === '') ? null : Number(id_ambito);
  }

  await sequelize.transaction(async (t) => {
    if (is_default === true && !workflow.is_default) {
      await Workflows.update({ is_default: false }, { where: {}, transaction: t });
    }

    await workflow.update({
      nombre: nombre !== undefined ? nombre.trim() : workflow.nombre,
      descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : workflow.descripcion,
      activo: activo !== undefined ? !!activo : workflow.activo,
      is_default: is_default !== undefined ? !!is_default : workflow.is_default,
      id_ambito: finalAmbitoId,
      code: code !== undefined ? (code ? code.trim() : null) : workflow.code
    }, { transaction: t });
  });

  const fullWorkflow = await Workflows.findByPk(id, {
    include: [
      {
        model: EstadosProyecto,
        as: 'Estados',
        include: [{ model: EstadoTareasPlantilla, as: 'TareasPlantilla' }],
        through: { attributes: ['orden', 'id'] }
      },
      {
        model: Ambitos,
        as: 'Ambito',
        attributes: ['id_ambito', 'nombre', 'code']
      }
    ]
  });

  res.json(fullWorkflow);
});

// --- DELETE WORKFLOW ---
const deleteWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workflow = await Workflows.findByPk(id);
  if (!workflow) {
    return res.status(404).json({ error: 'Flujo de trabajo no encontrado.' });
  }

  const inUse = await Proyectos.count({ where: { id_workflow: id } });
  if (inUse > 0) {
    return res.status(400).json({ error: `No se puede eliminar el flujo porque tiene ${inUse} proyectos asociados.` });
  }

  if (workflow.is_default) {
    const totalCount = await Workflows.count();
    if (totalCount > 1) {
      return res.status(400).json({ error: 'No se puede eliminar el flujo predeterminado. Designe otro flujo como predeterminado primero.' });
    }
  }

  await workflow.destroy();
  res.json({ message: 'Flujo de trabajo eliminado con éxito.' });
});

// --- SET WORKFLOW STATES (Atomic sync and reordering) ---
const setWorkflowStates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { states } = req.body; // Array of { id_estado, orden } or Array of id_estado

  const workflow = await Workflows.findByPk(id);
  if (!workflow) {
    return res.status(404).json({ error: 'Flujo de trabajo no encontrado.' });
  }

  if (!Array.isArray(states)) {
    return res.status(400).json({ error: 'Se requiere una lista de estados válida.' });
  }

  await sequelize.transaction(async (t) => {
    // Eliminar asociaciones actuales
    await WorkflowEstados.destroy({ where: { id_workflow: id }, transaction: t });

    // Crear nuevas asociaciones
    if (states.length > 0) {
      const records = states.map((st, idx) => {
        const id_estado = typeof st === 'object' ? Number(st.id_estado) : Number(st);
        const orden = typeof st === 'object' && st.orden !== undefined ? Number(st.orden) : (idx + 1);
        return {
          id_workflow: Number(id),
          id_estado,
          orden
        };
      });
      await WorkflowEstados.bulkCreate(records, { transaction: t });
    }
  });

  const fullWorkflow = await Workflows.findByPk(id, {
    include: [
      {
        model: EstadosProyecto,
        as: 'Estados',
        include: [{ model: EstadoTareasPlantilla, as: 'TareasPlantilla' }],
        through: { attributes: ['orden', 'id'] }
      }
    ]
  });

  const wfJson = fullWorkflow.toJSON();
  if (wfJson.Estados && Array.isArray(wfJson.Estados)) {
    wfJson.Estados.sort((a, b) => (a.Workflow_Estados?.orden ?? 0) - (b.Workflow_Estados?.orden ?? 0));
  }

  res.json(wfJson);
});

// --- ADD SINGLE STATE TO WORKFLOW ---
const addStateToWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id_estado, orden } = req.body;

  if (!id_estado) {
    return res.status(400).json({ error: 'id_estado es obligatorio.' });
  }

  const workflow = await Workflows.findByPk(id);
  if (!workflow) {
    return res.status(404).json({ error: 'Flujo de trabajo no encontrado.' });
  }

  const state = await EstadosProyecto.findByPk(id_estado);
  if (!state) {
    return res.status(404).json({ error: 'Estado no encontrado.' });
  }

  const existing = await WorkflowEstados.findOne({
    where: { id_workflow: id, id_estado }
  });
  if (existing) {
    return res.status(400).json({ error: 'El estado ya pertenece a este flujo de trabajo.' });
  }

  let finalOrden = orden;
  if (finalOrden === undefined || finalOrden === null) {
    const maxOrd = await WorkflowEstados.max('orden', { where: { id_workflow: id } });
    finalOrden = (maxOrd || 0) + 1;
  }

  const created = await WorkflowEstados.create({
    id_workflow: Number(id),
    id_estado: Number(id_estado),
    orden: Number(finalOrden)
  });

  res.status(201).json(created);
});

// --- REMOVE SINGLE STATE FROM WORKFLOW ---
const removeStateFromWorkflow = asyncHandler(async (req, res) => {
  const { id, id_estado } = req.params;

  const link = await WorkflowEstados.findOne({
    where: { id_workflow: id, id_estado }
  });
  if (!link) {
    return res.status(404).json({ error: 'El estado no forma parte de este flujo de trabajo.' });
  }

  await link.destroy();
  res.json({ message: 'Estado eliminado del flujo de trabajo.' });
});

module.exports = {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  setWorkflowStates,
  addStateToWorkflow,
  removeStateFromWorkflow
};
