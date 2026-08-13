const { Ambitos, UsuarioAmbitos, Usuarios } = require('../models');
const { handleErr } = require('../utils/helpers');

// GET /api/ambitos - Obtener ámbitos disponibles para el usuario autenticado
const getAmbitosUsuario = async (req, res) => {
  try {
    const user = req.currentUser;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }
    const isAdminOrDirector = ['ADMINISTRADOR', 'DIRECTOR'].includes(user.perfil);

    let ambitos = [];
    if (isAdminOrDirector) {
      ambitos = await Ambitos.findAll({
        where: { activo: true },
        order: [['id_ambito', 'ASC']]
      });
    } else {
      let userAmbitos = user.Ambitos;
      if (!userAmbitos) {
        const fullUser = await Usuarios.findByPk(user.id_usuario, {
          include: [{ model: Ambitos, as: 'Ambitos' }]
        });
        userAmbitos = fullUser ? fullUser.Ambitos : [];
      }
      ambitos = userAmbitos ? userAmbitos.filter(a => a.activo) : [];
    }

    res.json({
      ambitos,
      canSelectAll: isAdminOrDirector,
      currentAmbitoId: req.currentAmbitoId
    });
  } catch (error) {
    handleErr(res, error, 500);
  }
};

// GET /api/ambitos/admin - Obtener todos los ámbitos (Panel Admin)
const getAllAmbitosAdmin = async (req, res) => {
  try {
    const ambitos = await Ambitos.findAll({
      order: [['id_ambito', 'ASC']]
    });
    res.json(ambitos);
  } catch (error) {
    handleErr(res, error, 500);
  }
};

// POST /api/ambitos - Crear un nuevo ámbito (Admin)
const createAmbito = async (req, res) => {
  try {
    const { nombre, code, descripcion, activo } = req.body;
    if (!nombre || !code) {
      return res.status(400).json({ error: 'Nombre y código son obligatorios.' });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await Ambitos.findOne({ where: { code: cleanCode } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un ámbito con este código.' });
    }

    const newAmbito = await Ambitos.create({
      nombre,
      code: cleanCode,
      descripcion: descripcion || '',
      activo: activo !== undefined ? activo : true
    });

    res.status(201).json(newAmbito);
  } catch (error) {
    handleErr(res, error, 500);
  }
};

// PUT /api/ambitos/:id - Actualizar ámbito (Admin)
const updateAmbito = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, code, descripcion, activo } = req.body;

    const ambito = await Ambitos.findByPk(id);
    if (!ambito) {
      return res.status(404).json({ error: 'Ámbito no encontrado.' });
    }

    if (code && code.trim().toUpperCase() !== ambito.code) {
      const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '_');
      const existing = await Ambitos.findOne({ where: { code: cleanCode } });
      if (existing) {
        return res.status(400).json({ error: 'Ya existe otro ámbito con este código.' });
      }
      ambito.code = cleanCode;
    }

    if (nombre !== undefined) ambito.nombre = nombre;
    if (descripcion !== undefined) ambito.descripcion = descripcion;
    if (activo !== undefined) ambito.activo = activo;

    await ambito.save();
    res.json(ambito);
  } catch (error) {
    handleErr(res, error, 500);
  }
};

// PUT /api/ambitos/usuarios/:id_usuario - Asignar ámbitos a un usuario (Admin)
const updateUserAmbitos = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { ambitosIds } = req.body; // Array de IDs de ámbitos [1, 2]

    if (!Array.isArray(ambitosIds)) {
      return res.status(400).json({ error: 'ambitosIds debe ser un array de identificadores.' });
    }

    const usuario = await Usuarios.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (usuario.perfil !== 'ADMINISTRADOR' && ambitosIds.length === 0) {
      return res.status(400).json({ error: 'Un usuario no administrador debe tener al menos un ámbito asociado.' });
    }

    await UsuarioAmbitos.destroy({ where: { id_usuario } });

    const newAssociations = ambitosIds.map(id_ambito => ({
      id_usuario,
      id_ambito,
      rol_ambito: 'MEMBER'
    }));

    if (newAssociations.length > 0) {
      await UsuarioAmbitos.bulkCreate(newAssociations);
    }

    res.json({ message: 'Ámbitos del usuario actualizados correctamente.' });
  } catch (error) {
    handleErr(res, error, 500);
  }
};

module.exports = {
  getAmbitosUsuario,
  getAllAmbitosAdmin,
  createAmbito,
  updateAmbito,
  updateUserAmbitos
};
