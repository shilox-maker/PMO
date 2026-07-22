const { ComentariosProyecto, Usuarios } = require('../../models/index');
const { sanitizeHTML } = require('../../utils/helpers');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- COMENTARIOS ---
const getProjectComments = asyncHandler(async (req, res) => {
  const user = await Usuarios.findByPk(req.currentPmId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');

  const where = { id_proyecto: req.params.id_proyecto };
  if (!canSeeDireccion) {
    where.para_direccion = false;
  }

  const comments = await ComentariosProyecto.findAll({
    where,
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ],
    order: [['fecha_registro', 'DESC']]
  });
  res.json(comments);
});

const createComment = asyncHandler(async (req, res) => {
  const { id_proyecto, texto_comentario, es_importante, para_direccion } = req.body;
  const authorId = req.currentPmId;
  if (!authorId) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }
  if (!id_proyecto || !texto_comentario || texto_comentario.trim() === '') {
    return res.status(400).json({ error: 'El código del proyecto y el texto del comentario son obligatorios.' });
  }

  const user = await Usuarios.findByPk(authorId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');

  const comment = await ComentariosProyecto.create({
    id_proyecto,
    id_usuario: authorId,
    texto_comentario: sanitizeHTML(texto_comentario),
    es_importante: es_importante !== undefined ? !!es_importante : false,
    para_direccion: (para_direccion !== undefined && canSeeDireccion) ? !!para_direccion : false,
    fecha_registro: new Date()
  });

  const fullComment = await ComentariosProyecto.findByPk(comment.id_comentario, {
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ]
  });

  res.status(201).json(fullComment);
});

const updateComment = asyncHandler(async (req, res) => {
  const { id_comentario } = req.params;
  const { texto_comentario, es_importante, para_direccion } = req.body;
  const editorId = req.currentPmId;
  if (!editorId) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }
  if (!texto_comentario || texto_comentario.trim() === '') {
    return res.status(400).json({ error: 'El texto del comentario es obligatorio.' });
  }

  const comment = await ComentariosProyecto.findByPk(id_comentario);
  if (!comment) {
    return res.status(404).json({ error: 'Comentario no encontrado.' });
  }

  const user = await Usuarios.findByPk(editorId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');

  const updateData = {
    texto_comentario: sanitizeHTML(texto_comentario),
    editado: true,
    id_usuario_modificacion: editorId,
    fecha_modificacion: new Date()
  };
  if (es_importante !== undefined) {
    updateData.es_importante = !!es_importante;
  }
  if (para_direccion !== undefined) {
    updateData.para_direccion = canSeeDireccion ? !!para_direccion : false;
  }

  await comment.update(updateData);

  const fullComment = await ComentariosProyecto.findByPk(id_comentario, {
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ]
  });

  res.json(fullComment);
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id_comentario } = req.params;
  const comment = await ComentariosProyecto.findByPk(id_comentario);
  if (!comment) {
    return res.status(404).json({ error: 'Comentario no encontrado.' });
  }
  await comment.destroy();
  res.json({ message: 'Comentario eliminado con éxito.' });
});

module.exports = {
  getProjectComments,
  createComment,
  updateComment,
  deleteComment
};
