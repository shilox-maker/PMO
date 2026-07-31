const fs = require('fs');
const path = require('path');

const MAX_BACKUPS = 30;

/**
 * Realiza una copia fisica directa del fichero .db de SQLite si existe.
 */
function copySqliteDb(backupDir, timestamp, storagePath) {
  const dbPath = storagePath || path.join(__dirname, '../ppm_governance.db');
  if (fs.existsSync(dbPath)) {
    const dbFilename = `ppm_governance_${timestamp}.db`;
    const destPath = path.join(backupDir, dbFilename);
    fs.copyFileSync(dbPath, destPath);
    console.log(`  Copia fisica SQLite guardada: ${destPath}`);
    return destPath;
  }
  return null;
}

/**
 * Mantiene un maximo de 'maxKeep' backups (por defecto 30).
 * Elimina los ficheros mas antiguos (JSON y DB correspondiente).
 */
function rotateBackups(backupDir, maxKeep = MAX_BACKUPS) {
  if (!fs.existsSync(backupDir)) return;

  const jsonFiles = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  if (jsonFiles.length > maxKeep) {
    const toDelete = jsonFiles.slice(maxKeep);
    toDelete.forEach(file => {
      const filePath = path.join(backupDir, file.name);
      fs.unlinkSync(filePath);
      console.log(`  Rotacion (max ${maxKeep}): eliminado backup JSON antiguo ${file.name}`);

      // Eliminar copia fisica .db asociada si existe
      const timestampMatch = file.name.match(/backup_.*_(.+)\.json$/);
      if (timestampMatch) {
        const dbFile = path.join(backupDir, `ppm_governance_${timestampMatch[1]}.db`);
        if (fs.existsSync(dbFile)) {
          fs.unlinkSync(dbFile);
          console.log(`  Rotacion (max ${maxKeep}): eliminada copia fisica ${path.basename(dbFile)}`);
        }
      }
    });
  }
}

module.exports = {
  copySqliteDb,
  rotateBackups,
  MAX_BACKUPS
};
