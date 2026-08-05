const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { createMcpServer } = require('./serverFactory');

const activeTransports = new Map();

function verifyMcpApiKey(req, res, next) {
  const expectedKey = process.env.MCP_API_KEY;
  if (!expectedKey) {
    return next(); // Si no está configurada la clave en .env, permite paso (o lanza advertencia)
  }

  const authHeader = req.headers['authorization'];
  const apiKeyQuery = req.query.api_key;
  
  let providedKey = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.split(' ')[1];
  } else if (apiKeyQuery) {
    providedKey = apiKeyQuery;
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: 'Acceso no autorizado al servidor MCP de PMO Control Tower. API Key no válida o ausente.' });
  }

  next();
}

function registerMcpHttpRoutes(app) {
  // 1. Endpoint SSE para abrir la conexión MCP persistente
  app.get('/mcp/sse', verifyMcpApiKey, async (req, res) => {
    const server = createMcpServer();
    const transport = new SSEServerTransport('/mcp/messages', res);
    
    activeTransports.set(transport.sessionId, { server, transport });
    
    req.on('close', () => {
      activeTransports.delete(transport.sessionId);
    });

    await server.connect(transport);
  });

  // 2. Endpoint POST para enviar mensajes/consultas RPC a la sesión SSE
  app.post('/mcp/messages', verifyMcpApiKey, async (req, res) => {
    const sessionId = req.query.sessionId;
    const session = activeTransports.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sesión MCP no encontrada o expirada' });
    }

    await session.transport.handlePostMessage(req, res);
  });
}

module.exports = { registerMcpHttpRoutes, verifyMcpApiKey };
