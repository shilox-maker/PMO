const fs = require('fs');
let lines = fs.readFileSync('frontend/src/pages/ProjectDetail.jsx', 'utf8').split('\n');
lines[288] = "      `).join('');";
lines[304] = "      `).join('')) : '';";
fs.writeFileSync('frontend/src/pages/ProjectDetail.jsx', lines.join('\n'));
