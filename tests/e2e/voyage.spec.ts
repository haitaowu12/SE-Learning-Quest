import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { archiveSaveKey } from '../../src/adventure/archive/model.ts';
import { scenes } from '../../src/adventure/voyage/content.ts';
import { dispatchVoyage, freshVoyageSave, parseVoyageSave, replayVoyage, voyageSaveKey } from '../../src/adventure/voyage/model.ts';
import type { VoyageSave } from '../../src/adventure/voyage/types.ts';
import { completedArchive, proposedArchive } from '../archive-helpers.ts';
import { solutionActions } from '../voyage-helpers.ts';

const path = '/SE-Learning-Quest/';
const route = `${path}#adventure/voyage`;
const key = voyageSaveKey(path);
const archiveKey = archiveSaveKey(path);

async function upload(page: Page, value: unknown): Promise<void> {
  await page.getByLabel('Import journey', { exact: true }).setInputFiles({
    name: 'journey.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)),
  });
}

async function exportJourney(page: Page): Promise<VoyageSave> {
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export journey', exact: true }).click();
  const save = parseVoyageSave(await readFile((await (await downloading).path())!, 'utf8'));
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  return save;
}

// The solution helper supplies choices, but every action below goes through the
// rendered controls. No continuation actions are injected into browser storage.
async function playScene(page: Page, save: VoyageSave): Promise<VoyageSave> {
  const scene = scenes[replayVoyage(save).index];
  await expect(page.getByRole('heading', { name: scene.title, exact: true })).toBeVisible();
  for (const action of solutionActions(save)) {
    if (action.type === 'choose') {
      if (scene.kind === 'connect') {
        await page.locator(`[data-voyage-tile="${action.tile}"]`).click();
        await page.locator(`[data-voyage-socket="${action.socket}"]`).click();
      } else await page.locator(`[data-voyage-choice="${action.socket}:${action.tile}"]`).click();
    } else if (action.type === 'move') {
      await page.locator(`[data-voyage-card="${action.tile}"] [data-direction="${action.direction}"]`).click();
    } else if (action.type === 'allocate') {
      for (let i = 0; i < action.amount; i++) await page.locator(`[data-voyage-allocate="${action.role}:up"]`).click();
    } else if (action.type === 'run') {
      await page.locator(`[data-voyage-run="${action.caseId}"]`).click();
      await expect(page.getByRole('region', { name: 'Exercise observations' })).toBeVisible();
    } else if (action.type === 'review') await page.locator('[data-voyage-review]').click();
    save = dispatchVoyage(save, action);
  }
  await expect(page.locator('[data-voyage-seal]')).toBeEnabled();
  await page.locator('[data-voyage-seal]').click();
  return dispatchVoyage(save, { type: 'seal' });
}

test('Voyage: direct navigation mounts the gated continuation and keeps archive access', async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole('heading', { name: 'Bring the archive packet' })).toBeVisible();
  await expect(page).toHaveTitle('Asterfall · The Last Relay · Illustrated RPG');
  await expect(page.locator('body')).toHaveAttribute('data-app', 'adventure');
  await page.getByRole('link', { name: 'Return to the archive' }).click();
  await expect(page.getByRole('heading', { name: 'Neri needs the reading seal' })).toBeVisible();
});

test('Voyage: sealed archive continues through all sixteen rendered scenes and survives reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const archive = completedArchive();
  const original = JSON.stringify(archive);
  await page.goto(`${path}#adventure/archive`);
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: archiveKey, raw: original });
  await page.reload();
  await page.getByRole('button', { name: 'Sail to Stormglass' }).click();
  await expect(page).toHaveURL(new RegExp('#adventure/voyage$'));
  let save = freshVoyageSave(archive);
  for (let i = 0; i < 16; i++) save = await playScene(page, save);
  await expect(page.getByRole('heading', { name: 'The next keeper has a future' })).toBeVisible();
  expect(await exportJourney(page)).toEqual(save);
  expect(replayVoyage(save).records.filter(record => record.sealed)).toHaveLength(16);
  expect(await page.evaluate(k => localStorage.getItem(k), archiveKey)).toBe(original);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Completed journey' })).toBeVisible();
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'Sail to Stormglass' }).click();
  await expect(page.getByRole('region', { name: 'Completed journey' })).toBeVisible();
  expect(await exportJourney(page)).toEqual(save);
  expect(errors).toEqual([]);
});

test('Voyage: incomplete archive cannot bypass entry and valid replacement requires confirmation', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await upload(page, proposedArchive());
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Seal the archive');
  await expect(page.getByRole('button', { name: 'Replace journey', exact: true })).toHaveCount(0);
  await upload(page, completedArchive());
  await expect(page.getByRole('region', { name: 'Replace journey confirmation' })).toBeVisible();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
  await page.getByRole('button', { name: 'Cancel replacement' }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('heading', { name: 'Bring the archive packet' })).toBeVisible();
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await upload(page, completedArchive());
  await page.getByRole('button', { name: 'Replace journey', exact: true }).click();
  await expect(page.getByRole('heading', { name: scenes[0].title, exact: true })).toBeVisible();
  expect((await exportJourney(page)).arrival).toEqual(completedArchive());
});

test('Voyage: denied-storage archive transition carries the packet and preserves tab progress', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
    configurable: true, get() { throw new DOMException('Denied', 'SecurityError'); },
  }));
  await page.goto(`${path}#adventure/archive`);
  await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
  await upload(page, completedArchive());
  await page.getByRole('button', { name: 'Replace archive', exact: true }).click();
  await page.getByRole('button', { name: 'Sail to Stormglass' }).click();
  await expect(page.getByRole('heading', { name: scenes[0].title, exact: true })).toBeVisible();
  await page.locator('[data-voyage-choice="authority:c18"]').click();
  const before = await exportJourney(page);
  expect(before.arrival).toEqual(completedArchive());
  expect(before.actions).toEqual([{ type: 'choose', socket: 'authority', tile: 'c18' }]);
  await page.getByRole('link', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'Sail to Stormglass' }).click();
  await expect(page.locator('[data-voyage-choice="authority:c18"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await exportJourney(page)).toEqual(before);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bring the archive packet' })).toBeVisible();
});
