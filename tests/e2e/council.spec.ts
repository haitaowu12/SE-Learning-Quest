import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { parseChapterSave, saveKey as openingKey } from '../../src/adventure/model.ts';
import { councilSaveKey, freshCouncilSave, parseCouncilSave, replayCouncil } from '../../src/adventure/council/model.ts';
import { recordedOpening } from '../council-helpers.ts';

const path = '/SE-Learning-Quest/';
const route = `${path}#adventure/council`;
const key = councilSaveKey(path);
const oldKey = openingKey(path);

function observe(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}
async function stored(page: Page) {
  return parseCouncilSave((await page.evaluate(k => localStorage.getItem(k), key))!);
}
async function a11y(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, message: n.failureSummary })) }))).toEqual([]);
}
async function fits(page: Page) {
  expect(await page.evaluate(() => { const root = document.querySelector('.adventure')!; return { app: root.scrollWidth - root.clientWidth, body: document.body.scrollWidth - innerWidth }; })).toEqual({ app: 0, body: 0 });
}
async function capture(page: Page, info: TestInfo, name: string) {
  await mkdir('output/asterfall', { recursive: true });
  await page.screenshot({ path: `output/asterfall/council-${info.project.name}-${name}.png` });
}
async function start(page: Page) {
  page.setDefaultTimeout(10_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
}
async function finishOpeningThroughUI(page: Page) {
  await page.goto(`${path}#adventure`);
  await page.locator('[data-clue="lamp"]').click();
  await page.locator('[data-clue="crystal"]').click();
  await page.getByRole('button', { name: 'Go to Lower Quay' }).click();
  await page.locator('[data-clue="mara"]').click();
  await page.locator('[data-clue="crew"]').click();
  await page.getByRole('button', { name: 'Try the old bell', exact: true }).click();
  await page.getByRole('button', { name: 'Visit the warning station' }).click();
  await page.locator('[data-device="beacon"]').click();
  await page.locator('[data-meaning="hold"]').click();
  await page.locator('[data-rehearse]').click();
  await page.locator('[data-evidence="lamp"]').click();
  await page.locator('[data-claim-slot="sent"]').click();
  await page.locator('[data-evidence="trial"]').click();
  await page.locator('[data-claim-slot="acted"]').click();
  await page.locator('[data-finish]').click();
  await expect(page.getByRole('heading', { name: 'A token for the next crossing' })).toBeVisible();
}
async function importOpening(page: Page) {
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'opening-v1.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(recordedOpening('messenger'))) });
  await page.getByRole('button', { name: 'Replace crossing', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The Brass Quarter', exact: true })).toBeVisible();
}
async function enterHearing(page: Page) {
  await page.locator('[data-discovery="roll"]').click();
  await page.locator('[data-discovery="orren"]').click();
  await page.getByRole('button', { name: 'Enter the hearing' }).click();
  // Let scene navigation finish its focus handoff before sending new keyboard
  // input. This asserts the UI's actual focus behavior rather than adding a delay.
  await expect(page.getByRole('heading', { name: 'A chair for the night watch', exact: true })).toBeFocused();
}
async function seat(page: Page, guest: string, chair: string) {
  await page.locator(`[data-guest="${guest}"]`).click();
  await page.locator(`[data-seat="${chair}"]`).click();
}
async function hearing(page: Page, written = false) {
  await seat(page, 'mara', 'left');
  await seat(page, 'tavi', 'middle');
  await page.locator('[data-guest="night"]').click();
  if (written) {
    await seat(page, 'neri', 'right');
    await page.locator('[data-collect-note]').click();
  } else {
    await page.locator('[data-seat="right"]').click();
    await page.locator('[data-relief]').click();
  }
  await page.locator('[data-hear]').click();
  if (written) await page.locator('[data-readback]').click();
}
async function promise(page: Page) {
  await page.getByRole('button', { name: 'Visit Tavi’s atelier' }).click();
  await page.locator('[data-discovery="demo"]').click();
  for (const token of ['inhabited', 'perceivable', 'ninety', 'west40-link-out']) await page.locator(`[data-promise-token="${token}"]`).click();
  await page.locator('[data-review-promise]').click();
  await page.locator('[data-evidence-status="planned"]').click();
}

test('Brass Quarter: fresh two-chapter RPG journey, hearing, target, export and Classic return', async ({ page }, info) => {
  const errors = observe(page);
  const external: string[] = [];
  await page.route('**/*', request => { if (!request.request().url().startsWith('http://127.0.0.1:4173/')) { external.push(request.request().url()); return request.abort(); } return request.continue(); });
  await start(page);
  await expect(page.getByRole('heading', { name: 'Mara’s ferry is waiting' })).toBeVisible();
  await finishOpeningThroughUI(page);
  const original = await page.evaluate(k => localStorage.getItem(k), oldKey);
  await page.locator('[data-continue-council]').click();
  await expect(page.getByRole('heading', { name: 'The Brass Quarter', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter the hearing' })).toBeDisabled();
  await capture(page, info, 'landing');
  await a11y(page);
  await enterHearing(page);
  await page.locator('[data-guest="mara"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-seat="left"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await seat(page, 'tavi', 'middle');
  await seat(page, 'night', 'right');
  await page.locator('[data-hear]').click();
  await expect(page.getByRole('region', { name: 'Accounts still needed' })).toContainText('still on duty');
  await expect(page.getByRole('button', { name: 'Visit Tavi’s atelier' })).toBeDisabled();
  await page.locator('[data-relief]').click();
  await page.locator('[data-hear]').click();
  await page.locator('.av-scene').scrollIntoViewIfNeeded();
  await capture(page, info, 'hearing');
  await a11y(page);
  await promise(page);
  const beforeIncorrectStamp = await stored(page);
  await page.locator('[data-evidence-status="proven"]').click();
  expect(await stored(page)).toEqual(beforeIncorrectStamp);
  await expect(page.getByRole('region', { name: 'Companion dialogue' })).toContainText('did not exercise this field promise');
  await page.getByRole('region', { name: 'Build the warning promise' }).scrollIntoViewIfNeeded();
  await a11y(page);
  await capture(page, info, 'promise');
  await page.locator('[data-sign-target]').click();
  await expect(page.getByRole('region', { name: 'The signed crossing record' })).toContainText('storm tests have not happened');
  expect(replayCouncil(await stored(page)).complete).toBe(true);
  expect((await stored(page)).arrival).toEqual(parseChapterSave(original!));
  expect(await page.evaluate(k => localStorage.getItem(k), oldKey)).toBe(original);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The dispatch archive', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export crossing', exact: true }).click();
  const download = await downloading;
  const exported = parseCouncilSave(await readFile((await download.path())!, 'utf8'));
  expect(replayCouncil(exported).complete).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Chapter one', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A token for the next crossing' })).toBeVisible();
  await page.locator('[data-continue-council]').click();
  await expect(page.getByRole('heading', { name: 'The dispatch archive', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Classic ↗', exact: true }).click();
  await expect(page.locator('.rpg')).toBeVisible();
  await page.goto(route);
  await expect(page.getByRole('heading', { name: 'The dispatch archive', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('Brass Quarter: imported v1 opening, written night account, revised promise and narrow-screen recovery', async ({ page }, info) => {
  const errors = observe(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await importOpening(page);
  const opening = (await stored(page)).arrival;
  expect(opening.actions.some(a => a.type === 'equip' && a.device === 'messenger')).toBe(true);
  expect(await page.evaluate(k => localStorage.getItem(k), oldKey)).toBeNull();
  await enterHearing(page);
  await seat(page, 'tavi', 'left');
  await seat(page, 'neri', 'middle');
  await seat(page, 'mara', 'right');
  await page.locator('[data-hear]').click();
  await expect(page.getByRole('region', { name: 'Accounts still needed' })).toContainText('no night-watch account');
  await page.locator('[data-guest="night"]').click();
  await page.locator('[data-collect-note]').click();
  // A player may also arrange relief while exploring; its incurred delay must
  // stay in the record even when the final hearing uses the written account.
  await page.locator('[data-relief]').click();
  await page.locator('[data-hear]').click();
  await expect(page.getByRole('button', { name: 'Visit Tavi’s atelier' })).toBeDisabled();
  await page.locator('[data-readback]').click();
  await expect(page.getByRole('button', { name: 'Visit Tavi’s atelier' })).toBeEnabled();
  expect(replayCouncil(await stored(page)).relief).toBe(true);
  await fits(page);
  await page.locator('.cq-guests').scrollIntoViewIfNeeded();
  await a11y(page);
  await capture(page, info, 'mobile-hearing');
  await page.getByRole('button', { name: 'Visit Tavi’s atelier' }).click();
  await page.locator('[data-discovery="demo"]').click();
  await page.locator('[data-promise-token="registered"]').click();
  await page.locator('[data-review-promise]').click();
  expect(replayCouncil(await stored(page)).review?.gaps).toHaveLength(4);
  for (const token of ['inhabited', 'perceivable', 'ninety', 'west40-link-out']) await page.locator(`[data-promise-token="${token}"]`).click();
  await page.locator('[data-review-promise]').click();
  await page.locator('[data-evidence-status="planned"]').click();
  await page.locator('[data-promise-token="calm"]').click();
  expect(replayCouncil(await stored(page)).evidenceStatus).toBeNull();
  await expect(page.locator('[data-sign-target]')).toBeDisabled();
  await page.reload();
  await expect(page.locator('[data-promise-token="calm"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-promise-token="west40-link-out"]').click();
  await page.locator('[data-review-promise]').click();
  await page.locator('[data-evidence-status="planned"]').click();
  await page.getByRole('button', { name: '← Hearing', exact: true }).click();
  await page.locator('[data-unseat="right"]').click();
  const changed = replayCouncil(await stored(page));
  expect(changed.readback).toBe(false);
  expect(changed.review).toBeNull();
  await expect(page.getByRole('button', { name: 'Visit Tavi’s atelier' })).toBeDisabled();
  await seat(page, 'mara', 'right');
  await page.locator('[data-hear]').click();
  await page.locator('[data-readback]').click();
  await promise(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Larger text', { exact: true }).check();
  await page.getByLabel('Reduce motion', { exact: true }).check();
  await a11y(page);
  await page.keyboard.press('Escape');
  await fits(page);
  await page.getByRole('region', { name: 'Build the warning promise' }).scrollIntoViewIfNeeded();
  await a11y(page);
  await page.locator('[data-sign-target]').click();
  await expect(page.getByRole('region', { name: 'The signed crossing record' })).toContainText('confirmed the returned sketch');
  await expect(page.getByRole('region', { name: 'The signed crossing record' })).toContainText('delayed the ferry');
  await capture(page, info, 'mobile-complete');
  expect(errors).toEqual([]);
});

test('Brass Quarter: a storage-denied player can cross from the opening and export both histories', async ({ page }) => {
  const errors = observe(page);
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Storage denied', 'SecurityError'); } }));
  await start(page);
  await finishOpeningThroughUI(page);
  await page.locator('[data-continue-council]').click();
  await expect(page.getByRole('heading', { name: 'The Brass Quarter', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Storage is unavailable');
  await enterHearing(page);
  await hearing(page, true);
  await page.getByRole('link', { name: 'Chapter one', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A token for the next crossing' })).toBeVisible();
  await page.locator('[data-continue-council]').click();
  await expect(page.getByRole('button', { name: 'Visit Tavi’s atelier' })).toBeEnabled();
  await page.getByRole('link', { name: 'Classic ↗', exact: true }).click();
  await expect(page.locator('.rpg')).toBeVisible();
  // Change only the hash: route navigation must retain this tab's unsaved
  // crossing. A full browser reload is intentionally outside that promise.
  await page.evaluate(() => { location.hash = '#adventure/council'; });
  await expect(page.getByRole('button', { name: 'Visit Tavi’s atelier' })).toBeEnabled();
  await promise(page);
  await page.locator('[data-sign-target]').click();
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export crossing', exact: true }).click();
  const download = await downloading;
  const exported = parseCouncilSave(await readFile((await download.path())!, 'utf8'));
  expect(replayCouncil(exported).complete).toBe(true);
  expect(exported.arrival.actions.at(-1)?.type).toBe('finish');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('Brass Quarter: invalid imports, stored originals, stale tabs and reset preserve other chapters', async ({ page, context }) => {
  const errors = observe(page);
  await start(page);
  const older = JSON.stringify(recordedOpening());
  await page.evaluate(({ key, oldKey, older }) => { localStorage.setItem(key, '{broken'); localStorage.setItem(oldKey, older); localStorage.setItem('other-game', 'unchanged'); }, { key, oldKey, older });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('original Brass Quarter save is preserved');
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'opening.json', mimeType: 'application/json', buffer: Buffer.from(older) });
  await page.getByRole('button', { name: 'Cancel replacement' }).click();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('{broken');
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'opening.json', mimeType: 'application/json', buffer: Buffer.from(older) });
  await page.getByRole('button', { name: 'Replace crossing', exact: true }).click();
  await page.locator('[data-discovery="roll"]').click();
  const backup = await stored(page);
  const other = await context.newPage();
  await other.goto(route);
  await expect(other.getByRole('heading', { name: 'The Brass Quarter', exact: true })).toBeVisible();
  await page.locator('[data-discovery="orren"]').click();
  await expect(other.getByRole('alert')).toContainText('Another tab changed');
  const newer = await stored(page);
  await other.locator('[data-discovery="orren"]').click();
  expect(await stored(page)).toEqual(newer);
  await other.close();
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'future.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...freshCouncilSave(recordedOpening()), version: 2 })) });
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not a supported Brass Quarter save');
  expect(await stored(page)).toEqual(newer);
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'crossing.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole('button', { name: 'Replace crossing', exact: true }).click();
  expect(await stored(page)).toEqual(backup);
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByRole('button', { name: 'Start this crossing again' }).click();
  await page.getByRole('button', { name: 'Keep playing' }).click();
  expect(await stored(page)).toEqual(backup);
  await page.getByRole('button', { name: 'Start this crossing again' }).click();
  await page.getByRole('button', { name: 'Confirm new crossing' }).click();
  expect((await stored(page)).actions).toEqual([]);
  expect((await stored(page)).arrival).toEqual(backup.arrival);
  expect(await page.evaluate(k => localStorage.getItem(k), oldKey)).toBe(older);
  expect(await page.evaluate(() => localStorage.getItem('other-game'))).toBe('unchanged');
  expect(errors).toEqual([]);
});
