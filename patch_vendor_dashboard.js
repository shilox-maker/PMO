const fs = require('fs');

// --- 1. Update VendorDirectory.jsx ---
const vdPath = 'frontend/src/pages/VendorDirectory.jsx';
let vdContent = fs.readFileSync(vdPath, 'utf8');

// Add es_grupo_dacsa to state
vdContent = vdContent.replace(
  `nombre_razon_social: '',`,
  `nombre_razon_social: '', es_grupo_dacsa: false,`
);
vdContent = vdContent.replace(
  `nombre_razon_social: vendor.nombre_razon_social,`,
  `nombre_razon_social: vendor.nombre_razon_social, es_grupo_dacsa: vendor.es_grupo_dacsa || false,`
);

// Add checkbox in Create Modal
const checkboxHtml = `
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
              <input 
                type="checkbox" 
                checked={vendorForm.es_grupo_dacsa} 
                onChange={(e) => setVendorForm({ ...vendorForm, es_grupo_dacsa: e.target.checked })} 
                className="m3-checkbox"
              />
              <span style={{ fontSize: '0.85rem' }}>Pertenece al Grupo Dacsa</span>
            </label>
`;
vdContent = vdContent.replace(
  `placeholder="Ej: Microsoft, SAP, Oracle"`,
  `placeholder="Ej: Microsoft, SAP, Oracle"\n            />` + checkboxHtml + `\n            {/* `
); // Note: replace might be tricky if placeholder is used multiple times. Let's just use regex.

vdContent = vdContent.replace(
  /placeholder="Ej: Microsoft, SAP, Oracle"\s*\/>/g,
  `placeholder="Ej: Microsoft, SAP, Oracle"\n            />\n` + checkboxHtml
);

// Add chip in table
vdContent = vdContent.replace(
  `{vendor.nombre_razon_social}`,
  `{vendor.nombre_razon_social}\n                      {vendor.es_grupo_dacsa && <span style={{ marginLeft: 8, fontSize: '0.65rem', backgroundColor: 'var(--md-sys-color-primary)', color: '#fff', padding: '2px 6px', borderRadius: 100 }}>Dacsa</span>}`
);

fs.writeFileSync(vdPath, vdContent);

// --- 2. Update GovernanceDashboard.jsx ---
const dashPath = 'frontend/src/pages/GovernanceDashboard.jsx';
let dashContent = fs.readFileSync(dashPath, 'utf8');

// Horizontal alignment of top cards
dashContent = dashContent.replace(
  /gridTemplateColumns: 'repeat\(auto-fit, minmax\(250px, 1fr\)\)'/g,
  `gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'`
);

// Add Último Comentario column to table
// 1. Column Header
dashContent = dashContent.replace(
  `<th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>Acciones</th>`,
  `<th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', minWidth: 200 }}>Último Comentario</th>\n                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>Acciones</th>`
);

// 2. Column Data
const commentCell = `
                <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>
                  <div style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.ultimo_comentario}>
                    {p.ultimo_comentario || <span style={{ opacity: 0.5 }}>Sin comentarios</span>}
                  </div>
                </td>
`;
dashContent = dashContent.replace(
  `{/* Actions */}`,
  commentCell + `\n                {/* Actions */}`
);

fs.writeFileSync(dashPath, dashContent);
console.log('Vendor and Dashboard patched!');
