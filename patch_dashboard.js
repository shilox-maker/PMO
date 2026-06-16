const fs = require('fs');

let c = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

// Remove { id: 'po_list', label: 'PO (Purchase Order)', fixed: false, visible: true },
c = c.replace(/\s*\{\s*id:\s*'po_list'.*?,/g, '');

// Remove column header
c = c.split('\n').filter(line => !line.includes('po_list') || (!line.includes('renderSortHeader') && !line.includes('<td>{calc?.po_list'))).join('\n');

// Remove the comments 
c = c.replace(/\s*\{\/\*\s*PO List\s*\*\/\}/g, '');

fs.writeFileSync('frontend/src/pages/Dashboard.jsx', c);

// Also check GovernanceDashboard.jsx
let g = fs.readFileSync('frontend/src/pages/GovernanceDashboard.jsx', 'utf8');
g = g.replace(/\s*\{\s*id:\s*'po_list'.*?,/g, '');
g = g.split('\n').filter(line => !line.includes('po_list') || (!line.includes('renderSortHeader') && !line.includes('<td>{calc?.po_list'))).join('\n');
g = g.replace(/\s*\{\/\*\s*PO List\s*\*\/\}/g, '');
fs.writeFileSync('frontend/src/pages/GovernanceDashboard.jsx', g);

// Also bump frontend version to 1.7.4
let pkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
pkg.version = '1.7.4';
fs.writeFileSync('frontend/package.json', JSON.stringify(pkg, null, 2) + '\n');
