import { test, expect, chromium, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const evidence = path.resolve('..', 'docs', 'week11', 'evidence');
const user = { id: 'week10-demo', name: 'Wiliss Demo', email: 'week10@example.com' };

test('upgrade retains legacy activity on dashboard and timeline', async ({ page }) => {
  await seed(page);
  await page.addInitScript(() => localStorage.setItem('careconnect_activity_log', JSON.stringify(
    ['med_skipped', 'schedule_done', 'future_kind'].map((kind, index) => ({
      id: `legacy-${index}`, kind, label: `Legacy activity ${index}`, timestamp: new Date().toISOString(),
    })),
  )));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/app', '/app/activity']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Legacy activity 0')).toBeVisible();
    await expect(page.getByText('Legacy activity 2')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('daily tracking rolls over at local midnight while the app stays open', async ({ page }) => {
  await page.clock.install({ time: new Date(2031, 0, 12, 23, 59) });
  await seed(page);
  await page.goto('/app');
  const mark = page.getByRole('button', { name: /^Mark as taken: / }).first();
  const name = (await mark.getAttribute('aria-label'))!.replace('Mark as taken: ', '');
  await mark.click();
  await page.getByRole('button', { name: "Check in now: record Margaret's check-in" }).click();
  await page.clock.setSystemTime(new Date(2031, 0, 13, 0, 1));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('button', { name: `Mark as taken: ${name}`, exact: true })).toBeVisible();
  await page.getByRole('button', { name: "Check in now: record Margaret's check-in" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('careconnect_checkin')!).date)).toBe('2031-01-13');
});
async function seed(page: Page) {
  await page.addInitScript(({ user }) => {
    if (!localStorage.getItem('careconnect_session')) localStorage.setItem('careconnect_session', JSON.stringify({ user }));
  }, { user });
}
async function noOverflow(page: Page) {
  const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
    outside: Array.from(document.querySelectorAll('body *')).filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
      .slice(0, 8).map((element) => `${element.tagName}.${element.className}`) }));
  expect(size.scroll, `page must reflow rather than hide overflow: ${size.outside.join(', ')}`).toBeLessThanOrEqual(size.width + 1);
}
async function scan(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  await mkdir(evidence, { recursive: true });
  await writeFile(path.join(evidence, `${name}-axe.json`), JSON.stringify({
    timestamp: results.timestamp, testEngine: results.testEngine, testEnvironment: results.testEnvironment,
    url: results.url, viewport: page.viewportSize(), violations: results.violations,
    incomplete: results.incomplete, passes: results.passes.map(({ id }) => id),
  }, null, 2));
  expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
}

for (const width of [320, 375, 390, 767, 768, 1023, 1024, 1440]) {
  for (const [name, route, heading] of [
    ['signin', '/signin', 'Welcome back'],
    ['dashboard', '/app', 'Dashboard'],
    ['medications', '/app/manage-medications', 'Manage medications'],
  ]) {
    test(`responsive ${name} at ${width}px: reflow and rendered axe`, async ({ page }) => {
      await page.setViewportSize({ width, height: 960 });
      if (name !== 'signin') await seed(page);
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible();
      await expect(page.getByRole('main')).toHaveCount(1);
      await noOverflow(page);
      await scan(page, `${name}-${width}`);
      if ([320, 375, 768, 1440].includes(width)) {
        await page.screenshot({ path: path.join(evidence, `${name}-${width}.png`), fullPage: true });
      }
    });
  }
}

test('keyboard skip link and sign-in errors are associated and focused', async ({ page }) => {
  await page.goto('/signin');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByLabel('Email address')).toBeFocused();
  await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true');
  expect(await page.locator('[aria-describedby]').evaluateAll((elements) => elements.every((element) =>
    element.getAttribute('aria-describedby')!.split(/\s+/).every((id) => Boolean(document.getElementById(id)))))).toBe(true);
  await scan(page, 'signin-errors');
});

