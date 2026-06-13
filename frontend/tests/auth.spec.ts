import { test, expect } from '@playwright/test';

test.describe('Autenticación y Navegación Básica', () => {

  test('Debe cargar la página de login', async ({ page }) => {
    await page.goto('/');
    
    // Deberíamos ver el botón de Entrar
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  // Nota: Para un test E2E real, aquí se rellenarían credenciales
  // y se pulsaría Entrar. Dado que la base de datos real puede variar,
  // nos aseguramos de que los componentes mínimos estén presentes.
});
