import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { archiveSaveKey, parseArchiveSave, replayArchive } from '../../src/adventure/archive/model.ts';
import { councilSaveKey } from '../../src/adventure/council/model.ts';
import { saveKey as openingKey } from '../../src/adventure/model.ts';
import { completedCouncil } from '../council-helpers.ts';

const path = '/SE-Learning-Quest/';
const route = `${path}#adventure/archive`;
const key = archiveSaveKey(path);
const councilKey = councilSaveKey(path);
const oldKey = openingKey(path);
const scenes = { stacks: 'The old dispatch archive', table: 'Three green marks, four lived addresses', dispatch: 'A packet for Stormglass' };

function observe(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}
async function start(page: Page): Promise<void> {
  page.setDefaultTimeout(10_000); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(route);
}
async function current(page: Page) { return parseArchiveSave((await page.evaluate(k => localStorage.getItem(k), key))!); }
async function importJourney(page: Page, value: unknown): Promise<void> {
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
  await page.getByRole('button', { name: 'Replace archive', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
}
async function exportJourney(page: Page) {
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export archive', exact: true }).click();
  const exported = parseArchiveSave(await readFile((await (await downloading).path())!, 'utf8'));
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  return exported;
}
async function inspectStacks(page: Page): Promise<void> {
  for (const id of ['request', 'roll', 'survey', 'change']) await page.locator(`[data-archive-record="${id}"]`).click();
  await page.getByRole('button', { name: 'Take the records to the table' }).click();
  await expect(page.getByRole('heading', { name: scenes.table, exact: true }).first()).toBeFocused();
  await page.locator('[data-archive-record="tally"]').click();
}
async function pin(page: Page, record: string, slot: string): Promise<void> {
  await page.locator(`[data-archive-source="${record}"]`).click();
  await page.locator(`[data-archive-slot="${slot}"]`).click();
}
async function compare(page: Page): Promise<void> {
  await page.locator('[data-archive-quay="lower"]').click();
  for (const [record, slot] of [['survey', 'population'], ['roll', 'recipients'], ['tally', 'receipts']]) await pin(page, record, slot);
  await page.locator('[data-review-archive-evidence]').click();
  await page.getByRole('button', { name: 'Prepare the Stormglass packet' }).click();
  await expect(page.getByRole('heading', { name: scenes.dispatch, exact: true }).first()).toBeFocused();
}
async function proposal(page: Page, mode: 'amend' | 'rebuild' = 'amend'): Promise<void> {
  await page.locator(`[data-archive-route="${mode}"]`).click();
  for (const address of ['north:NW09', 'lower:LQ07', 'east:EL03', 'crown:CS02']) await page.locator(`[data-archive-address="${address}"]`).click();
  await page.locator('[data-archive-finding="listed-only"]').check();
  await page.locator('[data-review-archive-proposal]').click();
  await page.locator('[data-archive-status="proposed"]').click();
}
async function a11y(page: Page): Promise<void> {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, message: n.failureSummary })) }))).toEqual([]);
}
async function fits(page: Page): Promise<void> {
  expect(await page.evaluate(() => { const root = document.querySelector('.adventure')!; return { app: root.scrollWidth - root.clientWidth, body: document.body.scrollWidth - innerWidth }; })).toEqual({ app: 0, body: 0 });
}
async function capture(page: Page, info: TestInfo, name: string, selector = '.av-scene'): Promise<void> {
  await mkdir('output/asterfall', { recursive: true });
  await page.locator(selector).screenshot({ path: `output/asterfall/archive-${info.project.name}-${name}.png` });
}
async function freshArrival(page: Page): Promise<void> {
  await page.goto(`${path}#adventure`);
  for (const clue of ['lamp', 'crystal']) await page.locator(`[data-clue="${clue}"]`).click();
  await page.getByRole('button', { name: 'Go to Lower Quay' }).click();
  for (const clue of ['mara', 'crew']) await page.locator(`[data-clue="${clue}"]`).click();
  await page.getByRole('button', { name: 'Try the old bell', exact: true }).click();
  await page.getByRole('button', { name: 'Visit the warning station' }).click();
  await page.locator('[data-device="messenger"]').click(); await page.locator('[data-meaning="hold"]').click(); await page.locator('[data-rehearse]').click();
  for (const [source, claim] of [['lamp', 'sent'], ['trial', 'acted']]) {
    await page.locator(`[data-evidence="${source}"]`).click(); await page.locator(`[data-claim-slot="${claim}"]`).click();
  }
  await page.locator('[data-finish]').click(); await page.locator('[data-continue-council]').click();
  await page.locator('[data-discovery="roll"]').click(); await page.locator('[data-discovery="orren"]').click();
  await page.getByRole('button', { name: 'Enter the hearing' }).click();
  await expect(page.getByRole('heading', { name: 'A chair for the night watch', exact: true })).toBeFocused();
  for (const [guest, seat] of [['mara', 'left'], ['tavi', 'middle'], ['night', 'right']]) {
    await page.locator(`[data-guest="${guest}"]`).click(); await page.locator(`[data-seat="${seat}"]`).click();
  }
  await page.locator('[data-relief]').click(); await page.locator('[data-hear]').click();
  await page.getByRole('button', { name: 'Visit Tavi’s atelier' }).click(); await page.locator('[data-discovery="demo"]').click();
  for (const token of ['inhabited', 'perceivable', 'ninety', 'west40-link-out']) await page.locator(`[data-promise-token="${token}"]`).click();
  await page.locator('[data-review-promise]').click(); await page.locator('[data-evidence-status="planned"]').click(); await page.locator('[data-sign-target]').click();
  await page.getByRole('button', { name: 'Enter the dispatch archive', exact: true }).click();
  await expect(page.getByRole('heading', { name: scenes.stacks, exact: true })).toBeVisible();
}