test('mobile drawer: keyboard containment, Escape, navigation and route focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto('/app');
  const opener = page.getByRole('button', { name: 'Open navigation' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'CareConnect navigation' });
  await expect(dialog).toBeVisible();
  await scan(page, 'mobile-navigation');
  for (let step = 0; step < 9; step++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await page.keyboard.press('Enter');
  for (let step = 0; step < 8; step++) {
    if (await dialog.getByRole('link', { name: 'Medications', exact: true }).evaluate((node) => node === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/app\/manage-medications$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page).toHaveTitle('Manage medications | CareConnect');
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
});

test('tablet sidebar expands and collapses without losing controls', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await seed(page);
  await page.goto('/app/manage-medications');
  const sidebar = page.locator('#web-sidebar');
  const collapsed = await sidebar.boundingBox();
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  expect((await sidebar.boundingBox())!.width).toBeGreaterThan(collapsed!.width);
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Medications' })).toBeVisible();
  await noOverflow(page);
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await noOverflow(page);
});

test('medication form validation, persisted CRUD and modal focus', async ({ page }) => {
  await seed(page);
  await page.goto('/app/manage-medications');
  await page.getByRole('button', { name: 'Add new medication', exact: true }).click();
  await page.getByRole('button', { name: 'Add medication', exact: true }).click();
  await expect(page.getByText('Please fix the following before saving:')).toBeVisible();
  await page.getByLabel('Medication name', { exact: false }).fill('Week 10 demo medicine');
  await page.getByLabel('Dose', { exact: false }).fill('Demo dose');
  await page.getByLabel('Time', { exact: true }).fill('08:30');
  await scan(page, 'medication-form');
  await page.getByRole('button', { name: 'Add medication', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Week 10 demo medicine', exact: true })).toBeVisible();
  await page.reload();
  const remove = page.getByRole('button', { name: 'Delete Week 10 demo medicine', exact: true });
  await remove.click();
  const dialog = page.getByRole('dialog', { name: 'Delete medication' });
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  const contrast = await dialog.locator('.web-modal-description').evaluate((node) => {
    const color = getComputedStyle(node).color;
    const background = getComputedStyle(node.closest('dialog')!).backgroundColor;
    const luminance = (value: string) => {
      const rgb = value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((component) => {
        const s = component / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
      });
      return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    };
    const a = luminance(color), b = luminance(background);
    return { foreground: color, background, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  });
  await writeFile(path.join(evidence, 'modal-contrast.json'), JSON.stringify(contrast, null, 2));
  expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
  await scan(page, 'delete-confirmation');
  for (let step = 0; step < 7; step++) {
    await page.keyboard.press(step % 2 ? 'Shift+Tab' : 'Tab');
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(remove).toBeFocused();
  await remove.click();
  await dialog.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page.getByRole('heading', { name: 'Week 10 demo medicine', exact: true })).toHaveCount(0);
});

test('real sign-up, sign-in and sign-out workflow', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel(/your name/i).fill('Week Ten Tester');
  await page.getByLabel('Email address').fill('week10-flow@example.com');
  await page.getByLabel('Password', { exact: false }).first().fill('demo-password');
  await page.getByLabel(/confirm password/i).fill('demo-password');
  await page.getByRole('button', { name: /create account|sign up/i }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out of CareConnect' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/signin');
  await page.getByLabel('Email address').fill('week10-flow@example.com');
  await page.getByLabel('Password', { exact: false }).fill('demo-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/app');
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
});

test('PWA manifest, offline direct routes, local demo data and safe cache boundaries', async ({ page, context }) => {
  await seed(page);
  await page.goto('/app');
  await page.evaluate(async () => {
    await caches.open('neighbor-app-cache');
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json());
  expect(manifest.display).toBe('standalone');
  expect(manifest.orientation).toBe('any');
  const cdp = await context.newCDPSession(page);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  await writeFile(path.join(evidence, 'pwa-incognito-diagnostics.json'), JSON.stringify(installability, null, 2));
  expect(installability.installabilityErrors.filter((item: { errorId: string }) => item.errorId !== 'in-incognito')).toEqual([]);
  for (const icon of manifest.icons) {
    expect((await page.request.get(icon.src)).ok()).toBe(true);
  }
  await page.evaluate(() => fetch('/api/week10-cache-check'));
  const keys = await page.evaluate(async () => {
    const names = await caches.keys();
    const own = names.filter((name) => name.startsWith('careconnect-web-'));
    const resources = (await Promise.all(own.map(async (name) => (await (await caches.open(name)).keys()).map((request) => request.url)))).flat();
    return { names, resources };
  });
  expect(keys.names).toContain('neighbor-app-cache');
  expect(keys.resources.some((url) => url.includes('/api/'))).toBe(false);
  expect(keys.resources.some((url) => /\/assets\/.*\.js$/.test(url))).toBe(true);
  await context.setOffline(true);
  await page.goto('/app/manage-medications');
  await expect(page.getByRole('heading', { name: 'Manage medications', exact: true })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Connection status' })).toContainText('You’re offline');
  await page.getByRole('button', { name: 'Add new medication', exact: true }).click();
  await page.getByLabel('Medication name', { exact: false }).fill('Offline demo medicine');
  await page.getByLabel('Dose', { exact: false }).fill('Demo');
  await page.getByLabel('Time', { exact: true }).fill('09:00');
  await page.getByRole('button', { name: 'Add medication', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Offline demo medicine', exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(evidence, 'pwa-offline.png'), fullPage: true });
  await context.setOffline(false);
  await expect(page.getByRole('status', { name: 'Connection status' })).not.toContainText('You’re offline');
});

test('PWA install offer: simulated browser event, dismissal, focus and rejected prompt', async ({ page }) => {
  await page.goto('/signin');
  const offer = async (reject = false) => page.evaluate((reject) => {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: () => reject ? Promise.reject(new Error('Test rejection')) : Promise.resolve(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    window.dispatchEvent(event);
  }, reject);
  await offer(true);
  await page.getByRole('button', { name: 'Install', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Installation could not start');
  await scan(page, 'pwa-install');
  await page.getByRole('button', { name: 'Not now', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await offer();
  await expect(page.getByRole('button', { name: 'Install', exact: true })).toHaveCount(0);
});

test('PWA update waits for consent and preserves unrelated caches', async ({ page }) => {
  const workerPath = path.resolve('dist/sw.js');
  const original = await readFile(workerPath, 'utf8');
  await seed(page);
  await page.goto('/app/manage-medications');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.getByRole('button', { name: 'Add new medication', exact: true }).click();
  await page.getByLabel('Medication name', { exact: false }).fill('Unsaved demo draft');
  await page.evaluate(async () => { await caches.open('neighbor-app-cache'); await caches.open('careconnect-runtime-v1'); });
  try {
    await writeFile(workerPath, original.replace(/const BUILD_ID = '([^']+)'/, "const BUILD_ID = '$1-update-test'"));
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.ready; await registration.update(); });
    await expect(page.getByRole('button', { name: 'Reload to update' })).toBeVisible();
    await expect(page.getByLabel('Medication name', { exact: false })).toHaveValue('Unsaved demo draft');
    await page.screenshot({ path: path.join(evidence, 'pwa-update.png'), fullPage: true });
    await page.getByRole('button', { name: 'Reload to update' }).click();
    await expect(page.getByRole('button', { name: 'Add new medication', exact: true })).toBeVisible();
    const cacheKeys = await page.evaluate(() => caches.keys());
    expect(cacheKeys).toContain('neighbor-app-cache');
    expect(cacheKeys).not.toContain('careconnect-runtime-v1');
    expect(cacheKeys.filter((name) => name.startsWith('careconnect-web-'))).toHaveLength(1);
    expect(cacheKeys.some((name) => name.endsWith('-update-test'))).toBe(true);
  } finally { await writeFile(workerPath, original); }
});

test('responsive mobile medication form stays usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await seed(page);
  await page.goto('/app/manage-medications');
  await page.getByRole('button', { name: 'Add new medication', exact: true }).click();
  await expect(page.getByLabel(/Medication name/)).toBeFocused();
  await noOverflow(page);
  await page.getByRole('button', { name: 'Add medication', exact: true }).click();
  expect(await page.getByRole('alert').first().evaluate((node) => node === document.activeElement)).toBe(true);
  await scan(page, 'medication-errors-320');
  await page.screenshot({ path: path.join(evidence, 'medication-form-320.png'), fullPage: true });
});

test('responsive dashboard supports 200 percent text sizing', async ({ page }) => {
  await seed(page);
  await page.goto('/app');
  await page.evaluate(() => { document.documentElement.style.fontSize = '36px'; });
  await noOverflow(page);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
});

test('responsive drawer closes safely when resized to desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto('/app');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('app routes retain accessible navigation after the shared shell changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  for (const route of ['/app', '/app/manage-medications', '/app/manage-appointments', '/app/activity']) {
    await page.goto(route);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await noOverflow(page);
  }
});

test('PWA installability in a dedicated non-private browser profile', async () => {
  const context = await chromium.launchPersistentContext(path.resolve('test-results/installability-profile'), {
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'), headless: true,
    baseURL: 'http://127.0.0.1:4173',
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto('/signin');
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const cdp = await context.newCDPSession(page);
    const manifest = await cdp.send('Page.getAppManifest');
    expect(manifest.errors).toEqual([]);
    const diagnostics = await cdp.send('Page.getInstallabilityErrors');
    await writeFile(path.join(evidence, 'pwa-installability.json'), JSON.stringify({
      profile: 'Dedicated non-private test profile, not the user profile',
      manifestErrors: manifest.errors, ...diagnostics,
    }, null, 2));
    expect(diagnostics.installabilityErrors).toEqual([]);
  } finally { await context.close(); }
});

test('caregiver marks a medication taken, checks in, and the activity log records both', async ({ page }) => {
  await seed(page);
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: "Today's medications" })).toBeVisible();
  const mark = page.getByRole('button', { name: /^Mark as taken: / }).first();
  const label = (await mark.getAttribute('aria-label')) ?? '';
  const medName = label.replace(/^Mark as taken: /, '');
  await mark.click();
  await expect(page.getByRole('button', { name: `Undo: unmark ${medName} as taken` })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: `${medName} marked as taken` })).toHaveCount(1);
  await page.getByRole('button', { name: "Check in now: record Margaret's check-in" }).click();
  await expect(page.getByRole('button', { name: "Check in now: record Margaret's check-in" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: `Undo: unmark ${medName} as taken` })).toBeVisible();
  await page.goto('/app/activity');
  await expect(page.getByText(`${medName} marked as taken`)).toBeVisible();
  await expect(page.getByText('Margaret checked in')).toBeVisible();
  await page.goto('/app');
  await page.getByRole('button', { name: `Undo: unmark ${medName} as taken` }).click();
  await expect(page.getByRole('button', { name: `Mark as taken: ${medName}` })).toBeVisible();
});
