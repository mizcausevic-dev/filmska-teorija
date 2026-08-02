import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(document.body.scrollWidth, root.scrollWidth) - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectCanvasNonBlank(page: import('@playwright/test').Page) {
  const sample = await page.locator('.graph-canvas canvas').evaluate((canvas) => {
    const element = canvas as HTMLCanvasElement;
    const context = element.getContext('webgl2') ?? element.getContext('webgl');
    if (!context) return { colored: 0, width: element.width, height: element.height };
    const width = Math.min(element.width, 320);
    const height = Math.min(element.height, 240);
    const data = new Uint8Array(width * height * 4);
    context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, data);
    let colored = 0;
    for (let index = 0; index < data.length; index += 16) {
      if (data[index] || data[index + 1] || data[index + 2] || data[index + 3]) colored += 1;
    }
    return { colored, width: element.width, height: element.height };
  });
  expect(sample.width).toBeGreaterThan(250);
  expect(sample.height).toBeGreaterThan(250);
  expect(sample.colored).toBeGreaterThan(100);
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test('renders the source-backed workbench and supports the core desktop flow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'desktop-only workflow');
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Film theory');
  await expect(page.getByText('24/24 modules loaded')).toBeVisible();
  await expect(page.locator('.module-list').getByRole('button', { name: /Feminist film theory/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectCanvasNonBlank(page);
  await mkdir('docs/qa', { recursive: true });
  await page.screenshot({ path: 'docs/qa/desktop-initial.png', fullPage: false });

  await page.locator('.module-list').getByRole('button', { name: /Feminist film theory/ }).click();
  await expect(page.locator('h1')).toHaveText('Feminist film theory');

  await page.getByLabel('Image URL').fill('https://upload.wikimedia.org/wikipedia/commons/a/ad/BolexH16.jpg');
  await page.getByRole('button', { name: 'Save media' }).click();
  await expect(page.locator('.media-stage img')).toBeVisible();

  await page.getByLabel('Technique or term').fill('close reading');
  await page.getByLabel('Observable evidence').fill('A visible composition choice is recorded before interpretation.');
  await page.getByRole('button', { name: 'Add tag' }).click();
  await expect(page.getByText('close reading')).toBeVisible();

  await page.getByPlaceholder('Draft a claim about Feminist film theory').fill('A feminist film theory claim needs a counter-lens.');
  await expect(page.locator('#essay').getByText('Detected source lenses')).toBeVisible();

  await page.screenshot({ path: 'docs/qa/desktop-viewport.png', fullPage: false });
  await page.screenshot({ path: 'docs/qa/desktop-workbench.png', fullPage: true });
});

test('collapses to a vertical mobile workflow without horizontal navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('desktop'), 'mobile-only workflow');
  await page.goto('/#marxist-film-theory');
  await expect(page.locator('h1')).toHaveText('Marxist film theory');
  await expect(page.getByRole('button', { name: 'Modules' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await mkdir('docs/qa', { recursive: true });
  await page.screenshot({ path: 'docs/qa/mobile-initial.png', fullPage: false });

  await page.getByRole('button', { name: 'Modules' }).click();
  await expect(page.locator('.module-list').getByRole('button', { name: /Apparatus theory/ })).toBeVisible();
  await page.locator('.module-list').getByRole('button', { name: /Apparatus theory/ }).click();
  await expect(page.locator('h1')).toHaveText('Apparatus theory');
  await expectNoHorizontalOverflow(page);

  await page.screenshot({ path: 'docs/qa/mobile-viewport.png', fullPage: false });
  await page.screenshot({ path: 'docs/qa/mobile-workbench.png', fullPage: true });
});
