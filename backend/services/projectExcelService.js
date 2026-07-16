const ExcelJS = require('exceljs');

async function generateProjectsExcel(rowsData, exportCols) {
  const workbook = new ExcelJS.Workbook();

  // 1. Hoja de Resumen de Cartera
  const summarySheet = workbook.addWorksheet('Resumen de Cartera');
  summarySheet.views = [{ showGridLines: true }];
  
  // Título Principal
  summarySheet.mergeCells('B2:G2');
  const titleCell = summarySheet.getCell('B2');
  titleCell.value = 'CUADRO DE MANDO Y RESUMEN DE CARTERA';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(2).height = 40;

  // KPIs
  const totalProjects = rowsData.length;
  const ragRed = rowsData.filter(p => p.indicador_rag === 'ROJO').length;
  const ragYellow = rowsData.filter(p => p.indicador_rag === 'AMARILLO').length;
  const ragGreen = rowsData.filter(p => p.indicador_rag === 'VERDE').length;

  summarySheet.getCell('B4').value = 'Total Proyectos';
  summarySheet.getCell('B5').value = totalProjects;
  summarySheet.getCell('C4').value = 'RAG Rojo';
  summarySheet.getCell('C5').value = ragRed;
  summarySheet.getCell('D4').value = 'RAG Amarillo';
  summarySheet.getCell('D5').value = ragYellow;
  summarySheet.getCell('E4').value = 'RAG Verde';
  summarySheet.getCell('E5').value = ragGreen;

  // Estilo de KPIs
  ['B', 'C', 'D', 'E'].forEach(col => {
    summarySheet.getCell(`${col}4`).font = { name: 'Arial', size: 9, bold: true, color: { argb: '555555' } };
    summarySheet.getCell(`${col}4`).alignment = { horizontal: 'center' };
    summarySheet.getCell(`${col}5`).font = { name: 'Arial', size: 18, bold: true };
    summarySheet.getCell(`${col}5`).alignment = { horizontal: 'center' };
    summarySheet.getCell(`${col}5`).border = {
      outline: true,
      top: { style: 'thin', color: { argb: 'CCCCCC' } },
      left: { style: 'thin', color: { argb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
      right: { style: 'thin', color: { argb: 'CCCCCC' } }
    };
  });
  
  // Rellenar colores de fondo de RAG
  summarySheet.getCell('C5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEA' } }; // Rojo
  summarySheet.getCell('C5').font = { name: 'Arial', size: 18, bold: true, color: { argb: '900000' } };
  summarySheet.getCell('D5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEB' } }; // Amarillo
  summarySheet.getCell('D5').font = { name: 'Arial', size: 18, bold: true, color: { argb: '8A6D00' } };
  summarySheet.getCell('E5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EAF8EA' } }; // Verde
  summarySheet.getCell('E5').font = { name: 'Arial', size: 18, bold: true, color: { argb: '006000' } };

  // Alertas / Proyectos a Revisar
  summarySheet.mergeCells('B7:G7');
  const alertTitleCell = summarySheet.getCell('B7');
  alertTitleCell.value = 'ALERTAS CRÍTICAS / PROYECTOS A REVISAR';
  alertTitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: '1A1A2E' } };
  alertTitleCell.border = { bottom: { style: 'medium', color: { argb: '1A1A2E' } } };

  // Encabezados de tabla de alertas
  const alertHeaders = ['Código', 'Nombre del Proyecto', 'RAG', 'Alerta Detectada', 'Socio Tecnológico', 'Gestor PM'];
  alertHeaders.forEach((h, idx) => {
    const colName = String.fromCharCode(66 + idx); // B, C, D, E, F, G
    const cell = summarySheet.getCell(`${colName}8`);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '33334D' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });

  // Filtrar proyectos con alertas
  const alertedProjects = rowsData.filter(p => {
    return p.indicador_rag === 'ROJO' || p.overdueCount > 0 || p.presupuesto_disponible < 0;
  });

  let currentRow = 9;
  if (alertedProjects.length === 0) {
    summarySheet.mergeCells(`B${currentRow}:G${currentRow}`);
    summarySheet.getCell(`B${currentRow}`).value = 'No se registran alertas de revisión prioritaria en la cartera.';
    summarySheet.getCell(`B${currentRow}`).font = { name: 'Arial', size: 10, italic: true };
    summarySheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };
  } else {
    alertedProjects.forEach(p => {
      const alertReasons = [];
      if (p.indicador_rag === 'ROJO') alertReasons.push('RAG Crítico (Rojo)');
      if (p.overdueCount > 0) alertReasons.push(`${p.overdueCount} Hito(s) Vencido(s)`);
      if (p.presupuesto_disponible < 0) {
        const diff = Math.abs(p.presupuesto_disponible).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        alertReasons.push(`Presupuesto Excedido en ${diff} €`);
      }

      summarySheet.getCell(`B${currentRow}`).value = p.id_proyecto;
      summarySheet.getCell(`C${currentRow}`).value = p.nombre_proyecto;
      summarySheet.getCell(`D${currentRow}`).value = p.indicador_rag;
      summarySheet.getCell(`E${currentRow}`).value = alertReasons.join(' | ');
      summarySheet.getCell(`F${currentRow}`).value = p.proveedor;
      summarySheet.getCell(`G${currentRow}`).value = p.pm;

      // Estilo de RAG en la tabla
      const ragCell = summarySheet.getCell(`D${currentRow}`);
      if (p.indicador_rag === 'ROJO') {
        ragCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEA' } };
        ragCell.font = { color: { argb: '900000' }, bold: true };
      } else if (p.indicador_rag === 'AMARILLO') {
        ragCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDEB' } };
        ragCell.font = { color: { argb: '8A6D00' }, bold: true };
      } else if (p.indicador_rag === 'VERDE') {
        ragCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EAF8EA' } };
        ragCell.font = { color: { argb: '006000' }, bold: true };
      }

      // Estilo de alerta detectada
      const reasonCell = summarySheet.getCell(`E${currentRow}`);
      if (p.presupuesto_disponible < 0 || p.overdueCount > 0) {
        reasonCell.font = { color: { argb: 'C00000' }, bold: true };
      }

      // Aplicar bordes delgados a las filas de la tabla
      ['B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
        summarySheet.getCell(`${col}${currentRow}`).border = {
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } }
        };
      });

      currentRow++;
    });
  }

  // Ancho de columnas en resumen
  summarySheet.getColumn('A').width = 4;
  summarySheet.getColumn('B').width = 15;
  summarySheet.getColumn('C').width = 30;
  summarySheet.getColumn('D').width = 12;
  summarySheet.getColumn('E').width = 35;
  summarySheet.getColumn('F').width = 25;
  summarySheet.getColumn('G').width = 20;

  // 2. Hoja de Detalle de Proyectos
  const detailSheet = workbook.addWorksheet('Detalle de Proyectos');
  detailSheet.columns = exportCols;

  const headerRow = detailSheet.getRow(1);
  headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  const hasCol = (key) => exportCols.some(c => c.key === key);

  for (const data of rowsData) {
    const row = detailSheet.addRow(data);
    if (hasCol('budget_inicial')) row.getCell('budget_inicial').numFmt = '#,##0.00" €"';
    if (hasCol('budget_actualizado')) row.getCell('budget_actualizado').numFmt = '#,##0.00" €"';
    if (hasCol('consumo_real')) row.getCell('consumo_real').numFmt = '#,##0.00" €"';
    if (hasCol('presupuesto_disponible')) row.getCell('presupuesto_disponible').numFmt = '#,##0.00" €"';
  }

  return workbook;
}

module.exports = {
  generateProjectsExcel
};
