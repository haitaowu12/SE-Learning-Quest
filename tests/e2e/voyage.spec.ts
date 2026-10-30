import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { archiveSaveKey, parseArchiveSave } from '../../src/adventure/archive/model.ts';
import { scenes } from '../../src/adventure/voyage/content.ts';
import { dispatchVoyage, freshVoyageSave, parseVoyageSave, replayVoyage, voyageSaveKey } from '../../src/adventure/voyage/model.ts';
import type { VoyageSave } from '../../src/adventure/voyage/types.ts';
import { completedArchive, proposedArchive } from '../archive-helpers.ts';
import { atScene, completedVoyage, freshTestVoyage, readyScene, solutionActions } from '../voyage-helpers.ts';
import type { RouteOptions } from '../voyage-helpers.ts';
const path = '/SE-Learning-Quest/', route = `${path}#adventure/voyage`, key = voyageSaveKey(path);
async function settings(page: Page) { await page.getByRole('button', { name: 'Save & settings', exact: true }).click(); }
async function file(page: Page, value: unknown) { await page.getByLabel('Import journey', { exact: true }).setInputFiles({ name: 'journey.json', mimeType: 'application/json', buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)) }); }
async function install(page: Page, value: unknown) {
  if (!page.url().includes('#adventure/voyage')) await page.goto(route);
  await settings(page); await file(page, value);
  await page.getByRole('button', { name: 'Replace journey', exact: true }).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.locator('h1')).toBeFocused();
}
async function current(page: Page) { return parseVoyageSave((await page.evaluate(k => localStorage.getItem(k), key))!); }
async function exportSave(page: Page): Promise<VoyageSave> {
  await settings(page); const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export journey', exact: true }).click();
  const saved = parseVoyageSave(await readFile((await (await waiting).path())!, 'utf8'));
  await page.getByRole('button', { name: 'Close dialog' }).click(); return saved;
}
async function fits(page: Page) {
  expect(await page.evaluate(() => { const root = document.querySelector('.voyage')!; return Math.max(root.scrollWidth - root.clientWidth, document.body.scrollWidth - innerWidth); })).toBe(0);
}
async function a11y(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, message: n.failureSummary })) }))).toEqual([]);
}
async function capture(page: Page, info: TestInfo, name: string, selector = '.vy-workbench') {
  await mkdir('output/asterfall', { recursive: true });
  // Keep the tested width, but let a tall component fit inside its scrolling ancestor for an uncropped evidence image.
  const viewport = page.viewportSize()!;
  const box = await page.locator(selector).boundingBox();
  try {
    if (box && box.height + 180 > viewport.height) await page.setViewportSize({ width: viewport.width, height: Math.ceil(box.height + 180) });
    await page.locator(selector).screenshot({ path: `output/asterfall/voyage-${info.project.name}-${name}.png` });
  } finally { await page.setViewportSize(viewport); }
}
async function solve(page: Page, save: VoyageSave, options: RouteOptions = {}) {
  const scene = scenes[replayVoyage(save).index];
  for (const action of solutionActions(save, options)) {
    if (action.type === 'choose') {
      if (scene.kind === 'connect') { await page.locator(`[data-voyage-tile="${action.tile}"]`).click(); await page.locator(`[data-voyage-socket="${action.socket}"]`).click(); }
      else await page.locator(`[data-voyage-choice="${action.socket}:${action.tile}"]`).click();
    } else if (action.type === 'move') await page.locator(`[data-voyage-card="${action.tile}"] [data-direction="${action.direction}"]`).click();
    else if (action.type === 'allocate') {
      const old = replayVoyage(save).records.at(-1)!.allocations[action.role] ?? 0;
      for (let i = 0; i < Math.abs(action.amount - old); i++) {
        await page.locator(`[data-voyage-allocate="${action.role}:${action.amount > old ? 'up' : 'down'}"]`).click();
        save = dispatchVoyage(save, { ...action, amount: old + Math.sign(action.amount - old) * (i + 1) });
      }
      continue;
    } else if (action.type === 'run') await page.locator(`[data-voyage-run="${action.caseId}"]`).click();
    else if (action.type === 'review') await page.locator('[data-voyage-review]').click();
    save = dispatchVoyage(save, action);
  }
  await expect(page.locator('[data-voyage-seal]')).toBeEnabled(); return save;
}
async function seal(page: Page, save: VoyageSave) {
  await page.locator('[data-voyage-seal]').click(); save = dispatchVoyage(save, { type: 'seal' });
  await expect(page.locator('h1')).toHaveText(replayVoyage(save).complete ? 'The next keeper has a future' : scenes[replayVoyage(save).index].title);
  await expect(page.locator('h1')).toBeFocused(); return save;
}
async function finishArchive(page: Page) {
  for (const id of ['request', 'roll', 'survey', 'change']) await page.locator(`[data-archive-record="${id}"]`).click();
  await page.getByRole('button', { name: 'Take the records to the table' }).click();
  await page.locator('[data-archive-record="tally"]').click(); await page.locator('[data-archive-quay="lower"]').click();
  for (const [record, slot] of [['survey', 'population'], ['roll', 'recipients'], ['tally', 'receipts']]) {
    await page.locator(`[data-archive-source="${record}"]`).click(); await page.locator(`[data-archive-slot="${slot}"]`).click();
  }
  await page.locator('[data-review-archive-evidence]').click(); await page.getByRole('button', { name: 'Prepare the Stormglass packet' }).click();
  await page.locator('[data-archive-route="amend"]').click();
  for (const address of ['north:NW09', 'lower:LQ07', 'east:EL03', 'crown:CS02']) await page.locator(`[data-archive-address="${address}"]`).click();
  await page.locator('[data-archive-finding="listed-only"]').check(); await page.locator('[data-review-archive-proposal]').click();
  await page.locator('[data-archive-status="proposed"]').click(); await page.locator('[data-finish-archive]').click();
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
  await expect(page.getByRole('heading', { name: 'The old dispatch archive', exact: true })).toBeVisible();
}

