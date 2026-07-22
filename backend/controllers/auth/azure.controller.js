const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const { JWT_SECRET } = require('../../config/jwt');
const { Usuarios } = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

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
  loginAzure
};