test('Archive: fresh three-chapter journey, amendment, receipt boundary and portable history', async ({ page }, info) => {
  const errors = observe(page), external: string[] = [];
  await page.route('**/*', request => { if (!request.request().url().startsWith('http://127.0.0.1:4173/')) { external.push(request.request().url()); return request.abort(); } return request.continue(); });
  await start(page); await expect(page.getByRole('heading', { name: 'Neri needs the reading seal' })).toBeVisible();
  await freshArrival(page);
  const originals = await page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [oldKey, councilKey]);
  await capture(page, info, 'stacks'); await a11y(page); await inspectStacks(page);
  await page.getByRole('button', { name: 'Survey’s inhabitants', exact: true }).click();
  await expect(page.locator('[data-archive-quay="lower"]')).toContainText('Inhabited · LQ07');
  await capture(page, info, 'table'); await compare(page); await proposal(page);
  const before = await current(page);
  await page.locator('[data-archive-status="approved"]').click();
  expect(await current(page)).toEqual(before);
  await expect(page.getByRole('region', { name: 'Companion dialogue' })).toContainText('authorizes reading');
  await capture(page, info, 'dispatch'); await capture(page, info, 'proposal', '.ar-proposal'); await a11y(page);
  await page.locator('[data-finish-archive]').click();
  await expect(page.getByRole('heading', { name: 'Toward Stormglass', exact: true })).toBeVisible();
  const finished = await current(page); expect(replayArchive(finished).complete).toBe(true);
  expect(JSON.stringify(finished.arrival)).toBe(originals[1]);
  expect(await page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [oldKey, councilKey])).toEqual(originals);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Toward Stormglass', exact: true })).toBeVisible();
  expect(await exportJourney(page)).toEqual(finished);
  await page.getByRole('link', { name: 'Brass Quarter', exact: true }).click();
  await page.getByRole('button', { name: 'Enter the dispatch archive', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Toward Stormglass', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Classic ↗', exact: true }).click();
  await page.waitForURL('**/#classic'); await page.evaluate(() => { location.hash = '#adventure/archive'; });
  await expect(page.getByRole('heading', { name: 'Toward Stormglass', exact: true })).toBeVisible();
  expect(await current(page)).toEqual(finished); expect(errors).toEqual([]); expect(external).toEqual([]);
});

test('Archive: old crossing import, rebuild, incorrect sources, obsolete address and revised evidence', async ({ page }) => {
  const errors = observe(page); await start(page); const arrival = completedCouncil('written'); await importJourney(page, arrival);
  await inspectStacks(page); await page.locator('[data-archive-quay="crown"]').click();
  await pin(page, 'roll', 'population'); await pin(page, 'change', 'recipients'); await page.locator('[data-review-archive-evidence]').click();
  await expect(page.locator('.ar-feedback')).toContainText('Crown Steps appears');
  await expect(page.getByRole('button', { name: 'Prepare the Stormglass packet' })).toBeDisabled();
  await compare(page); await proposal(page, 'rebuild');
  await page.locator('[data-archive-address="north:NW04"]').click(); await page.locator('[data-archive-finding="all-warned"]').check();
  await page.locator('[data-review-archive-proposal]').click();
  await expect(page.locator('.ar-feedback')).toContainText('NW04 was superseded');
  await expect(page.locator('.ar-feedback')).toContainText('neither a perceived local warning');
  await expect(page.locator('[data-finish-archive]')).toBeDisabled();
  await proposal(page, 'rebuild');
  await page.getByRole('button', { name: '← Comparison table', exact: true }).click();
  await page.locator('[data-archive-quay="north"]').click();
  await expect(page.getByRole('button', { name: 'Prepare the Stormglass packet' })).toBeDisabled();
  await compare(page); await expect(page.locator('[data-finish-archive]')).toBeDisabled();
  await page.reload(); await expect(page.getByRole('region', { name: 'Open source record' })).toContainText('North Watch NW09');
  await page.locator('[data-review-archive-proposal]').click(); await page.locator('[data-archive-status="proposed"]').click(); await page.locator('[data-finish-archive]').click();
  const finished = await current(page); expect(finished.arrival).toEqual(arrival); expect(replayArchive(finished).route).toBe('rebuild');
  await page.getByRole('button', { name: 'Read your three-chapter journal' }).click();
  await expect(page.getByRole('dialog')).toContainText('signed night-watch account'); await a11y(page);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByRole('button', { name: 'Start this investigation again' }).click(); await page.getByRole('button', { name: 'Keep playing' }).click();
  expect(await current(page)).toEqual(finished);
  await page.getByRole('button', { name: 'Start this investigation again' }).click(); await page.getByRole('button', { name: 'Confirm new archive' }).click();
  expect((await current(page)).arrival).toEqual(arrival); expect((await current(page)).actions).toEqual([]); expect(errors).toEqual([]);
});

