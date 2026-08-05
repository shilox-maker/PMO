const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { sequelize } = require('../config/db.config');
const { createMcpServer } = require('./serverFactory');

async function run() {
  await sequelize.authenticate();
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error('Error arrancando servidor MCP PMO Control Tower (stdio):', err);
  process.exit(1);
});
