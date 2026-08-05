const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const { listProjectsTool, getProjectDetailTool } = require('./tools/projects');
const { getLessonsLearnedTool } = require('./tools/lessons');
const { searchPmoTool } = require('./tools/search');

const tools = [
  listProjectsTool,
  getProjectDetailTool,
  getLessonsLearnedTool,
  searchPmoTool
];

function createMcpServer() {
  const server = new Server(
    {
      name: 'pmo-control-tower-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const toolArgs = request.params.arguments;
    const tool = tools.find(t => t.name === toolName);

    if (!tool) {
      throw new Error(`Herramienta no encontrada: ${toolName}`);
    }

    try {
      return await tool.handler(toolArgs);
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error al ejecutar ${toolName}: ${error.message}` }],
        isError: true
      };
    }
  });

  return server;
}

module.exports = { createMcpServer, tools };