test('Voyage: fresh seven-chapter journey, visual states, accessible boards and portable ending', async ({ page }, info) => {
  test.setTimeout(240_000);
  const errors: string[] = [], external: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/*', request => { if (!request.request().url().startsWith('http://127.0.0.1:4173/')) { external.push(request.request().url()); return request.abort(); } return request.continue(); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await freshArrival(page); await finishArchive(page);
  const archive = parseArchiveSave((await page.evaluate(k => localStorage.getItem(k), archiveSaveKey(path)))!);
  await page.locator('[data-continue-voyage]').click();
  let save = freshVoyageSave(archive); const checked = new Set<string>();
  await expect(page.locator('h1')).toHaveText(scenes[0].title);
  await expect(page.locator('[data-voyage-sera-ashore]')).toHaveCount(0);
  await expect(page.locator('[data-voyage-shelter]')).toHaveCount(0);
  await capture(page, info, 'arrival', '.vy-scene-frame');
  while (!replayVoyage(save).complete) {
    const scene = scenes[replayVoyage(save).index];
    save = await solve(page, save);
    if (!checked.has(scene.kind)) { await fits(page); await a11y(page); await capture(page, info, scene.kind); checked.add(scene.kind); }
    if (scene.id === 'relief') await expect(page.locator('[data-voyage-sera-ashore]')).toHaveCount(0);
    if (scene.id === 'outage') { await expect(page.locator('[data-voyage-sera-ashore]')).toHaveCount(1); await expect(page.locator('[data-voyage-sera-onboard]')).toHaveCount(0); await expect(page.locator('[data-voyage-failed-joint]')).toHaveCount(1); await expect(page.locator('[data-voyage-shelter]')).toHaveCount(0); }
    if (scene.id === 'shelter') { await expect(page.locator('[data-voyage-failed-joint]')).toHaveCount(0); await expect(page.locator('[data-voyage-shelter]')).toHaveCount(1); }
    if (scene.id === 'inheritance') { await expect(page.locator('[data-voyage-old-core]')).toHaveAttribute('data-status', 'holding'); await expect(page.locator('[data-voyage-core-exhibit]')).toHaveCount(0); await expect(page.locator('[data-voyage-recovered-core]')).toHaveCount(0); }
    save = await seal(page, save);
  }
  expect(await current(page)).toEqual(save); await expect(page.locator('.vy-charter')).toContainText('five inhabited quays');
  await expect(page.locator('[data-voyage-old-core]')).toHaveAttribute('data-status', 'exhibit'); await expect(page.locator('[data-voyage-core-exhibit]')).toHaveCount(1);
  await expect(page.locator('[data-voyage-sera-ashore]')).toHaveCount(1);
  await capture(page, info, 'ending', '.vy-ending'); await a11y(page); await fits(page);
  expect(await exportSave(page)).toEqual(save); await page.reload(); await expect(page.locator('h1')).toHaveText('The next keeper has a future');
  await page.getByRole('button', { name: 'Journey journal', exact: true }).click();
  await expect(page.locator('dialog')).toContainText('Chapters one to three'); await page.keyboard.press('Escape');
  expect(errors).toEqual([]); expect(external).toEqual([]);
});

test('Voyage: alternative routes produce their actual service and retirement obligations', async ({ page }) => {
  const options: RouteOptions = { route: 'lookouts', warning: 'lookout', fallback: 'posts', change: 'parallel', governance: 'office', support: 'local', legacy: 'recover' };
  await install(page, completedArchive('rebuild')); let save = await current(page);
  while (!replayVoyage(save).complete) save = await seal(page, await solve(page, save, options));
  const charter = page.locator('.vy-charter');
  for (const text of ['staffed north relay chain', 'additional handovers', 'parallel module', 'harbour service lead', 'local maintainers', 'parts', '1 token remains']) await expect(charter).toContainText(text);
  await expect(page.locator('[data-voyage-old-core]')).toHaveAttribute('data-status', 'recovered'); await expect(page.locator('[data-voyage-recovered-core]')).toHaveCount(1); await expect(page.locator('[data-voyage-core-exhibit]')).toHaveCount(0);
  expect((await exportSave(page)).arrival).toEqual(completedArchive('rebuild'));
});
test('Voyage: receiver replay, local night failure and evidence invalidation are observable', async ({ page }) => {
  await install(page, atScene('receiver'));
  await page.locator('[data-voyage-choice="controller:v1"]').click();
  await page.locator('[data-voyage-run="valid"]').click(); await expect(page.locator('.vy-observations')).toContainText('Expected response observed');
  await page.locator('[data-voyage-run="replay"]').click(); await expect(page.locator('.vy-observations')).toContainText('Expired order accepted again');
  await page.locator('[data-voyage-choice="controller:v2"]').click(); await expect(page.locator('.vy-observations')).toHaveCount(0);
  await page.locator('[data-voyage-run="replay"]').click(); await expect(page.locator('.vy-observations')).toContainText('Expired order rejected');
  await expect(page.locator('.vy-observations')).toContainText('Perception: not observed');
  await install(page, atScene('warning'));
  await page.locator('[data-voyage-choice="warning:exposed"]').click(); await page.locator('[data-voyage-run="night"]').click();
  const lower = page.locator('.vy-observation').filter({ hasText: 'Lower Quay' });
  await expect(lower).toContainText('Packet: accepted'); await expect(lower).toContainText('Crew did not see');
  await page.locator('[data-voyage-choice="warning:beacon"]').click();
  const save = await solve(page, await current(page)); await expect(page.locator('[data-voyage-seal]')).toBeEnabled();
  await page.locator('[data-voyage-choice="warning:lookout"]').click();
  await expect(page.locator('[data-voyage-seal]')).toBeDisabled(); await expect(page.locator('.vy-observations')).toHaveCount(0);
  expect(replayVoyage(await current(page)).records.at(-1)!.review).toBeNull();
  expect(replayVoyage(save).records.at(-1)!.runs).toHaveLength(3);
});

test('Voyage: an outage cannot claim a packet path that was never built', async ({ page }) => {
  await install(page, atScene('outage', { route: 'lookouts' }));
  await page.locator('[data-voyage-choice="fault:west-joint"]').click(); await page.locator('[data-voyage-choice="route:east"]').click();
  await page.locator('[data-voyage-review]').click(); await expect(page.locator('.vy-review-result')).toContainText('east detour belongs to the diverse');
  await expect(page.locator('[data-voyage-seal]')).toBeDisabled();
  await page.locator('[data-voyage-choice="route:north"]').click(); await page.locator('[data-voyage-review]').click();
  await expect(page.locator('[data-voyage-seal]')).toBeEnabled();
});

test('Voyage: winter observations retain the omitted shelter in the denominator', async ({ page }, info) => {
  await install(page, atScene('winter'));
  await page.locator('[data-voyage-choice="scope:four"]').click(); await page.locator('[data-voyage-run="winter"]').click();
  await expect(page.locator('.vy-observation')).toHaveCount(5);
  await expect(page.locator('.vy-observation').filter({ hasText: 'Drift Quay' })).toContainText('No addressed warning');
  await page.locator('[data-voyage-review]').click(); await expect(page.locator('[data-voyage-seal]')).toBeDisabled();
  await solve(page, await current(page)); await capture(page, info, 'five-quay-trial');
  await expect(page.locator('.vy-observation').filter({ hasText: 'Drift Quay' })).toContainText('Crew holds');
});

for (const width of [390, 320]) test(`Voyage: ${width}px boards, keyboard and larger text remain usable`, async ({ page }, info) => {
  test.setTimeout(240_000); await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const id of ['authority', 'routes', 'interfaces', 'build', 'warning', 'stewardship']) {
    const saved = atScene(id); if (width === 320) saved.settings.largeText = true;
    await install(page, saved); await fits(page);
    if (id === 'interfaces') {
      const tile = page.locator('[data-voyage-tile="signed"]'); await tile.focus(); await page.keyboard.press('Enter');
      await expect(page.locator('[data-voyage-socket="order"]')).toBeFocused(); await page.keyboard.press('Enter');
      await expect(page.locator('[data-voyage-socket="order"]')).toContainText('Signed V2');
    }
    const ready = await solve(page, await current(page)); await fits(page); await a11y(page);
    await capture(page, info, `${width}-${id}`);
    if (id === 'build') { await page.locator('[data-voyage-card="assemble"] [data-direction="up"]').focus(); await page.keyboard.press('Enter'); await expect(page.locator('[data-voyage-seal]')).toBeDisabled(); }
    if (id === 'stewardship') { await page.locator('[data-voyage-allocate="watch:down"]').focus(); await page.keyboard.press('Enter'); await page.locator('[data-voyage-review]').click(); await expect(page.locator('.vy-review-result')).toContainText('Watch coverage'); }
    expect(replayVoyage(ready).complete).toBe(false);
  }
  const end = completedVoyage(); end.settings.largeText = width === 320;
  await install(page, end); await fits(page); await a11y(page); await capture(page, info, `${width}-ending`, '.vy-ending');
  await expect(page.getByRole('link', { name: 'Classic' })).toBeVisible();
});

test('Voyage: import guards, cancellation and restart preserve the actual history', async ({ page }) => {
  const saved = readyScene(atScene('routes')); await install(page, saved);
  await settings(page); await file(page, '{bad'); await expect(page.locator('dialog')).toContainText('not valid JSON');
  await file(page, proposedArchive()); await expect(page.locator('dialog')).toContainText('Seal the archive');
  await file(page, completedVoyage()); await expect(page.getByRole('button', { name: 'Replace journey', exact: true })).toBeVisible();
  await page.keyboard.press('Escape'); expect(await current(page)).toEqual(saved);
  await settings(page); await page.getByRole('button', { name: 'Start another continuation' }).click();
  await page.getByRole('button', { name: 'Keep playing' }).click(); expect(await current(page)).toEqual(saved);
  await page.getByRole('button', { name: 'Start another continuation' }).click(); await page.getByRole('button', { name: 'Confirm new continuation' }).click();
  expect((await current(page)).arrival).toEqual(saved.arrival); expect((await current(page)).actions).toEqual([]);
});

test('Voyage: malformed original can be exported before an explicit replacement', async ({ page }) => {
  await page.goto(route); await page.evaluate(k => localStorage.setItem(k, '{broken-original'), key); await page.reload();
  await expect(page.locator('.av-notice')).toContainText('original journey is preserved');
  await settings(page); const waiting = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export original stored copy' }).click();
  expect(await readFile((await (await waiting).path())!, 'utf8')).toBe('{broken-original');
  await file(page, freshTestVoyage()); await page.getByRole('button', { name: 'Cancel replacement' }).click(); await page.keyboard.press('Escape');
  await expect(page.locator('.av-notice')).toContainText('original journey is preserved');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('{broken-original');
  await install(page, freshTestVoyage()); expect(await current(page)).toEqual(freshTestVoyage());
});

test('Voyage: blocked storage survives route changes and exports the tab history', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied for acceptance'); } }); });
  await install(page, atScene('routes')); await page.locator('[data-voyage-choice="route:lookouts"]').click();
  const saved = await exportSave(page);
  await page.getByRole('link', { name: 'Classic' }).click(); await expect(page.locator('.voyage')).toHaveCount(0);
  await page.evaluate(() => { location.hash = 'adventure/voyage'; }); await expect(page.locator('h1')).toHaveText('Two ways around the squall');
  await expect(page.locator('[data-voyage-choice="route:lookouts"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await exportSave(page)).toEqual(saved);
  await settings(page); await file(page, freshTestVoyage()); await page.keyboard.press('Escape');
  await expect(page.locator('.av-notice')).toContainText('export before');
});

test('Voyage: changed tabs pause writes and require an explicit reconciliation', async ({ page, context }) => {
  await install(page, atScene('routes')); const other = await context.newPage(); await other.goto(route);
  await expect(other.locator('h1')).toHaveText('Two ways around the squall'); await expect(other.locator('h1')).toBeFocused();
  await page.locator('[data-voyage-choice="route:lookouts"]').click();
  const persisted = await page.evaluate(k => localStorage.getItem(k), key);
  await expect(other.locator('.av-notice')).toContainText('Another tab changed');
  await other.locator('[data-voyage-choice="route:diverse"]').click();
  expect(await other.evaluate(k => localStorage.getItem(k), key)).toBe(persisted);
  expect((await exportSave(other)).actions.at(-1)).toEqual({ type: 'choose', socket: 'route', tile: 'diverse' });
  await settings(other); await other.getByRole('button', { name: 'Load stored journey' }).click();
  await other.getByRole('button', { name: 'Replace journey', exact: true }).click();
  await expect(other.locator('[data-voyage-choice="route:lookouts"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(other.locator('.av-notice')).toHaveCount(0); await other.close();
});
