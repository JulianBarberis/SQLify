import { test, expect } from '@playwright/test';

test.describe('SQLify Full-Stack E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptamos la llamada a /api/generar-consulta por defecto para aislamiento determinista
    await page.route('**/api/generar-consulta', async (route) => {
      const postData = route.request().postDataJSON();
      const question = postData?.question || '';

      if (question.includes('error')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'consulta-sql-invalida',
            detail: 'Error sintáctico en la consulta generada',
            sql: 'SELECT FROM Unknown;',
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sql: 'SELECT id_cancion, titulo, reproducciones FROM Cancion ORDER BY reproducciones DESC LIMIT 10;',
          explain: 'Consulta generada exitosamente para: ' + question,
          executed: {
            rowCount: 2,
            rows: [
              {
                id: 1,
                titulo: 'Blinding Lights',
                reproducciones: 3800000,
                spotify_url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
              },
              {
                id: 2,
                titulo: 'Shape of You',
                reproducciones: 3500000,
                spotify_url: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/');
  });

  test('carga la interfaz inicial con encabezados, sugerencias y controles de accesibilidad', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('img', { name: 'SQLify Logo' })).toBeVisible();
    await expect(page.getByPlaceholder(/ej. top 10 artistas más escuchados/i)).toBeVisible();

    // Comprobar presencia de chips de consulta
    const chips = page.locator('.prompt-chip-button');
    await expect(chips).toHaveCount(5);
    await expect(chips.first()).toBeVisible();

    // Probar el tooltip de información mediante hover
    const infoButton = page.getByRole('button', { name: /información adicional sobre consultas/i });
    await infoButton.hover();
    await expect(page.locator('#query-disclaimer')).toBeVisible();
  });

  test('muestra notificación de error si se envía el formulario vacío', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: 'BUSCAR' });
    await searchButton.click();

    // Verificamos que aparezca la alerta de error de React Toastify
    await expect(page.locator('.Toastify__toast--error')).toBeVisible();
    await expect(page.getByText('Por favor ingrese una consulta')).toBeVisible();
  });

  test('ejecuta búsqueda mediante chip sugerido y muestra visor de SQL y tabla de resultados', async ({ page }) => {
    const chip = page.getByRole('button', { name: 'Top 10 canciones más reproducidas' });
    await chip.click();

    // Verificar que el textarea se rellenó
    await expect(page.getByPlaceholder(/ej. top 10 artistas más escuchados/i)).toHaveValue('Top 10 canciones más reproducidas');

    // Verificar visor de SQL
    await expect(page.locator('.sql-viewer-container')).toBeVisible();
    await expect(page.locator('.sql-code-content code')).toContainText('SELECT id_cancion, titulo, reproducciones FROM Cancion');

    // Verificar tabla de resultados
    const table = page.getByRole('table', { name: /tabla de registros encontrados/i });
    await expect(table).toBeVisible();
    await expect(page.getByText('Blinding Lights')).toBeVisible();
    await expect(page.getByText('Shape of You')).toBeVisible();

    // Probar botón de copiar SQL
    const copyButton = page.getByRole('button', { name: /copiar consulta sql/i });
    await expect(copyButton).toBeVisible();
  });

  test('ejecuta búsqueda mediante atajo de teclado Ctrl+Enter', async ({ page }) => {
    const textarea = page.getByPlaceholder(/ej. top 10 artistas más escuchados/i);
    await textarea.fill('Artistas de rock');
    await textarea.press('Control+Enter');

    await expect(page.locator('.sql-viewer-container')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('gestiona errores de consulta con ErrorAlert y permite descartar', async ({ page }) => {
    const textarea = page.getByPlaceholder(/ej. top 10 artistas más escuchados/i);
    await textarea.fill('Consulta con error sintáctico');
    await page.getByRole('button', { name: 'BUSCAR' }).click();

    // ErrorAlert visible
    const alert = page.locator('.error-alert-container');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Error sintáctico en la consulta generada');

    // Cerrar la alerta
    const closeBtn = page.getByRole('button', { name: /cerrar notificación de error/i });
    await closeBtn.click();
    await expect(alert).not.toBeVisible();
  });
});
