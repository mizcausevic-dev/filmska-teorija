import { expect, test } from '@playwright/test';

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
  await expect(page.locator('.app-footer a')).toHaveText(['Privacy', 'Terms', 'llm.txt']);
  await expect(page.locator('.module-list').getByRole('link', { name: /Feminist film theory/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Load 3D view' }).click();
  await expectCanvasNonBlank(page);
  await page.screenshot({ path: testInfo.outputPath('desktop-initial.png'), fullPage: false });

  await page.locator('.module-list').getByRole('link', { name: /Feminist film theory/ }).click();
  await expect(page.locator('h1')).toHaveText('Feminist film theory');

  await page.getByLabel('Image URL').fill('https://upload.wikimedia.org/wikipedia/commons/a/ad/BolexH16.jpg');
  await page.getByRole('button', { name: 'Save media' }).click();
  await expect(page.locator('.media-stage img')).toBeVisible();

  await page.getByLabel('Technique or term').fill('close reading');
  await page.getByLabel('Observable evidence').fill('A visible composition choice is recorded before interpretation.');
  await page.getByRole('button', { name: 'Add tag' }).click();
  await expect(page.locator('.breakdown-list strong').getByText('close reading', { exact: true })).toBeVisible();

  await page.getByPlaceholder('Draft a claim about Feminist film theory').fill('A feminist film theory claim needs a counter-lens.');
  await expect(page.locator('#essay').getByText('Detected source lenses')).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('desktop-viewport.png'), fullPage: false });
  await page.screenshot({ path: testInfo.outputPath('desktop-workbench.png'), fullPage: true });
});

test('keeps abbreviation-heavy auteur summaries intact across shared summary surfaces', async ({ page }) => {
  await page.goto('/theory/auteur/');
  const expectedEnding = 'across a diverse body of work.';

  await expect(page.locator('.workspace-header p')).toContainText('Suspense');
  await expect(
    page.locator('.annotation-timeline article').filter({ hasText: 'Concept anchor' }).locator('p'),
  ).toContainText(expectedEnding);
  await expect(page.locator('#essay article').filter({ hasText: 'Next citation move' }).locator('p')).toContainText(
    expectedEnding,
  );
  await expect(page.locator('#blog article').first().locator('p')).toContainText(expectedEnding);
});

test('collapses to a vertical mobile workflow without horizontal navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('desktop'), 'mobile-only workflow');
  await page.goto('/theory/marxist-film-theory/');
  await expect(page.locator('h1')).toHaveText('Marxist film theory');
  await expect(page.getByRole('button', { name: 'Modules' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('mobile-initial.png'), fullPage: false });

  await page.getByRole('button', { name: 'Modules' }).click();
  await expect(page.locator('.module-list').getByRole('link', { name: /Apparatus theory/ })).toBeVisible();
  await page.locator('.module-list').getByRole('link', { name: /Apparatus theory/ }).click();
  await expect(page.locator('h1')).toHaveText('Apparatus theory');
  await expectNoHorizontalOverflow(page);

  await page.screenshot({ path: testInfo.outputPath('mobile-viewport.png'), fullPage: false });
  await page.screenshot({ path: testInfo.outputPath('mobile-workbench.png'), fullPage: true });
});

test('persists essay drafts per module and selects the opened lens', async ({ page }) => {
  await page.goto('/theory/marxist-film-theory/');
  await expect(page.locator('#lenses .lens-result h3')).toHaveText('Marxist film theory');
  await page.getByRole('textbox', { name: 'Essay outline' }).fill('A claim about labor in the frame.');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Essay outline' })).toHaveValue('A claim about labor in the frame.');
  if (test.info().project.name.includes('mobile')) {
    await page.getByRole('button', { name: 'Modules' }).click();
  }
  await page.locator('.module-list').getByRole('link', { name: /Feminist film theory/ }).click();
  await expect(page.locator('#lenses .lens-result h3')).toHaveText('Feminist film theory');
  await expect(page).toHaveTitle('Feminist film theory | Filmska Teorija');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/theory\/feminist-film-theory\/$/);
  await expect(page.getByRole('textbox', { name: 'Essay outline' })).toHaveValue('');
});

test('uses a direct video clock for scene tags and seeks to a saved tag', async ({ page }) => {
  await page.addInitScript(() => {
    const times = new WeakMap<HTMLMediaElement, number>();
    Object.defineProperty(HTMLMediaElement.prototype, 'duration', { configurable: true, get: () => 180 });
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      get() { return times.get(this) ?? 0; },
      set(value: number) { times.set(this, value); this.dispatchEvent(new Event('timeupdate')); },
    });
  });
  await page.goto('/theory/apparatus-theory/');
  await page.getByLabel('Video or embed URL').fill('https://example.test/scene.mp4');
  await page.getByRole('button', { name: 'Save media' }).click();
  const video = page.locator('.media-stage video');
  await expect(video).toBeVisible();
  await video.evaluate((element) => { (element as HTMLVideoElement).currentTime = 84; });
  await page.getByRole('button', { name: 'Use player time' }).click();
  await expect(page.getByRole('textbox', { name: 'Timecode' })).toHaveValue('01:24');
  await page.getByRole('textbox', { name: 'Technique or term' }).fill('direct address');
  await page.getByRole('textbox', { name: 'Observable evidence' }).fill('A performer faces the lens.');
  await page.getByRole('button', { name: 'Add tag' }).click();
  await video.evaluate((element) => { (element as HTMLVideoElement).currentTime = 0; });
  await page.locator('.clip-tags button').filter({ hasText: 'direct address' }).click();
  expect(await video.evaluate((element) => (element as HTMLVideoElement).currentTime)).toBe(84);
});

test('provides sourced keyboard-accessible graph paths and crawlable authored pages', async ({ page, request }) => {
  const authored = await request.get('/theory/apparatus-theory/');
  expect(authored.ok()).toBeTruthy();
  const html = await authored.text();
  expect(html).toContain('<title>Apparatus theory | Filmska Teorija</title>');
  expect(html).toContain('Filmska');
  expect(html).toContain('The Great Train Robbery');
  expect(html).toContain('Library of Congress');
  expect(html).not.toContain('name="robots" content="noindex"');
  const unreviewed = await request.get('/theory/film-studies/');
  expect(await unreviewed.text()).toContain('name="robots" content="noindex"');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/theory/apparatus-theory/');
  expect(sitemap).not.toContain('/theory/film-studies/');
  expect(sitemap).not.toContain('/theory/screen-theory/');

  await page.goto('/theory/film-theory/');
  const relation = page.locator('#graph li').filter({ hasText: 'feminist film theory' });
  await relation.getByRole('button', { name: 'Open module' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveText('Feminist film theory');
  await expect(page.locator('#lenses .lens-result h3')).toHaveText('Feminist film theory');
});
