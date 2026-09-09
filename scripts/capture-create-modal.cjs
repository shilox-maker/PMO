const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', '@playwright/test'));

async function captureCreateModal() {
  const outputDir = path.resolve(__dirname, '..', 'docs', 'images');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2.0,
    locale: 'es-ES'
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'admin@dacsa.com');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1200);

  // Ambito selector if present
  const ambitoCard = await page.$('.ambito-card, button:has-text("Todos"), button:has-text("IT Corporate")');
  if (ambitoCard) {
    await ambitoCard.click();
    await page.waitForTimeout(1000);
  }

  await page.goto('http://localhost:5173/proyectos');
  await page.waitForTimeout(1500);

  // Find the primary button with Plus icon
  const newBtn = await page.$('button.m3-btn.m3-btn-primary, button:has(svg.lucide-plus)');
  if (newBtn) {
    console.log('Found create project button, clicking...');
    await newBtn.click();
    await page.waitForTimeout(1000);

    // Fill sample values
    const nameInput = await page.$('input[name="nombre_proyecto"]');
    if (nameInput) await nameInput.fill('Transformación Digital SAP S/4HANA & MES');
    
    const descInput = await page.$('textarea[name="descripcion"]');
    if (descInput) await descInput.fill('Implantación integral del nuevo ERP SAP S/4HANA y sistema MES en plantas productivas para optimización operativa, trazabilidad y control analítico de costes.');

    const capexCheckbox = await page.$('input[name="es_capex"]');
    if (capexCheckbox && !(await capexCheckbox.isChecked())) {
      await capexCheckbox.check();
      await page.waitForTimeout(400);
    }

    const cpxCode = await page.$('input[name="codigo_capex"]');
    if (cpxCode) await cpxCode.fill('CPX-2026-089');

    const budgetInput = await page.$('input[name="budget_inicial"]');
    if (budgetInput) await budgetInput.fill('250000');

    const budgetNotes = await page.$('input[name="budget_notas"]');
    if (budgetNotes) await budgetNotes.fill('Incluye licencias ERP fase 1 + consultoría de implantación externa');

    const stratCheckbox = await page.$('input[name="es_estrategico"]');
    if (stratCheckbox && !(await stratCheckbox.isChecked())) {
      await stratCheckbox.check();
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, '04_create_project_modal.png') });
    console.log('Successfully saved 04_create_project_modal.png');
  } else {
    console.error('Create button not found!');
  }

  await browser.close();
}

captureCreateModal().catch(console.error);
