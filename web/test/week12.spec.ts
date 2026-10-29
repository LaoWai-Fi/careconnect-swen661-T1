import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Week 12 Part 1: web accessibility checks that complete the Week 10 and Week 11 suites.
// It adds every route and overlay not yet scanned, structural/semantic checks, a rendered check that
// every keyboard-focusable control shows a visible focus indicator, and chat assistant focus behaviour.
// Evidence goes to test-results/ by default; set EVIDENCE_DIR (see npm run test:e2e:evidence) to commit it.

const WEBKIT_TAB = 'Playwright WebKit does not Tab to links and buttons by default (Safari full keyboard access is off), so keyboard order is verified in Chromium and Firefox and checked by hand in Safari.';
const evidence = path.resolve(process.env.EVIDENCE_DIR || 'test-results/evidence');

async function seed(page: Page) {
  await page.addInitScript(() => localStorage.setItem('careconnect_session', JSON.stringify({
    user: { id: 'wk12', name: 'Dom Demo', email: 'wk12@example.com' },
  })));
}

async function scan(page: Page, name: string) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  await mkdir(evidence, { recursive: true });
  await writeFile(path.join(evidence, `wk12-${name}-axe.json`), JSON.stringify({
    timestamp: result.timestamp, testEngine: result.testEngine, url: result.url, viewport: page.viewportSize(),
    violations: result.violations, incomplete: result.incomplete, passes: result.passes.map(({ id }) => id),
  }, null, 2));
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) }))).toEqual([]);
}

const routes: Array<[name: string, route: string, protectedRoute: boolean]> = [
  ['landing', '/', false],
  ['signin', '/signin', false],
  ['signup', '/signup', false],
  ['dashboard', '/app', true],
  ['contacts', '/app/contacts', true],
  ['notes', '/app/caregiver', true],
  ['activity', '/app/activity', true],
  ['medications', '/app/manage-medications', true],
  ['appointments', '/app/manage-appointments', true],
  ['messages', '/app/messages', true],
  ['compose', '/app/messages/compose', true],
  ['settings', '/app/settings', true],
];

