const { ProyectoKeyUsers } = require('../backend/models/index');

async function main() {
  console.log("ProyectoKeyUsers rawAttributes:", Object.keys(ProyectoKeyUsers.rawAttributes));
  process.exit(0);
}

main();
