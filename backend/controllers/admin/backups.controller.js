const path = require('path');
const fs = require('fs');
const { exportData, restoreData, BACKUP_DIR } = require('../../utils/backup');
const { listBlobs, downloadFromBlob } = require('../../utils/azureBlob');

/**
 * Genera un backup nuevo (exporta a JSON, copia DB local y sube a Azure Blob Storage si aplica)
 */
async function generateBackup(req, res, next) {
  try {
    const filePath = await exportData();
    const filename = path.basename(filePath);
    res.json({
      success: true,
      message: 'Backup generado correctamente',
      filename,
      filePath
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtiene la lista de backups locales y en Azure Blob Storage
 */
async function getBackupsList(req, res, next) {
  try {
    const localFiles = fs.existsSync(BACKUP_DIR)
      ? fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json') || f.endsWith('.db'))
      : [];

    const localList = localFiles.map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        filename: f,
        sizeKB: (stats.size / 1024).toFixed(1),
        updatedAt: stats.mtime,
        source: 'local'
      };
    });

    const azureBlobs = await listBlobs();
    const azureList = azureBlobs.map(b => ({
      filename: b.name,
      sizeKB: (b.contentLength / 1024).toFixed(1),
      updatedAt: b.createdOn,
      source: 'azure'
    }));

    // Combinar y deduplicar por filename (priorizar Azure Blob)
    const map = new Map();
    [...azureList, ...localList].forEach(item => {
      if (!map.has(item.filename)) {
        map.set(item.filename, item);
      }
    });

    const items = Array.from(map.values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

/**
 * Descarga un archivo de backup JSON especifico
 */
async function downloadBackup(req, res, next) {
  try {
    const { filename } = req.params;
    // Sanitizar filename
    const safeFilename = path.basename(filename);
    let filePath = path.join(BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      // Intentar descargar desde Azure Blob Storage si no está en disco local
      const downloaded = await downloadFromBlob(safeFilename, filePath);
      if (!downloaded || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fichero de backup no encontrado' });
      }
    }

    res.download(filePath, safeFilename);
  } catch (err) {
    next(err);
  }
}

/**
 * Restaura la base de datos a partir de un fichero existente (por nombre)
 */
async function restoreExistingBackup(req, res, next) {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ message: 'Nombre de fichero no especificado' });
    }

    const safeFilename = path.basename(filename);
    let filePath = path.join(BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      const downloaded = await downloadFromBlob(safeFilename, filePath);
      if (!downloaded || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fichero de backup no encontrado' });
      }
    }

    await restoreData(filePath);
    res.json({ success: true, message: 'Base de datos restaurada correctamente' });
  } catch (err) {
    next(err);
  }
}

/**
 * Restaura la base de datos desde un objeto JSON subido por el cliente
 */
async function restoreUploadedBackup(req, res, next) {
  try {
    const backupJson = req.body;
    if (!backupJson || !backupJson.tables) {
      return res.status(400).json({ message: 'Estructura JSON de backup invalida' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const tempFilename = `backup_uploaded_${timestamp}.json`;
    const tempPath = path.join(BACKUP_DIR, tempFilename);

    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.writeFileSync(tempPath, JSON.stringify(backupJson, null, 2), 'utf-8');

    await restoreData(tempPath);
    res.json({ success: true, message: 'Backup restaurado correctamente desde archivo subido' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateBackup,
  getBackupsList,
  downloadBackup,
  restoreExistingBackup,
  restoreUploadedBackup
};