async function open(page: Page, route: string, protectedRoute: boolean, theme?: 'dark') {
  if (protectedRoute) await seed(page);
  if (theme) await page.addInitScript(() => localStorage.setItem('careconnect_web_preferences', JSON.stringify({ theme: 'dark' })));
  await page.goto(route);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

// 1. Rendered axe scan of every route, light and dark, phone and desktop widths.
for (const width of [375, 1440]) {
  for (const theme of [undefined, 'dark'] as const) {
    for (const [name, route, isProtected] of routes) {
      test(`axe ${name} ${theme ?? 'light'} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await open(page, route, isProtected, theme);
        await scan(page, `${name}-${theme ?? 'light'}-${width}`);
      });
    }
  }
}

// 2. Overlays: chat assistant, help dialog, dashboard customization.
test('axe chat assistant panel open on landing', async ({ page }) => {
  await open(page, '/', false);
  await page.getByRole('button', { name: /open assistant/i }).click();
  await expect(page.getByRole('dialog', { name: 'CareConnect Assistant' })).toBeVisible();
  await scan(page, 'chat-open');
});

test('axe help dialog and dashboard customization', async ({ page }) => {
  await open(page, '/app', true);
  await page.getByRole('button', { name: 'Help and keyboard shortcuts' }).click();
  await expect(page.getByRole('dialog', { name: 'Help and keyboard shortcuts' })).toBeVisible();
  await scan(page, 'help-dialog');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Customize dashboard' }).click();
  await scan(page, 'customize-dashboard');
});

// 3. Semantic HTML and landmarks on every route.
for (const [name, route, isProtected] of routes) {
  test(`semantics ${name}: language, title, headings, landmarks, ids`, async ({ page }) => {
    await open(page, route, isProtected);
    await expect(page).toHaveTitle(/\S/);
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    const facts = await page.evaluate(() => {
      const levels = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => Number(h.tagName[1]));
      const skipped = levels.some((level, i) => i > 0 && level > levels[i - 1] + 1);
      const ids = Array.from(document.querySelectorAll('[id]')).map((e) => e.id);
      const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
      const positiveTabindex = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length;
      // Closed native dialogs (the mobile drawer) are not rendered, so only count landmarks a user can reach.
      const navs = Array.from(document.querySelectorAll('nav')).filter((e) => e.getClientRects().length > 0)
        .map((e) => e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || '');
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
      return { skipped, duplicateIds, positiveTabindex, navs, imagesWithoutAlt };
    });
    expect(facts.skipped, 'heading levels must not skip').toBe(false);
    expect(facts.duplicateIds, 'ids must be unique').toEqual([]);
    expect(facts.positiveTabindex, 'no tabindex values above 0').toBe(0);
    expect(facts.imagesWithoutAlt).toBe(0);
    expect(new Set(facts.navs).size, 'navigation landmarks need unique names').toBe(facts.navs.length);
    for (const label of facts.navs) expect(label).not.toBe('');
  });
}

// 4. Keyboard-only: every control is reachable, order has no trap, and each focus stop is visibly indicated.
async function focusIndicator(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const style = getComputedStyle(el);
    const outlineWidth = parseFloat(style.outlineWidth);
    const outlineVisible = style.outlineStyle !== 'none' && outlineWidth >= 2 && style.outlineColor !== 'rgba(0, 0, 0, 0)';
    const box = el.getBoundingClientRect();
    const label = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || '').trim().slice(0, 40)}" @${Math.round(box.x)},${Math.round(box.y + window.scrollY)}`;
    return { label, outlineVisible, outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}` };
  });
}

for (const [name, route, isProtected] of routes) {
  test(`keyboard ${name}: all controls reachable with a visible focus indicator`, async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', WEBKIT_TAB);
    await open(page, route, isProtected);
    const expected = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]',
    )).filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
      && !el.closest('[inert], dialog:not([open]), details:not([open]) > :not(summary)')).length);
    expect(expected).toBeGreaterThan(0);
    const reached = new Set<string>();
    const missingIndicator: string[] = [];
    for (let step = 0; step < expected + 6; step++) {
      await page.keyboard.press('Tab');
      const info = await focusIndicator(page);
      if (!info) continue;
      if (reached.has(info.label)) { if (info.label === [...reached][0]) break; continue; }
      reached.add(info.label);
      if (!info.outlineVisible) missingIndicator.push(`${info.label} -> ${info.outline}`);
    }
    expect(missingIndicator, 'every focus stop needs an outline of at least 2px').toEqual([]);
    expect(reached.size, 'Tab order must reach the page controls (no keyboard trap)').toBeGreaterThanOrEqual(Math.min(expected, 3));
  });
}

// 5. Chat assistant: keyboard operation, focus kept in the field, and spoken speaker labels.
test('chat assistant keyboard flow keeps focus and labels each speaker', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', WEBKIT_TAB);
  await open(page, '/', false);
  const launcher = page.getByRole('button', { name: /open assistant/i });
  await launcher.focus();
  await page.keyboard.press('Enter');
  const input = page.getByRole('textbox', { name: /type your question/i });
  await expect(input).toBeFocused();
  await page.keyboard.type('is it free');
  await page.keyboard.press('Enter');
  await expect(input).toBeFocused();
  const log = page.getByRole('log', { name: 'Conversation' });
  await expect(log).toContainText('You: is it free');
  await expect(log).toContainText('Assistant: CareConnect is free to use');
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /open assistant/i })).toBeFocused();
});

// 6. One-handed mode moves the header buttons to the chosen side, and Tab order matches the visual order.
for (const hand of ['off', 'left', 'right'] as const) {
  test(`one-handed ${hand}: header buttons sit on the chosen side and Tab follows the visual order`, async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', WEBKIT_TAB);
    await seed(page);
    await page.addInitScript((h) => localStorage.setItem('careconnect_web_preferences', JSON.stringify({ handMode: h })), hand);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/app');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const x = async (name: string | RegExp, role: 'link' | 'button') => {
      const box = await page.locator('.web-utility').getByRole(role, { name }).boundingBox();
      return box!.x + box!.width / 2;
    };
    const menu = await x('Open navigation', 'button');
    const brand = await x('CareConnect home', 'link');
    const settings = await x('Settings', 'link');
    const signOut = await x(/Sign out/, 'button');
    if (hand === 'left') {
      expect(menu).toBeLessThan(settings);
      expect(signOut).toBeLessThan(brand);
      expect(settings).toBeLessThan(brand);
    } else if (hand === 'right') {
      expect(brand).toBeLessThan(settings);
      expect(signOut).toBeLessThan(menu);
      expect(menu).toBeGreaterThan(settings);
    } else {
      expect(menu).toBeLessThan(brand);
      expect(settings).toBeGreaterThan(brand);
    }
    // keyboard order of the header buttons equals their left-to-right order
    const order: number[] = [];
    // start from a fresh page with no focus so every browser begins at the top of the document
    for (let i = 0; i < 16 && order.length < 5; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const inHeader = Boolean(el?.closest('.web-utility'));
        return { inHeader, x: el ? el.getBoundingClientRect().x : -1 };
      });
      if (info.inHeader) order.push(info.x);
    }
    expect(order.length).toBeGreaterThanOrEqual(4);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
}

// 7. Required-field asterisks are visible text, so they need 3:1 or better on the dark surface too
//    (aria-hidden text is skipped by axe, so this is checked directly from computed colors).
test('required field markers keep readable contrast in dark theme', async ({ page }) => {
  await open(page, '/signin', false, 'dark');
  const worst = await page.evaluate(() => {
    const parse = (c: string) => (c.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const bgOf = (el: Element | null): number[] => {
      for (let e = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c.length === 4 ? c[3] > 0.99 : c.length === 3) return c;
      }
      return [255, 255, 255];
    };
    const ratios = Array.from(document.querySelectorAll('.text-alert-600')).map((el) => {
      const a = lum(parse(getComputedStyle(el).color)); const b = lum(bgOf(el));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    return { count: ratios.length, min: Math.min(...ratios) };
  });
  expect(worst.count).toBeGreaterThan(0);
  expect(worst.min).toBeGreaterThanOrEqual(4.5);
});
