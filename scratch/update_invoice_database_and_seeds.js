const fs = require('fs');
const path = require('path');

// 1. Update seed.js
const seedPath = path.join(__dirname, '../backend/seed.js');
if (fs.existsSync(seedPath)) {
  let content = fs.readFileSync(seedPath, 'utf8');
  content = content.replace(/estado:\s*'PAGADA'/g, "estado: 'RECIBIDA'");
  fs.writeFileSync(seedPath, content, 'utf8');
  console.log('Updated seed.js');
} else {
  console.log('seed.js not found');
}

// 2. Update database
const { sequelize } = require('../backend/models/index');
async function runUpdate() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    const [results, metadata] = await sequelize.query(
      "UPDATE Facturas SET estado = 'RECIBIDA' WHERE estado = 'PAGADA';"
    );
    console.log('Database updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating database:', err);
    process.exit(1);
  }
}
runUpdate();
