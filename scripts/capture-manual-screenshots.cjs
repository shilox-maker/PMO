const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', '@playwright/test'));

async function main() {
  const outputDir = path.resolve(__dirname, '..', 'docs', 'images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 920 },
    deviceScaleFactor: 2.0, // Crisp Retina quality
    locale: 'es-ES'
  });
  const page = await context.newPage();

  console.log('1. Capturing Login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, '01_login_screen.png') });

  // Log in as Admin
  await page.fill('input[type="email"]', 'admin@dacsa.com');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1200);

  // 2. Ambito Selector
  console.log('2. Capturing Ambito Selector...');
  const ambitoCard = await page.$('.ambito-card, button:has-text("Todos"), button:has-text("IT Corporate")');
  if (ambitoCard) {
    await page.screenshot({ path: path.join(outputDir, '02_ambito_selector.png') });
    await ambitoCard.click();
    await page.waitForTimeout(1000);
  }

  // 3. Projects Page
  console.log('3. Capturing Projects Page...');
  await page.goto('http://localhost:5173/proyectos');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '03_projects_page.png') });

  // 4. Create Project Modal
  console.log('4. Capturing Create Project Modal...');
  const newProjBtn = await page.$('button:has-text("Nuevo Proyecto"), button:has-text("+ Nuevo")');
  if (newProjBtn) {
    await newProjBtn.click();
    await page.waitForTimeout(800);
    // Fill sample values
    const nameInput = await page.$('input[name="nombre_proyecto"]');
    if (nameInput) await nameInput.fill('Transformación Digital SAP S/4HANA & MES');
    const descInput = await page.$('textarea[name="descripcion"]');
    if (descInput) await descInput.fill('Implantación integral del nuevo ERP y sistema MES en plantas productivas para optimización de costes y trazabilidad.');
    const capexCheckbox = await page.$('input[name="es_capex"]');
    if (capexCheckbox && !(await capexCheckbox.isChecked())) {
      await capexCheckbox.check();
      await page.waitForTimeout(300);
    }
    const cpxCode = await page.$('input[name="codigo_capex"]');
    if (cpxCode) await cpxCode.fill('CPX-2026-089');
    const budgetInput = await page.$('input[name="budget_inicial"]');
    if (budgetInput) await budgetInput.fill('250000');
    const budgetNotes = await page.$('input[name="budget_notas"]');
    if (budgetNotes) await budgetNotes.fill('Incluye licencias ERP fase 1 + consultoría de implantación');
    const stratCheckbox = await page.$('input[name="es_estrategico"]');
    if (stratCheckbox && !(await stratCheckbox.isChecked())) {
      await stratCheckbox.check();
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outputDir, '04_create_project_modal.png') });

    // Close modal
    const closeBtn = await page.$('.modal-content .icon-btn, button:has-text("Cancelar")');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // 5. Open Project Detail (Ficha 360)
  console.log('5. Navigating to Project Detail...');
  const firstRowFicha = await page.$('tr td button:has-text("Ficha"), button:has-text("Ficha")');
  if (firstRowFicha) {
    await firstRowFicha.click();
    await page.waitForTimeout(1500);

    // 6. Ficha 360 view
    console.log('6. Capturing Ficha 360...');
    await page.screenshot({ path: path.join(outputDir, '06_project_detail_ficha.png') });

    // 5b. Open Edit Project Modal
    console.log('5b. Capturing Edit Project Modal...');
    const editBtn = await page.$('button:has-text("Editar Ficha"), button:has-text("Editar")');
    if (editBtn) {
      await editBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outputDir, '05_project_edit_modal.png') });
      const closeEdit = await page.$('.modal-content .icon-btn, button:has-text("Cancelar")');
      if (closeEdit) await closeEdit.click();
      await page.waitForTimeout(500);
    }

    // 7. Alcance & Cambios Tab
    console.log('7. Capturing Alcance & Cambios...');
    const alcanceTab = await page.$('button:has-text("Alcance")');
    if (alcanceTab) {
      await alcanceTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outputDir, '07_project_detail_alcance_cr.png') });
    }

    // 8. Finanzas Tab (Facturas)
    console.log('8. Capturing Finanzas / Facturas...');
    const finanzasTab = await page.$('button:has-text("Facturas"), button:has-text("Finanzas")');
    if (finanzasTab) {
      await finanzasTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outputDir, '08_project_detail_finanzas.png') });
    }

    // 9. Checklist / Tareas Tab
    console.log('9. Capturing Checklist / Tareas...');
    const tareasTab = await page.$('button:has-text("Tareas"), button:has-text("Checklist")');
    if (tareasTab) {
      await tareasTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outputDir, '09_project_detail_checklist_tareas.png') });
    }

    // 10. Riesgos e Incidencias Tab
    console.log('10. Capturing Riesgos & Incidencias...');
    const riesgosTab = await page.$('button:has-text("Riesgos"), button:has-text("Riesgos e incidencias")');
    if (riesgosTab) {
      await riesgosTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outputDir, '10_project_detail_riesgos_incidencias.png') });
    }

    // 11. Dropdown "Más ▾" -> Comunicaciones
    console.log('11. Capturing Comunicaciones...');
    const moreBtn = await page.$('button:has-text("Más")');
    if (moreBtn) {
      await moreBtn.click();
      await page.waitForTimeout(300);
      const comsItem = await page.$('button:has-text("Comunicación")');
      if (comsItem) {
        await comsItem.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(outputDir, '11_project_detail_comunicaciones.png') });
      }

      // 12. Dropdown "Más ▾" -> Lecciones
      console.log('12. Capturing Lecciones...');
      const moreBtn2 = await page.$('button:has-text("Más")');
      if (moreBtn2) {
        await moreBtn2.click();
        await page.waitForTimeout(300);
        const leccionesItem = await page.$('button:has-text("Lecciones aprendidas")');
        if (leccionesItem) {
          await leccionesItem.click();
          await page.waitForTimeout(800);
          await page.screenshot({ path: path.join(outputDir, '12_project_detail_lecciones.png') });
        }
      }
    }
  }

  // 13. Dashboard Operativo
  console.log('13. Capturing Dashboard Proyectos...');
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '13_dashboard_proyectos.png') });

  // 14. Dashboard Portfolio
  console.log('14. Capturing Dashboard Portfolio...');
  await page.goto('http://localhost:5173/dashboard-portfolio');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '14_dashboard_portfolio.png') });

  // 15. PIPs Report
  console.log('15. Capturing PIPs Report...');
  await page.goto('http://localhost:5173/portfolios/report');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '15_pips_page.png') });

  // 16. Timeline
  console.log('16. Capturing Timeline / Gantt...');
  await page.goto('http://localhost:5173/timeline');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '16_timeline_page.png') });

  // 17. Proveedores
  console.log('17. Capturing Proveedores...');
  await page.goto('http://localhost:5173/proveedores');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '17_proveedores_page.png') });

  // 18. Lecciones Aprendidas General
  console.log('18. Capturing Lecciones Generales...');
  await page.goto('http://localhost:5173/lecciones');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '18_lecciones_page.png') });

  // 19. Admin Panel
  console.log('19. Capturing Admin Panel...');
  await page.goto('http://localhost:5173/admin');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, '19_admin_page.png') });

  // 20. Manual Modal
  console.log('20. Capturing Manual Modal...');
  await page.goto('http://localhost:5173/proyectos');
  await page.waitForTimeout(1000);
  const helpBtn = await page.$('button[title*="Manual"], button[aria-label*="Manual"], button:has-text("Manual"), button:has-text("Ayuda"), .manual-trigger-btn');
  if (helpBtn) {
    await helpBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, '20_modal_manual_usuario.png') });
  }

  await browser.close();

  // Sync to frontend/public/docs
  console.log('Syncing docs to frontend/public/docs...');
  const syncScript = path.resolve(__dirname, 'sync-docs.js');
  if (fs.existsSync(syncScript)) {
    require(syncScript);
  }

  console.log('All screenshots captured and synchronized successfully!');
}

main().catch(console.error);