test('Archive: keyboard evidence placement, small screens, larger text and source visibility on reload', async ({ page }, info) => {
  const errors = observe(page); await start(page); await importJourney(page, completedCouncil());
  for (const width of [390, 320]) { await page.setViewportSize({ width, height: 900 }); await fits(page); }
  await a11y(page); await inspectStacks(page);
  await page.locator('[data-archive-source="survey"]').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('[data-archive-slot="population"]')).toBeFocused(); await page.keyboard.press('Enter');
  await expect(page.locator('[data-archive-slot="population"]')).toContainText('Four inhabited quays');
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Larger text', { exact: true }).check(); await page.getByRole('button', { name: 'Close dialog' }).click();
  await fits(page); await a11y(page); await capture(page, info, 'mobile-table', '.ar-comparison');
  await compare(page); await proposal(page, 'rebuild'); await fits(page); await a11y(page); await capture(page, info, 'mobile-proposal', '.ar-proposal');
  await page.reload(); await expect(page.getByRole('region', { name: 'Open source record' })).toContainText('LQ07');
  expect(await page.evaluate(() => {
    const source = document.querySelector('.ar-current-source')!, workbench = document.querySelector('.ar-proposal')!;
    return !!(source.compareDocumentPosition(workbench) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  await fits(page); expect(errors).toEqual([]);
});

test('Archive: corrupt originals, visible import rejection, confirmation and stale-tab recovery', async ({ page, context }) => {
  const errors = observe(page); await page.addInitScript(({ key, crossingKey, arrival }) => {
    if (!sessionStorage.getItem('archive-corrupt-seeded')) { localStorage.setItem(key, '{broken'); localStorage.setItem(crossingKey, arrival); sessionStorage.setItem('archive-corrupt-seeded', 'yes'); }
  }, { key, crossingKey: councilKey, arrival: JSON.stringify(completedCouncil()) });
  await start(page); await expect(page.getByRole('alert').first()).toContainText('preserved');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('{broken');
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('not valid JSON');
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'crossing.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(completedCouncil())) });
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveCount(0);
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('{broken');
  await page.getByRole('button', { name: 'Cancel replacement' }).click(); expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('{broken');
  await page.getByRole('button', { name: 'Close dialog' }).click(); await importJourney(page, completedCouncil());
  const other = await context.newPage(); await other.goto(route); await other.locator('[data-archive-record="survey"]').click();
  const newer = await other.evaluate(k => localStorage.getItem(k), key);
  await expect(page.getByRole('alert').first()).toContainText('Another tab changed');
  await page.locator('[data-archive-record="roll"]').click(); expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(newer);
  await page.getByRole('link', { name: 'Brass Quarter', exact: true }).click(); await page.getByRole('button', { name: 'Enter the dispatch archive', exact: true }).click();
  await expect(page.locator('[data-archive-record="roll"]')).toContainText('Read');
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click(); await page.getByRole('button', { name: 'Load stored archive', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Replace archive confirmation' })).toBeVisible();
  await page.getByRole('button', { name: 'Replace archive', exact: true }).click();
  expect((await current(page)).actions).toEqual([{ type: 'inspect', record: 'survey' }]);
  await other.close(); expect(errors).toEqual([]);
});

test('Archive: denied-storage continuation survives all chapter routes and Classic in the same tab', async ({ page }) => {
  const errors = observe(page); await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Denied', 'SecurityError'); } }));
  await start(page); await page.getByRole('link', { name: 'Return to the Brass Quarter' }).click();
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'crossing.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(completedCouncil('written'))) });
  await page.getByRole('button', { name: 'Replace crossing', exact: true }).click();
  await page.getByRole('button', { name: 'Enter the dispatch archive', exact: true }).click();
  await inspectStacks(page); await compare(page); await proposal(page); const before = await exportJourney(page);
  for (const target of ['#adventure/council', '#adventure', '#classic', '#adventure/council']) {
    await page.evaluate(hash => { location.hash = hash; }, target); await page.waitForURL(`**/${target}`);
    await expect(page.locator('.archive')).toHaveCount(0);
    await page.evaluate(() => { location.hash = '#adventure/archive'; });
    await expect(page.getByRole('heading', { name: scenes.dispatch, exact: true }).first()).toBeVisible();
    await expect(page.locator('[data-finish-archive]')).toBeEnabled();
  }
  expect(await exportJourney(page)).toEqual(before);
  await page.locator('[data-finish-archive]').click(); expect(replayArchive(await exportJourney(page)).complete).toBe(true);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Neri needs the reading seal' })).toBeVisible();
  expect(errors).toEqual([]);
});