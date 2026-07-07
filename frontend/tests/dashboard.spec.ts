import { test, expect } from '@playwright/test';

test.describe('Flujos de Usuario E2E en Dashboard y Detalle de Proyecto', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Interceptar Login
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id_usuario: 1,
            nombre: 'Test',
            apellidos: 'User',
            correo: 'test@dacsa.com',
            perfil: 'ADMINISTRADOR',
            activo: true
          }
        })
      });
    });

    await page.route('**/api/auth/verify', async (route) => {
      await route.fulfill({ status: 401, body: JSON.stringify({ error: 'No token' }) });
    });

    // 2. Interceptar metadatos base del dashboard
    await page.route('**/api/pms', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/vendors', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/sedes', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/contactos', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/portfolio/states', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/portfolios', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });
    await page.route('**/api/tags', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // 3. Interceptar listado de proyectos
    await page.route('**/api/projects?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id_proyecto: 'PRJ-2026-E2E',
            nombre_proyecto: 'Proyecto E2E Test Playwright',
            descripcion: 'Proyecto mockeado para pruebas automatizadas.',
            id_pm: 1,
            pm_nombre: 'Test User',
            id_proveedor: 1,
            prov_nombre: 'Socio Mock',
            sede_nombre: 'Valencia',
            id_estado: 1,
            estado_proyecto: 'Ejecución',
            estado_icono: '🛠️',
            indicador_rag: 'VERDE',
            es_capex: false,
            budget_inicial: 75000.00,
            fecha_inicio: '2026-01-01',
            fecha_fin_inicial: '2026-12-31',
            fecha_fin_estimada: '2026-12-31',
            gasto_total_facturas: 25000.00,
            calculations: {
              budget_actualizado: 75000.00,
              consumo_real: 25000.00,
              total_facturado: 20000.00,
              total_pendiente: 5000.00,
              presupuesto_disponible: 50000.00,
              fecha_fin_estimada: '2026-12-31'
            },
            po_list: ['PO-10023'],
            has_hito_vencido: false,
            com_semanal_activo: true,
            com_mensual_activo: true,
            com_steerco_activo: false
          }
        ])
      });
    });
  });

  test('Debe autenticarse correctamente, listar proyectos y permitir ver detalle de un proyecto', async ({ page }) => {
    // 1. Visitar la ruta raíz (Login)
    await page.goto('/');

    // 2. Rellenar credenciales y pulsar Entrar
    await page.fill('input[type="email"]', 'test@dacsa.com');
    await page.fill('input[type="password"]', 'Test_1234!');
    await page.click('button:has-text("Entrar")');

    // 3. Verificar redirección y renderizado del Dashboard
    // El proyecto mockeado debería listarse en la tabla
    await expect(page.locator('text=Proyecto E2E Test Playwright')).toBeVisible();
    await expect(page.locator('text=PRJ-2026-E2E')).toBeVisible();
    await expect(page.locator('text=Test User')).toBeVisible();

    // 4. Interceptar petición de detalle de proyecto para la navegación
    await page.route('**/api/projects/PRJ-2026-E2E', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id_proyecto: 'PRJ-2026-E2E',
          nombre_proyecto: 'Proyecto E2E Test Playwright',
          descripcion: 'Proyecto mockeado para pruebas automatizadas.',
          id_pm: 1,
          id_proveedor: 1,
          id_sede: 1,
          id_sponsor: 1,
          id_estado: 1,
          portfolio_id: 1,
          indicador_rag: 'VERDE',
          fecha_inicio: '2026-01-01',
          fecha_fin_inicial: '2026-12-31',
          es_capex: false,
          budget_inicial: 75000.00,
          com_semanal_activo: true,
          com_mensual_activo: true,
          com_steerco_activo: false,
          PM: { nombre: 'Test', apellidos: 'User', correo: 'test@dacsa.com' },
          Proveedor: { nombre_razon_social: 'Socio Mock' },
          Sede: { nombre_sede: 'Valencia' },
          Estado: { nombre_estado: 'Ejecución', icono: '🛠️' },
          Tags: [],
          InvolvedContacts: [],
          ComSemanalContactos: [],
          ComMensualContactos: [],
          ComSteerCoContactos: [],
          Incidencias: [],
          Riesgos: [],
          Facturas: [
            {
              id_interno_factura: 'FAC-E2E-01',
              id_proyecto: 'PRJ-2026-E2E',
              id_proveedor: 1,
              concepto: 'Fase inicial',
              fecha_factura: '2026-03-01',
              importe: 25000.00,
              estado: 'RECIBIDA'
            }
          ],
          CambiosAlcance: [],
          Tareas: []
        })
      });
    });

    await page.route('**/api/projects/PRJ-2026-E2E/comments', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // 5. Hacer clic en el nombre del proyecto para ver el detalle
    await page.locator('text=Proyecto E2E Test Playwright').first().click();

    // 6. Verificar que estamos en la vista de detalle de proyecto
    await expect(page.locator('h2:has-text("Proyecto E2E Test Playwright"), h1:has-text("Proyecto E2E Test Playwright")').first()).toBeVisible();
    
    // Verificamos que se rendericen los datos de la ficha del proyecto
    await expect(page.locator('text=Socio Mock').first()).toBeVisible();
    await expect(page.locator('text=Valencia').first()).toBeVisible();
  });

});
