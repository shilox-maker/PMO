const { ComentariosDireccionProyecto, Usuarios } = require('../../models/index');
const { sanitizeHTML } = require('../../utils/helpers');
const { asyncHandler } = require('../../middlewares/errorHandler');

const isUserDirectorOrAdmin = async (userId) => {
  if (!userId) return false;
  const user = await Usuarios.findByPk(userId);
  return user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');
};

// --- COMENTARIOS DE DIRECCIÓN ---
const getProjectDirectionComments = asyncHandler(async (req, res) => {
  const canAccess = await isUserDirectorOrAdmin(req.currentPmId);
  if (!canAccess) {
    return res.status(403).json({ error: 'Acceso denegado. Solo accesible por el rol de Dirección o Administrador.' });
  }

  const comments = await ComentariosDireccionProyecto.findAll({
    where: { id_proyecto: req.params.id_proyecto },
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ],
    order: [['fecha_registro', 'DESC']]
  });
  res.json(comments);
});

const createDirectionComment = asyncHandler(async (req, res) => {
  const authorId = req.currentPmId;
  const canAccess = await isUserDirectorOrAdmin(authorId);
  if (!canAccess) {
    return res.status(403).json({ error: 'Acceso denegado. Solo el rol de Dirección o Administrador puede publicar comentarios de dirección.' });
  }

  const id_proyecto = req.body.id_proyecto || req.params.id_proyecto;
  const { texto_comentario, es_importante } = req.body;

  if (!id_proyecto || !texto_comentario || texto_comentario.trim() === '') {
    return res.status(400).json({ error: 'El código del proyecto y el texto del comentario son obligatorios.' });
  }

  const comment = await ComentariosDireccionProyecto.create({
    id_proyecto,
    id_usuario: authorId,
    texto_comentario: sanitizeHTML(texto_comentario),
    es_importante: es_importante !== undefined ? !!es_importante : false,
    fecha_registro: new Date()
  });

  const fullComment = await ComentariosDireccionProyecto.findByPk(comment.id_comentario, {
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ]
  });

  res.status(201).json(fullComment);
});

const updateDirectionComment = asyncHandler(async (req, res) => {
  const editorId = req.currentPmId;
  const canAccess = await isUserDirectorOrAdmin(editorId);
  if (!canAccess) {
    return res.status(403).json({ error: 'Acceso denegado. Solo el rol de Dirección o Administrador puede editar comentarios de dirección.' });
  }

  const { id_comentario } = req.params;
  const { texto_comentario, es_importante } = req.body;

  if (!texto_comentario || texto_comentario.trim() === '') {
    return res.status(400).json({ error: 'El texto del comentario es obligatorio.' });
  }

  const comment = await ComentariosDireccionProyecto.findByPk(id_comentario);
  if (!comment) {
    return res.status(404).json({ error: 'Comentario de dirección no encontrado.' });
  }

  const updateData = {
    texto_comentario: sanitizeHTML(texto_comentario),
    editado: true,
    id_usuario_modificacion: editorId,
    fecha_modificacion: new Date()
  };
  if (es_importante !== undefined) {
    updateData.es_importante = !!es_importante;
  }

  await comment.update(updateData);

  const fullComment = await ComentariosDireccionProyecto.findByPk(id_comentario, {
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ]
  });

  res.json(fullComment);
});

const deleteDirectionComment = asyncHandler(async (req, res) => {
  const canAccess = await isUserDirectorOrAdmin(req.currentPmId);
  if (!canAccess) {
    return res.status(403).json({ error: 'Acceso denegado. Solo el rol de Dirección o Administrador puede eliminar comentarios de dirección.' });
  }

  const { id_comentario } = req.params;
  const comment = await ComentariosDireccionProyecto.findByPk(id_comentario);
  if (!comment) {
    return res.status(404).json({ error: 'Comentario de dirección no encontrado.' });
  }
  await comment.destroy();
  res.json({ message: 'Comentario de dirección eliminado con éxito.' });
});

module.exports = {
  getProjectDirectionComments,
  createDirectionComment,
  updateDirectionComment,
  deleteDirectionComment
};
