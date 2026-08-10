const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');

function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) return null;

  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'backups';
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  return blobServiceClient.getContainerClient(containerName);
}

/**
 * Suba un archivo local a Azure Blob Storage (si está configurada la variable de entorno)
 */
async function uploadToBlob(filepath, filename) {
  try {
    const containerClient = getContainerClient();
    if (!containerClient) {
      console.log('  [Azure Storage] AZURE_STORAGE_CONNECTION_STRING no configurada. Omitiendo subida a Blob Storage.');
      return false;
    }

    await containerClient.createIfNotExists();
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    console.log(`  [Azure Storage] Subiendo backup a Blob Storage: ${filename}...`);
    await blockBlobClient.uploadFile(filepath);
    console.log(`  [Azure Storage] ✅ Backup subido correctamente a Blob Storage.`);
    return true;
  } catch (err) {
    console.error(`  [Azure Storage] ❌ Error subiendo backup a Blob Storage:`, err.message);
    return false;
  }
}

/**
 * Lista todos los backups almacenados en Azure Blob Storage
 */
async function listBlobs() {
  try {
    const containerClient = getContainerClient();
    if (!containerClient) return [];

    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push({
        name: blob.name,
        createdOn: blob.properties.createdOn,
        contentLength: blob.properties.contentLength
      });
    }
    return blobs;
  } catch (err) {
    console.error(`  [Azure Storage] ❌ Error listando blobs:`, err.message);
    return [];
  }
}

/**
 * Descarga un blob desde Azure Storage a una ruta local
 */
async function downloadFromBlob(filename, targetPath) {
  try {
    const containerClient = getContainerClient();
    if (!containerClient) return false;

    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    await blockBlobClient.downloadToFile(targetPath);
    console.log(`  [Azure Storage] ✅ Backup descargado desde Blob Storage: ${targetPath}`);
    return true;
  } catch (err) {
    console.error(`  [Azure Storage] ❌ Error descargando blob ${filename}:`, err.message);
    return false;
  }
}

module.exports = {
  uploadToBlob,
  listBlobs,
  downloadFromBlob
};
