import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { parseChapterSave, replay, saveKey } from '../../src/adventure/model.ts';
const route = '/SE-Learning-Quest/#adventure';
const key = saveKey('/SE-Learning-Quest/');
const classicKey = 'se_learning_quest_asterfall_v1:/SE-Learning-Quest';
function observe(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}
async function stored(page: Page) { return parseChapterSave((await page.evaluate(k => localStorage.getItem(k), key))!); }
async function a11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, message: n.failureSummary })) }))).toEqual([]);
}
async function fits(page: Page) {
  expect(await page.evaluate(() => { const e = document.querySelector('.adventure')!; return { app: e.scrollWidth - e.clientWidth, body: document.body.scrollWidth - innerWidth }; })).toEqual({ app: 0, body: 0 });
}
async function capture(page: Page, info: TestInfo, name: string) {
  await mkdir('output/asterfall', { recursive: true });
  await page.screenshot({ path: `output/asterfall/illustrated-${info.project.name}-${name}.png`, fullPage: false });
}
async function start(page: Page) {
  page.setDefaultTimeout(10_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  await expect(page.getByRole('heading', { name: 'Sera’s lantern house', exact: true })).toBeVisible();
}
async function getToQuay(page: Page) {
  await page.locator('[data-clue="lamp"]').click();
  await page.locator('[data-clue="crystal"]').click();
  await page.getByRole('button', { name: 'Go to Lower Quay' }).click();
}
async function getToBench(page: Page) {
  await getToQuay(page);
  await page.locator('[data-clue="mara"]').click();
  await page.locator('[data-clue="crew"]').click();
  await page.getByRole('button', { name: 'Try the old bell', exact: true }).click();
  await page.getByRole('button', { name: 'Visit the warning station' }).click();
}
async function seal(page: Page) {
  await page.locator('[data-evidence="lamp"]').click();
  await page.locator('[data-claim-slot="sent"]').click();
  await page.locator('[data-evidence="trial"]').click();
  await page.locator('[data-claim-slot="acted"]').click();
  await page.locator('[data-finish]').click();
  await expect(page.getByRole('heading', { name: 'A token for the next crossing' })).toBeVisible();
}

test('illustrated RPG: investigate, meet Mara, repair and hand over through the actual scenes', async ({ page }, info) => {
  const errors = observe(page);
  const external: string[] = [];
  await page.route('**/*', r => { if (!r.request().url().startsWith('http://127.0.0.1:4173/')) { external.push(r.request().url()); return r.abort(); } return r.continue(); });
  await start(page);
  await page.evaluate(k => localStorage.setItem(k, 'preserved Classic bytes'), classicKey);
  await capture(page, info, 'lantern-house');
  await a11y(page);
  await expect(page.getByRole('button', { name: 'Go to Lower Quay' })).toBeDisabled();
  await page.locator('[data-clue="lamp"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Tower log', exact: true })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Your evidence satchel' })).toContainText('Tower log');
  await page.locator('[data-clue="crystal"]').click();
  await page.getByRole('button', { name: 'Go to Lower Quay' }).click();
  await capture(page, info, 'lower-quay');
  await page.locator('[data-clue="mara"]').click();
  await page.locator('[data-clue="crew"]').click();
  await page.getByRole('button', { name: 'Try the old bell', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The lamp lit. The crew kept loading.' })).toBeVisible();
  await page.getByRole('button', { name: 'Visit the warning station' }).click();
  await page.locator('[data-rehearse]').click();
  expect(replay(await stored(page)).trial?.noticed).toBe(false);
  await page.locator('[data-device="beacon"]').click();
  await page.locator('[data-rehearse]').click();
  expect(replay(await stored(page)).trial?.noticed).toBe(true);
  expect(replay(await stored(page)).trial?.acted).toBe(false);
  await page.locator('[data-meaning="hold"]').click();
  await page.locator('[data-rehearse]').click();
  expect(replay(await stored(page)).trial?.acted).toBe(true);
  await a11y(page);
  await page.locator('[data-evidence="lamp"]').click();
  await page.locator('[data-claim-slot="acted"]').click();
  expect(replay(await stored(page)).pins.acted).toBeUndefined();
  await seal(page);
  await capture(page, info, 'chapter-complete');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A token for the next crossing' })).toBeVisible();
  expect(replay(await stored(page)).complete).toBe(true);
  expect(await page.evaluate(k => localStorage.getItem(k), classicKey)).toBe('preserved Classic bytes');
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chapter', exact: true }).click();
  const file = await promise;
  expect(replay(parseChapterSave(await readFile((await file.path())!, 'utf8'))).complete).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Classic', exact: true }).click();
  await expect(page.locator('.rpg')).toBeVisible();
  await page.goto(route);
  await expect(page.getByRole('heading', { name: 'A token for the next crossing' })).toBeVisible();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('illustrated RPG: alternative lookout, changed evidence, narrow layouts and reading settings', async ({ page }, info) => {
  const errors = observe(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await fits(page);
  await a11y(page);
  await capture(page, info, 'mobile-opening');
  await getToBench(page);
  await page.locator('[data-device="messenger"]').click();
  await page.locator('[data-meaning="wait"]').click();
  await page.locator('[data-rehearse]').click();
  expect(replay(await stored(page)).trial?.acted).toBe(false);
  await page.locator('[data-meaning="hold"]').click();
  await page.locator('[data-rehearse]').click();
  await page.locator('[data-evidence="lamp"]').click();
  await page.locator('[data-claim-slot="sent"]').click();
  await page.locator('[data-device="beacon"]').click();
  expect(replay(await stored(page)).trial).toBeNull();
  expect(replay(await stored(page)).pins).toEqual({});
  await expect(page.locator('[data-evidence="trial"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-device="beacon"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-device="messenger"]').click();
  await page.locator('[data-rehearse]').click();
  await fits(page);
  await a11y(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await fits(page);
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Larger text', { exact: true }).check();
  await page.getByLabel('Reduce motion', { exact: true }).check();
  await a11y(page);
  await page.keyboard.press('Escape');
  await fits(page);
  await seal(page);
  await capture(page, info, 'mobile-complete');
  expect(errors).toEqual([]);
});

test('illustrated RPG: corrupt originals, import confirmation, reset and storage conflict preserve unrelated saves', async ({ page, context }) => {
  const errors = observe(page);
  await start(page);
  await page.evaluate(({ key, classicKey }) => { localStorage.setItem(key, ''); localStorage.setItem(classicKey, 'classic untouched'); localStorage.setItem('unrelated-game', 'other untouched'); }, { key, classicKey });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('preserved');
  await page.locator('[data-clue="lamp"]').click();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('');
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByRole('button', { name: 'Start chapter again', exact: true }).click();
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('');
  await page.getByRole('button', { name: 'Start chapter again', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm new chapter', exact: true }).click();
  await page.locator('[data-clue="lamp"]').click();
  const backup = await stored(page);
  const other = await context.newPage();
  await other.goto(route);
  await expect(other.getByRole('heading', { name: 'Sera’s lantern house', exact: true })).toBeVisible();
  await page.locator('[data-clue="crystal"]').click();
  await expect(other.getByRole('alert')).toContainText('Another tab changed');
  const newer = await stored(page);
  await other.locator('[data-clue="ledger"]').click();
  expect(await stored(page)).toEqual(newer);
  await other.close();
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Import chapter', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  expect(await stored(page)).toEqual(newer);
  await page.getByLabel('Import chapter', { exact: true }).setInputFiles({ name: 'chapter.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: 'Cancel replacement', exact: true }).click();
  expect(await stored(page)).toEqual(newer);
  await page.getByLabel('Import chapter', { exact: true }).setInputFiles({ name: 'chapter.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: 'Replace chapter', exact: true }).click();
  expect(await stored(page)).toEqual(backup);
  expect(await page.evaluate(k => localStorage.getItem(k), classicKey)).toBe('classic untouched');
  expect(await page.evaluate(() => localStorage.getItem('unrelated-game'))).toBe('other untouched');
  expect(errors).toEqual([]);
});

test('illustrated RPG: denied storage still allows discovery and a replayable export', async ({ page }) => {
  const errors = observe(page);
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Storage denied', 'SecurityError'); } }));
  await start(page);
  await expect(page.getByRole('alert')).toContainText('Storage is unavailable');
  await getToQuay(page);
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export chapter', exact: true }).click();
  const file = await promise;
  expect(replay(parseChapterSave(await readFile((await file.path())!, 'utf8'))).place).toBe('quay');
  expect(errors).toEqual([]);
});

test('illustrated RPG: rehearsal controls stay beside the scene and motion has a static equivalent', async ({ page }, info) => {
  const errors = observe(page);
  await start(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await getToQuay(page);
  await page.locator('[data-clue="mara"]').click();
  await page.locator('[data-clue="crew"]').click();
  await page.getByRole('button', { name: 'Try the old bell', exact: true }).click();
  await expect(page.locator('.av-is-running')).toBeVisible();
  expect(await page.locator('.av-working').evaluate(e => getComputedStyle(e).animationName)).toBe('av-work');
  await expect(page.locator('.av-is-running')).toHaveCount(0);
  await page.getByRole('button', { name: 'Visit the warning station' }).click();
  await expect(page.locator('[data-device="beacon"]')).toBeInViewport();
  await expect(page.locator('[data-rehearse]')).toBeInViewport();
  await capture(page, info, 'warning-station');
  await page.locator('[data-device="beacon"]').click();
  await page.locator('[data-meaning="hold"]').click();
  await page.locator('[data-rehearse]').click();
  expect(replay(await stored(page)).trial?.acted).toBe(true);
  await expect(page.locator('.av-is-running')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.av-lantern-glow').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
  await expect(page.getByRole('region', { name: 'Rehearsal observations' })).toContainText('Ferry held');
  expect(errors).toEqual([]);
});
