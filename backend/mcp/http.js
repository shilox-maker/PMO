const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { createMcpServer } = require('./serverFactory');

const activeTransports = new Map();

function getMcpScopedKeys() {
  const scopedKeysEnv = process.env.MCP_SCOPED_KEYS;
  if (!scopedKeysEnv) return {};
  try {
    return JSON.parse(scopedKeysEnv);
  } catch (e) {
    const map = {};
    scopedKeysEnv.split(',').forEach(pair => {
      const [k, v] = pair.split(':').map(s => s.trim());
      if (k && v) map[k] = Number(v);
    });
    return map;
  }
}

function verifyMcpApiKey(req, res, next) {
  const expectedGlobalKey = process.env.MCP_API_KEY;
  const scopedKeys = getMcpScopedKeys();

  const authHeader = req.headers['authorization'];
  const apiKeyQuery = req.query.api_key;
  
  let providedKey = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.split(' ')[1];
  } else if (apiKeyQuery) {
    providedKey = apiKeyQuery;
  }

  // Bypass key requirement if no keys configured in env (development mode)
  if (!expectedGlobalKey && Object.keys(scopedKeys).length === 0) {
    const explicitAmbitoId = req.headers['x-ambito-id'] || req.query.ambito_id;
    req.mcpScope = explicitAmbitoId 
      ? { isGlobal: false, id_ambito: Number(explicitAmbitoId) }
      : { isGlobal: true, id_ambito: null };
    return next();
  }

  if (!providedKey) {
    return res.status(401).json({ error: 'Acceso no autorizado al servidor MCP de PMO Control Tower. API Key no válida o ausente.' });
  }

  // Global key match
  if (expectedGlobalKey && providedKey === expectedGlobalKey) {
    const explicitAmbitoId = req.headers['x-ambito-id'] || req.query.ambito_id;
    req.mcpScope = explicitAmbitoId 
      ? { isGlobal: false, id_ambito: Number(explicitAmbitoId) }
      : { isGlobal: true, id_ambito: null };
    return next();
  }

  // Scoped key match
  if (scopedKeys[providedKey]) {
    req.mcpScope = {
      isGlobal: false,
      id_ambito: Number(scopedKeys[providedKey])
    };
    return next();
  }

  return res.status(401).json({ error: 'Acceso no autorizado al servidor MCP de PMO Control Tower. API Key no válida o ausente.' });
}

function registerMcpHttpRoutes(app) {
  // 1. Endpoint SSE para abrir la conexión MCP persistente
  app.get('/mcp/sse', verifyMcpApiKey, async (req, res) => {
    const server = createMcpServer(req.mcpScope);
    const transport = new SSEServerTransport('/mcp/messages', res);
    
    activeTransports.set(transport.sessionId, { server, transport, mcpScope: req.mcpScope });
    
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
