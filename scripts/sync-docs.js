const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDoc = path.join(rootDir, 'docs', 'manual_formacion_usuarios.md');
const sourceImages = path.join(rootDir, 'docs', 'images');

const targetDir = path.join(rootDir, 'frontend', 'public', 'docs');
const targetDoc = path.join(targetDir, 'manual_formacion_usuarios.md');
const targetImages = path.join(targetDir, 'images');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(targetImages)) {
  fs.mkdirSync(targetImages, { recursive: true });
}

// Copy markdown
if (fs.existsSync(sourceDoc)) {
  fs.copyFileSync(sourceDoc, targetDoc);
  console.log(`[sync-docs] Copied ${sourceDoc} -> ${targetDoc}`);
}

// Copy images
if (fs.existsSync(sourceImages)) {
  const images = fs.readdirSync(sourceImages);
  for (const img of images) {
    const src = path.join(sourceImages, img);
    const dst = path.join(targetImages, img);
    fs.copyFileSync(src, dst);
  }
  console.log(`[sync-docs] Synchronized ${images.length} images.`);
}
