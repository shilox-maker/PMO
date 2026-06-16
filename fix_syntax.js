const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/ProjectDetail.jsx', 'utf8');
content = content.replace(
  "      `).join('');",
  "      `).join('')) : '';"
);
fs.writeFileSync('frontend/src/pages/ProjectDetail.jsx', content);
