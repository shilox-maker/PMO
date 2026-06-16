const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'backend', 'server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

// 1. Update sanitizeHTML to allow style
serverContent = serverContent.replace(
  `clean = clean.replace(/<style[^>]*>([\\s\\S]*?)<\\/style>/gi, '');`,
  `// clean = clean.replace(/<style[^>]*>([\\s\\S]*?)<\\/style>/gi, ''); // Permitted style`
);
// Make sure span tags with style are not stripped in sanitizeHTML. Wait, the strip non-whitelisted tags is:
// if (match.match(/^<\\/?(p|strong|em|br|ul|ol|li|span|div|h1|h2|h3|h4|h5|h6|blockquote|table|thead|tbody|tr|th|td)(\\s[^>]*)?>$/i))
// This already allows span and its attributes.

// 2. Dashboard - Add Último Comentario
const dashboardUpdate = `
        const lastComment = await ComentariosProyecto.findOne({
          where: { id_proyecto },
          order: [['fecha_creacion', 'DESC']]
        });
        const ultimo_comentario = lastComment ? lastComment.texto_comentario.replace(/<[^>]+>/g, '').substring(0, 100) + (lastComment.texto_comentario.length > 100 ? '...' : '') : '';

        return {`;

serverContent = serverContent.replace('        return {', dashboardUpdate);
serverContent = serverContent.replace(
  `          ultima_actualizacion: maxUpdated.toISOString()\n        };`,
  `          ultima_actualizacion: maxUpdated.toISOString(),\n          ultimo_comentario\n        };`
);

// 3. Update Project PUT (Audit)
const auditHook = `
    // Auditoría de cambios (Fechas y Presupuesto)
    const autorId = req.currentPmId || 0;
    const autorObj = await Usuarios.findByPk(autorId);
    const nombreAutor = autorObj ? \`\${autorObj.nombre} \${autorObj.apellidos}\` : 'Sistema';

    if (data.fecha_fin_inicial && project.fecha_fin_inicial !== data.fecha_fin_inicial) {
      await ComentariosProyecto.create({
        id_proyecto,
        texto_comentario: \`El usuario <strong>\${nombreAutor}</strong> ha modificado la <strong>Fecha Fin Base</strong> de \${project.fecha_fin_inicial || 'N/A'} a \${data.fecha_fin_inicial}\`,
        id_autor: autorId,
        es_importante: true
      });
    }

    if (data.budget_inicial !== undefined && parseFloat(project.budget_inicial) !== parseFloat(data.budget_inicial)) {
      await ComentariosProyecto.create({
        id_proyecto,
        texto_comentario: \`El usuario <strong>\${nombreAutor}</strong> ha modificado el <strong>Presupuesto Inicial</strong> de \${project.budget_inicial || '0'} a \${data.budget_inicial}\`,
        id_autor: autorId,
        es_importante: true
      });
    }

    await project.update(data);`;

serverContent = serverContent.replace('    await project.update(data);', auditHook);

// 4. Add Sedes CRUD
const sedesCrud = `
// ==========================================
// 3.5 Sedes CRUD
// ==========================================
app.post('/api/sedes', async (req, res) => {
  try {
    const sede = await Sedes.create(req.body);
    res.status(201).json(sede);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.put('/api/sedes/:id', async (req, res) => {
  try {
    const sede = await Sedes.findByPk(req.params.id);
    if (!sede) return res.status(404).json({ error: 'Not found' });
    await sede.update(req.body);
    res.json(sede);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/sedes/:id', async (req, res) => {
  try {
    const sede = await Sedes.findByPk(req.params.id);
    if (!sede) return res.status(404).json({ error: 'Not found' });
    await sede.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
`;
if (!serverContent.includes('/api/sedes/:id')) {
  serverContent = serverContent.replace('app.get(\'/api/sedes\',', sedesCrud + '\napp.get(\'/api/sedes\',');
}

fs.writeFileSync(serverFile, serverContent);
console.log('Server patched!');
