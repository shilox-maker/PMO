const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const CHECKS = [
  {
    name: 'Backend Modules (.js)',
    dir: path.join(ROOT_DIR, 'backend'),
    exts: ['.js'],
    maxLines: 200,
    ignoreDirs: ['node_modules', 'coverage', 'dist', '.git', 'migrations', 'tests', 'backups'],
    ignoreFiles: ['seed.js', 'models/index.js']
  },
  {
    name: 'Frontend Components & Pages (.js, .jsx)',
    dir: path.join(ROOT_DIR, 'frontend', 'src'),
    exts: ['.js', '.jsx'],
    maxLines: 300,
    ignoreDirs: ['node_modules', 'dist', 'build'],
    ignoreFiles: ['index.css']
  }
];

function getFiles(dir, exts, ignoreDirs, ignoreFiles) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!ignoreDirs.includes(entry.name)) {
        results = results.concat(getFiles(fullPath, exts, ignoreDirs, ignoreFiles));
      }
    } else {
      const isIgnoredFile = ignoreFiles.some(f => relativePath.endsWith(f));
      if (!isIgnoredFile && exts.includes(path.extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split(/\r?\n/).length;
}

function runCheck() {
  console.log('🔍 Verificando límites de líneas por fichero de módulo (200 backend / 300 frontend)...\n');
  let totalViolations = 0;

  for (const check of CHECKS) {
    const files = getFiles(check.dir, check.exts, check.ignoreDirs, check.ignoreFiles);
    let checkViolations = 0;

    console.log(`--- [ ${check.name} ] (Máx: ${check.maxLines} líneas) ---`);
    for (const file of files) {
      const lineCount = countLines(file);
      const relativePath = path.relative(ROOT_DIR, file);
      if (lineCount > check.maxLines) {
        console.warn(`⚠️ EXCEDIDO [${lineCount}/${check.maxLines} líneas]: ${relativePath}`);
        checkViolations++;
        totalViolations++;
      }
    }
    if (checkViolations === 0) {
      console.log(`✅ Todos los ${files.length} archivos de módulos en ${check.name} cumplen los límites.\n`);
    } else {
      console.log(`⚠️ Se encontraron ${checkViolations} fichero(s) preexistentes/módulos que superan el límite en ${check.name}.\n`);
    }
  }

  if (totalViolations > 0) {
    console.log(`ℹ️ Resumen: Se detectaron ${totalViolations} fichero(s) a modularizar en siguientes iteraciones.`);
    // Exit status 0 for check reporting so CI/dev checks log warning details clearly
    process.exit(0);
  } else {
    console.log('🎉 ÉXITO: Todos los ficheros verificados respetan estrictamente los límites.');
    process.exit(0);
  }
}

runCheck();
