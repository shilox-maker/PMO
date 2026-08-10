const { sequelize } = require('../config/db.config');
const fs = require('fs');
const path = require('path');
const { copySqliteDb, rotateBackups } = require('./backup-helpers');
const { uploadToBlob } = require('./azureBlob');

const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Obtiene todos los nombres de tabla del esquema actual.
 */
async function getTableNames() {
  const dialect = process.env.DB_DIALECT || 'sqlite';
  const schema = process.env.DB_SCHEMA || 'dbo';

  if (dialect === 'mssql') {
    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = :schema AND TABLE_TYPE = 'BASE TABLE'`,
      { replacements: { schema } }
    );
    return tables.map(t => t.TABLE_NAME);
  }

  // SQLite
  const [tables] = await sequelize.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  return tables.map(t => t.name);
}

/**
 * Exporta todos los datos a un fichero JSON timestamped.
 * Retorna la ruta del fichero generado.
 */
async function exportData() {
  const schema = process.env.DB_SCHEMA || 'dbo';
  const dialect = process.env.DB_DIALECT || 'sqlite';
  const tables = await getTableNames();
  const backup = { timestamp: new Date().toISOString(), schema, tables: {} };

  for (const table of tables) {
    const qualifiedName = dialect === 'mssql' ? `[${schema}].[${table}]` : `"${table}"`;
    const [rows] = await sequelize.query(`SELECT * FROM ${qualifiedName}`);
    backup.tables[table] = rows;
    console.log(`  ${table}: ${rows.length} filas`);
  }

  // Crear directorio de backups
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup_${schema}_${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`\n  Backup guardado: ${filepath}`);

  // Copia fisica directa si la BD es SQLite
  if (dialect === 'sqlite') {
    const dbStorage = sequelize.options?.storage || path.join(__dirname, '../ppm_governance.db');
    const sqliteCopy = copySqliteDb(BACKUP_DIR, timestamp, dbStorage);
    if (sqliteCopy) {
      await uploadToBlob(sqliteCopy, path.basename(sqliteCopy));
    }
  }

  // Subir el archivo JSON a Azure Blob Storage si está configurado
  await uploadToBlob(filepath, filename);

  // Rotacion: mantener un maximo de 30 backups
  rotateBackups(BACKUP_DIR, 30);

  return filepath;
}

/**
 * Restaura datos desde un fichero de backup JSON.
 * CUIDADO: Borra los datos actuales de las tablas antes de restaurar.
 */
async function restoreData(backupFile) {
  const filePath = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(BACKUP_DIR, backupFile);

  if (!fs.existsSync(filePath)) {
    console.error(`  Fichero no encontrado: ${filePath}`);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const dialect = process.env.DB_DIALECT || 'sqlite';
  const schema = process.env.DB_SCHEMA || backup.schema || 'dbo';
  const tableNames = Object.keys(backup.tables);

  console.log(`  Restaurando backup del ${backup.timestamp} (${tableNames.length} tablas)`);

  // Desactivar constraints (FK)
  if (dialect === 'mssql') {
    for (const table of tableNames) {
      await sequelize.query(`ALTER TABLE [${schema}].[${table}] NOCHECK CONSTRAINT ALL`).catch(() => {});
    }
  } else {
    await sequelize.query('PRAGMA foreign_keys = OFF');
  }

  const transaction = await sequelize.transaction();
  try {
    for (const table of tableNames) {
      const qualifiedName = dialect === 'mssql' ? `[${schema}].[${table}]` : `"${table}"`;
      const rows = backup.tables[table];

      // Borrar datos actuales
      await sequelize.query(`DELETE FROM ${qualifiedName}`, { transaction });

      // Insertar filas del backup
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const hasIdCol = dialect === 'mssql' && columns.includes('id');

        if (hasIdCol) {
          await sequelize.query(`SET IDENTITY_INSERT [${schema}].[${table}] ON`, { transaction });
        }

        for (const row of rows) {
          const values = columns.map(c => row[c]);
          const placeholders = columns.map(() => '?').join(', ');
          const colNames = columns.map(c => dialect === 'mssql' ? `[${c}]` : `"${c}"`).join(', ');

          await sequelize.query(
            `INSERT INTO ${qualifiedName} (${colNames}) VALUES (${placeholders})`,
            { replacements: values, transaction }
          );
        }

        if (hasIdCol) {
          await sequelize.query(`SET IDENTITY_INSERT [${schema}].[${table}] OFF`, { transaction });
        }
      }
      console.log(`  ${table}: ${rows.length} filas restauradas`);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  } finally {
    // Reactivar constraints
    if (dialect === 'mssql') {
      for (const table of tableNames) {
        await sequelize.query(`ALTER TABLE [${schema}].[${table}] CHECK CONSTRAINT ALL`).catch(() => {});
      }
    } else {
      await sequelize.query('PRAGMA foreign_keys = ON');
    }
  }

  console.log(`\n  Restauracion completada desde: ${path.basename(filePath)}`);
}

/**
 * Lista los backups disponibles.
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('  No hay backups disponibles.');
    return;
  }
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort().reverse();
  if (files.length === 0) {
    console.log('  No hay backups disponibles.');
    return;
  }
  console.log(`  ${files.length} backups encontrados:\n`);
  files.forEach((f, i) => {
    const stats = fs.statSync(path.join(BACKUP_DIR, f));
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`  ${i + 1}. ${f} (${sizeKB} KB)`);
  });
}

module.exports = { getTableNames, exportData, restoreData, listBackups, BACKUP_DIR };

if (require.main === module) {
  const [,, action, arg] = process.argv;
  if (action === 'export') exportData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
  else if (action === 'restore') {
    if (!arg) { console.error('  Uso: node backup.js restore <fichero.json>'); process.exit(1); }
    restoreData(arg).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
  } else if (action === 'list') listBackups();
  else console.log('Uso: node backup.js [export|list|restore <file>]');
}
