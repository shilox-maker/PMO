const { getProjectCalculations } = require('./models/automations');
const { Proyectos, sequelize } = require('./models/index');

async function runTest() {
  try {
    console.log('Testing Database Automations...');
    
    // Load PRJ-2026-001 info
    const proj = await Proyectos.findByPk('PRJ-2026-001');
    if (!proj) {
      throw new Error('Project PRJ-2026-001 not found. Did you seed the database?');
    }

    const calc = await getProjectCalculations(proj.id_proyecto, proj.budget_inicial, proj.fecha_fin_inicial);
    console.log('Calculated parameters for PRJ-2026-001:');
    console.log(`- Budget Inicial: ${proj.budget_inicial}`);
    console.log(`- Budget Actualizado (Expected: 280000): ${calc.budget_actualizado}`);
    console.log(`- Consumo Real (Expected: 105000): ${calc.consumo_real}`);
    console.log(`- Presupuesto Disponible (Expected: 175000): ${calc.presupuesto_disponible}`);
    console.log(`- Fecha Fin Inicial: ${proj.fecha_fin_inicial}`);
    console.log(`- Fecha Fin Estimada (Expected: 2026-12-15): ${calc.fecha_fin_estimada}`);

    // Assertions
    if (calc.budget_actualizado !== 280000) throw new Error('Budget Actualizado calculation failed');
    if (calc.consumo_real !== 105000) throw new Error('Consumo Real calculation failed');
    if (calc.presupuesto_disponible !== 175000) throw new Error('Presupuesto Disponible calculation failed');
    if (calc.fecha_fin_estimada !== '2026-12-15') throw new Error('Fecha Fin Estimada calculation failed');

    console.log('✅ ALL TEST ASSERTIONS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await sequelize.close();
  }
}

runTest();
