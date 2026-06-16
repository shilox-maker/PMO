const fs = require('fs');

// 1. Update automations.js
const automationsPath = 'backend/models/automations.js';
let autoContent = fs.readFileSync(automationsPath, 'utf8');
autoContent = autoContent.replace(
  `let consumo_real = 0;\n  invoices.forEach(fac => {\n    consumo_real += parseFloat(fac.importe || 0);\n  });`,
  `let consumo_real = 0;\n  let total_facturado = 0;\n  let total_pendiente = 0;\n  invoices.forEach(fac => {\n    const amount = parseFloat(fac.importe || 0);\n    consumo_real += amount;\n    if (fac.estado === 'PAGADA') total_facturado += amount;\n    if (fac.estado === 'PENDIENTE_DE_RECIBIR') total_pendiente += amount;\n  });`
);
autoContent = autoContent.replace(
  `consumo_real: Number(consumo_real.toFixed(2)),`,
  `consumo_real: Number(consumo_real.toFixed(2)),\n    total_facturado: Number(total_facturado.toFixed(2)),\n    total_pendiente: Number(total_pendiente.toFixed(2)),`
);
fs.writeFileSync(automationsPath, autoContent);

// 2. Update server.js Export logic (optional but good practice to maintain consistency)
// Not strictly required for the acceptance criteria, but good to know.

// 3. Update ProjectDetail.jsx
const pdPath = 'frontend/src/pages/ProjectDetail.jsx';
let pdContent = fs.readFileSync(pdPath, 'utf8');

// Center avatars
pdContent = pdContent.replace(
  /justify: 'center'/g,
  `justifyContent: 'center'`
);

// Update Finanzas section
pdContent = pdContent.replace(
  `<div style={{ display: 'flex', justify: 'space-between', fontSize: '0.9rem', color: 'var(--priority-alta)' }}>
                  <span>Consumo Real Total:</span>
                  <span style={{ fontWeight: 600 }}>{calc?.consumo_real.toLocaleString('es-ES')} €</span>
                </div>`,
  `<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--priority-alta)' }}>
                  <span>Total Facturado:</span>
                  <span style={{ fontWeight: 600 }}>{calc?.total_facturado?.toLocaleString('es-ES') || 0} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--priority-alta)', marginTop: 4 }}>
                  <span>Total Facturado + Pendiente:</span>
                  <span style={{ fontWeight: 600 }}>{calc?.consumo_real?.toLocaleString('es-ES') || 0} €</span>
                </div>`
);
pdContent = pdContent.replace(/justify: 'space-between'/g, `justifyContent: 'space-between'`);

// 4. Update ProjectDetail Timeline section
// Add Timeline to Ficha
const timelineImport = `import SearchableKeyUserSelect from '../components/SearchableKeyUserSelect';\nimport Timeline from './Timeline';`;
if (!pdContent.includes("import Timeline from './Timeline';")) {
  pdContent = pdContent.replace(`import SearchableKeyUserSelect from '../components/SearchableKeyUserSelect';`, timelineImport);
}

const timelineComponent = `
            {/* TIMELINE MINIATURE */}
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 12 }}>Cronología (Timeline)</h3>
              <div style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12, overflow: 'hidden', height: 400 }}>
                <Timeline projectId={projectId} hideHeader={true} />
              </div>
            </div>
`;
// Insert timeline below Project Description in activeTab === 'ficha'
pdContent = pdContent.replace(
  `{/* PROVEEDOR E INFO BASE */}`,
  timelineComponent + `\n            {/* PROVEEDOR E INFO BASE */}`
);

fs.writeFileSync(pdPath, pdContent);
console.log('ProjectDetail patched!');
