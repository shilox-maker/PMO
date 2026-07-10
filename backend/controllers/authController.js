const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const https = require('https');
const { JWT_SECRET } = require('../config/jwt');
const { Usuarios } = require('../models/index');
const { hashPassword } = require('../utils/helpers');
const { asyncHandler } = require('../middlewares/errorHandler');

function getMicrosoftKeys() {
  return new Promise((resolve, reject) => {
    https.get('https://login.microsoftonline.com/common/discovery/v2.0/keys', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data).keys);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}


const login = asyncHandler(async (req, res) => {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'El correo y la contraseña son obligatorios.' });
    }

    const user = await Usuarios.scope('withPassword').findOne({ where: { correo } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no registrado o credenciales incorrectas.' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Tu usuario se encuentra inactivo. Contacta a un administrador.' });
    }

    if (user.metodo_acceso !== 'PASSWORD') {
      return res.status(401).json({ error: 'Este usuario está configurado para acceder únicamente a través de Microsoft Entra ID (Azure AD).' });
    }

    let isValid = false;
    
    if (user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      let hashedInput;
      if (!user.password_salt) {
        hashedInput = crypto.createHash('sha256').update(password).digest('hex');
      } else {
        hashedInput = crypto.createHash('sha256').update(password + user.password_salt).digest('hex');
      }
      
      if (user.password === hashedInput) {
        isValid = true;
        const newHash = await hashPassword(password);
        await user.update({ password: newHash, password_salt: null });
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id_usuario: user.id_usuario, perfil: user.perfil },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellidos: user.apellidos,
        correo: user.correo,
        perfil: user.perfil,
        activo: user.activo
      }
    });
});

const verify = asyncHandler(async (req, res) => {
    const pmId = req.currentPmId;
    if (!pmId) {
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }

    const user = await Usuarios.findByPk(pmId);
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Usuario inactivo o no encontrado.' });
    }

    res.json({
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellidos: user.apellidos,
        correo: user.correo,
        perfil: user.perfil,
        activo: user.activo
      }
    });
});

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.currentPmId;
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Ambas contraseñas son obligatorias.' });
    }

    const user = await Usuarios.scope('withPassword').findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    let isValid = false;
    if (user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      let hashedCurrent = crypto.createHash('sha256').update(currentPassword).digest('hex');
      if (user.password_salt) {
         hashedCurrent = crypto.createHash('sha256').update(currentPassword + user.password_salt).digest('hex');
      }
      if (user.password === hashedCurrent) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{10,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'La nueva contraseña no cumple con la política de seguridad requerida.' });
    }

    const newHash = await hashPassword(newPassword);

    await user.update({ password: newHash, password_salt: null });

    res.json({ message: 'Contraseña actualizada correctamente.' });
});

const loginAzure = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'El token de Azure AD es obligatorio.' });
  }

  let correo;

  // Soporte para MOCK
  if (process.env.AZURE_MOCK === 'true') {
    if (token.startsWith('mock-token-')) {
      const userPart = token.replace('mock-token-', '');
      if (userPart === 'rmoreno') {
        correo = 'rmoreno@dacsa.com';
      } else {
        correo = `${userPart}@dacsa.com`;
      }
    } else if (token.includes('@')) {
      correo = token;
    } else {
      correo = 'rmoreno@dacsa.com'; // Default seed user con ENTRA_ID
    }
  } else {
    // Validación real usando nodejs crypto y jsonwebtoken
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      return res.status(400).json({ error: 'Token de Azure AD inválido o mal formado.' });
    }

    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;

    if (!tenantId || !clientId) {
      return res.status(500).json({ error: 'Servicio de autenticación no configurado. Faltan variables de entorno.' });
    }

    try {
      const keys = await getMicrosoftKeys();
      const jwk = keys.find(k => k.kid === decodedToken.header.kid);
      if (!jwk) {
        return res.status(401).json({ error: 'No se encontró la clave pública correspondiente al token.' });
      }

      // Convertir JWK a PEM nativamente
      const publicKey = crypto.createPublicKey({
        format: 'jwk',
        key: jwk
      });
      const pem = publicKey.export({ type: 'spki', format: 'pem' });

      // Verificar token
      const decoded = jwt.verify(token, pem, {
        audience: clientId,
        issuer: [
          `https://login.microsoftonline.com/${tenantId}/v2.0`,
          `https://sts.windows.net/${tenantId}/`
        ]
      });

      correo = decoded.preferred_username || decoded.email || decoded.unique_name;
    } catch (err) {
      return res.status(401).json({ error: `Fallo al verificar el token de Azure AD: ${err.message}` });
    }
  }

  if (!correo) {
    return res.status(400).json({ error: 'No se pudo obtener el correo electrónico del token de Azure AD.' });
  }

  // Buscar el usuario en la BD local
  const user = await Usuarios.findOne({ where: { correo } });
  if (!user) {
    return res.status(401).json({ error: `El usuario ${correo} no está registrado en PMO Control Tower. Contacta a un administrador.` });
  }

  if (!user.activo) {
    return res.status(403).json({ error: 'Tu usuario se encuentra inactivo. Contacta a un administrador.' });
  }

  if (user.metodo_acceso !== 'ENTRA_ID') {
    return res.status(401).json({ error: 'Este usuario está configurado para acceder únicamente mediante contraseña local.' });
  }

  // Generar JWT local de la aplicación
  const localToken = jwt.sign(
    { id_usuario: user.id_usuario, perfil: user.perfil },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token: localToken,
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      apellidos: user.apellidos,
      correo: user.correo,
      perfil: user.perfil,
      activo: user.activo
    }
  });
});

module.exports = {
  login,
  verify,
  changePassword,
  loginAzure
};

