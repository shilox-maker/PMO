const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { restoreData, BACKUP_DIR } = require('./backup');

/**
 * Script interactivo de menú CLI para listar y restaurar backups de base de datos.
 */
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function runInteractiveRestore() {
  console.log('\n==================================================');
  console.log('  📦 MENÚ INTERACTIVO DE RESTAURACIÓN DE BASE DE DATOS');
  console.log('==================================================');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('\n  ❌ El directorio de backups no existe:', BACKUP_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('\n  ⚠️ No se encontraron ficheros de backup en el directorio.');
    process.exit(0);
  }

  console.log('\nBackups disponibles:\n');
  files.forEach((file, index) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    const mtime = stats.mtime.toLocaleString('es-ES');
    console.log(`  [${index + 1}] ${file} (${sizeKB} KB) - ${mtime}`);
  });

  const rl = createRL();

  const answer = await new Promise(resolve => {
    rl.question('\nSelecciona el número del backup que deseas restaurar (o "q" para cancelar): ', resolve);
  });

  const cleanAns = answer.trim().toLowerCase();
  if (cleanAns === 'q' || cleanAns === 'cancelar' || cleanAns === '') {
    console.log('  Operación cancelada.');
    rl.close();
    process.exit(0);
  }

  const choiceNum = parseInt(cleanAns, 10);
  if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > files.length) {
    console.log(`  ❌ Opción inválida: "${answer}". Debe ser un número entre 1 y ${files.length}.`);
    rl.close();
    process.exit(1);
  }

  const selectedFile = files[choiceNum - 1];
  console.log(`\n  Has seleccionado: ${selectedFile}`);

  const confirm = await new Promise(resolve => {
    rl.question('  ⚠️ ADVERTENCIA: Se reemplazarán los datos actuales. ¿Estás seguro? (s/N): ', resolve);
  });

  rl.close();

  const confirmAns = confirm.trim().toLowerCase();
  if (confirmAns !== 's' && confirmAns !== 'si' && confirmAns !== 'sí' && confirmAns !== 'y' && confirmAns !== 'yes') {
    console.log('  Restauración cancelada por el usuario.');
    process.exit(0);
  }

  console.log('\n  Iniciando proceso de restauración...\n');
  try {
    await restoreData(selectedFile);
    console.log(`\n  ✅ ¡Base de datos restaurada exitosamente a la versión: ${selectedFile}!`);
  } catch (err) {
    console.error('\n  ❌ Error crítico al restaurar la base de datos:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runInteractiveRestore();
}

module.exports = { runInteractiveRestore };
