import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Known Playwright WebKit (macOS) differences. These behaviours are covered in Chromium and Firefox
// and should be spot-checked by hand in Safari (see "Cross-browser testing" in the web README).
const WEBKIT_TAB = 'Playwright WebKit does not Tab to links and buttons by default (Safari full keyboard access is off), so keyboard order and focus traps are verified in Chromium and Firefox.';
const WEBKIT_FOCUS = 'Playwright WebKit does not report focus restoration after a dialog closes or the layout resizes the way Chromium and Firefox do. Not confirmed as an app defect; verify manually in Safari.';
const evidence = path.resolve(process.env.EVIDENCE_DIR || 'test-results/evidence');
async function seed(page: Page) {
  await page.addInitScript(() => localStorage.setItem('careconnect_session', JSON.stringify({ user: { id: 'wk11', name: 'Wiliss Demo', email: 'wk11@example.com' } })));
}
async function scan(page: Page, name: string) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  await mkdir(evidence, { recursive: true });
  await writeFile(path.join(evidence, `${name}-axe.json`), JSON.stringify({ timestamp: result.timestamp, testEngine: result.testEngine, testEnvironment: result.testEnvironment, violations: result.violations, incomplete: result.incomplete, url: result.url }, null, 2));
  expect(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }))).toEqual([]);
}
async function reflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual((page.viewportSize()!.width) + 1); }
const screens = [
  ['landing', '/', ''], ['signin', '/signin', 'Welcome back'], ['dashboard', '/app', 'Dashboard'],
  ['medications', '/app/manage-medications', 'Manage medications'], ['appointments', '/app/manage-appointments', 'Manage appointments'],
  ['activity', '/app/activity', 'Activity log'], ['messages', '/app/messages', 'Messages'], ['settings', '/app/settings', 'Settings'],
];
for (const width of [375, 768, 1440]) for (const [name, route, heading] of screens) {
  test(`Week11 ${name} at required ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    if (route.startsWith('/app')) await seed(page);
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1, ...(heading ? { name: heading, exact: true } : {}) })).toBeVisible();
    await reflow(page); await scan(page, `wk11-${name}-${width}`);
    await page.screenshot({ path: path.join(evidence, `wk11-${name}-${width}.png`), fullPage: true });
  });
}
for (const width of [375, 768, 1440]) for (const route of ['/app', '/app/manage-medications', '/app/messages', '/app/settings']) {
  test(`Week11 dark theme ${route} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await seed(page);
    await page.addInitScript(() => localStorage.setItem('careconnect_web_preferences', JSON.stringify({ theme: 'dark' })));
    await page.goto(route); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await reflow(page); await scan(page, `dark-${route.split('/').at(-1)}-${width}`);
    if (route === '/app/settings' && width === 375) await page.screenshot({ path: path.join(evidence, 'dark-settings-375.png'), fullPage: true });
  });
}
test('Week11 settings persist with enlarged text and one-handed controls', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 }); await seed(page); await page.goto('/app/settings');
  await page.getByLabel('Text size', { exact: true }).selectOption('xlarge');
  await page.getByLabel('Theme', { exact: true }).selectOption('dark');
  await page.getByLabel('One-handed controls', { exact: true }).selectOption('right');
  await page.getByLabel('Stronger borders and focus').check();
  await page.reload(); await expect(page.getByLabel('Text size', { exact: true })).toHaveValue('xlarge');
  await expect(page.locator('html')).toHaveAttribute('data-hand', 'right');
  await reflow(page); await scan(page, 'settings-enlarged');
  await page.getByRole('button', { name: 'Restore default settings' }).click();
  await expect(page.getByLabel('Text size', { exact: true })).toHaveValue('normal');
});
test('Week11 customization changes actual DOM order and survives reload', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', WEBKIT_FOCUS);
  await seed(page); await page.goto('/app'); await page.getByRole('button', { name: 'Customize dashboard' }).click();
  const dialog = page.getByRole('dialog', { name: 'Customize dashboard' });
  await dialog.getByRole('button', { name: "Move Today's medications up" }).click();
  await dialog.getByLabel('Unread messages', { exact: true }).uncheck();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Customize dashboard' })).toBeFocused();
  expect(await page.locator('[data-widget]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-widget')))).toEqual(['medications', 'status', 'alerts', 'activity', 'next']);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Unread messages', exact: true })).toHaveCount(0);
});
test('Week11 message read reply compose archive restore delete and draft persistence', async ({ page }) => {
  await seed(page); await page.goto('/app/messages');
  await page.getByRole('link', { name: 'Welcome to your demo care plan' }).click();
  await page.getByRole('link', { name: 'Reply', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /^To/ })).toHaveValue('Demo care coordinator');
  await page.getByRole('textbox', { name: /^Subject/ }).fill('Week 11 local message');
  await page.getByRole('textbox', { name: /^Message/ }).fill('Fictional test message only.');
  await page.reload(); await expect(page.getByRole('textbox', { name: /^Subject/ })).toHaveValue('Week 11 local message');
  await expect(page.getByRole('textbox', { name: /^Message/ })).toHaveValue('Fictional test message only.');
  await page.getByRole('textbox', { name: /^Subject/ }).fill('Week 11 local message');
  await page.getByRole('button', { name: 'Save demo message' }).click();
  await expect(page.getByText('Demo message saved locally. Nothing was sent to a server.')).toBeVisible();
  await page.getByRole('button', { name: 'Archive Week 11 local message', exact: true }).click();
  await page.getByRole('navigation', { name: 'Message folders' }).getByRole('link', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'Unarchive Week 11 local message', exact: true }).click();
  await page.goto('/app/messages'); await page.getByRole('link', { name: 'Week 11 local message' }).click();
  await page.getByRole('button', { name: 'Delete message', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete message' });
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(page.getByRole('link', { name: 'Week 11 local message' })).toHaveCount(0);
});
test('Week11 keyboard help search and validation evidence', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', WEBKIT_TAB);
  await page.setViewportSize({ width: 375, height: 900 }); await seed(page); await page.goto('/app');
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await expect(page.getByRole('main')).toBeFocused();
  const help = page.getByRole('button', { name: 'Help and keyboard shortcuts', exact: true });
  await help.focus(); await page.keyboard.press('Space');
  const dialog = page.getByRole('dialog', { name: 'Help and keyboard shortcuts' }); await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  await page.screenshot({ path: path.join(evidence, 'keyboard-help-focus.png'), fullPage: false });
  await page.keyboard.press('Escape'); await expect(help).toBeFocused();
  await page.getByLabel('Find a page', { exact: true }).fill('Messages'); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Messages', exact: true })).toBeFocused();
  await page.goto('/app/messages/compose'); await page.getByRole('button', { name: 'Save demo message' }).click();
  await expect(page.getByRole('alert')).toBeFocused(); await scan(page, 'message-validation');
});
test('Week11 offline messages settings and direct route reload', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot navigate offline through a service worker (internal error), so offline behaviour is verified in Chromium.');
  await seed(page); await page.goto('/app/messages'); await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller); await context.setOffline(true);
  await page.goto('/app/messages/compose'); await page.getByRole('textbox', { name: /^To/ }).fill('Demo contact');
  await page.getByRole('textbox', { name: /^Subject/ }).fill('Offline demo'); await page.getByRole('textbox', { name: /^Message/ }).fill('Saved without a network.');
  await page.getByRole('button', { name: 'Save demo message' }).click(); await page.reload();
  await expect(page.getByRole('link', { name: 'Offline demo' })).toBeVisible();
  await page.screenshot({ path: path.join(evidence, 'offline-messages.png'), fullPage: true });
});
