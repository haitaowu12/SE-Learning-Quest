import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { quests } from '../../src/rpg/campaign.ts';
import { beginQuest, choose, completeQuest, derive, newSave, nextDecision, submitPuzzle } from '../../src/rpg/engine.ts';
import { parseSave } from '../../src/rpg/persistence.ts';
import type { Puzzle, Quest, Quality, Save } from '../../src/rpg/types.ts';

const projectPath = '/SE-Learning-Quest/';
const key = 'se_learning_quest_asterfall_v1:/SE-Learning-Quest';
const rank: Quality[] = ['strong', 'mixed', 'weak'];

function observe(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  return failures;
}
async function screenshot(page: Page, name: string, info: TestInfo) {
  await expect(page.locator('.rpg [data-scene-heading]')).toBeVisible();
  await mkdir('output/asterfall', { recursive: true });
  await page.screenshot({ path: `output/asterfall/${info.project.name}-${name}.png`, fullPage: false });
}
async function accessibility(page: Page) {
  await expect(page.locator('.rpg [data-scene-heading]')).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => ({ target: node.target, message: node.failureSummary })) }))).toEqual([]);
}
async function noOverflow(page: Page) {
  await expect(page.locator('.rpg [data-scene-heading]')).toBeVisible();
  const overflow = await page.evaluate(() => {
    const root = document.querySelector('.rpg')!;
    return { root: root.scrollWidth - root.clientWidth, body: document.body.scrollWidth - window.innerWidth };
  });
  expect(overflow).toEqual({ root: 0, body: 0 });
}
async function start(page: Page, name = 'Iona') {
  await page.goto(projectPath);
  await page.getByLabel('Keeper’s first name').fill(name);
  await page.getByRole('button', { name: 'Begin the journey' }).click();
  await expect(page.getByRole('heading', { name: 'Every light is a promise.' })).toBeVisible();
  await page.locator('[data-open-quest="q01"]').click();
}
async function stored(page: Page): Promise<Save> {
  const raw = await page.evaluate((storageKey) => localStorage.getItem(storageKey), key);
  expect(raw).not.toBeNull();
  return parseSave(raw!);
}
async function chooseAll(page: Page, quest: Quest, quality: Quality) {
  while (await page.locator('[data-decision]').count()) {
    const id = await page.locator('[data-decision]').getAttribute('data-decision');
    const decision = quest.decisions.find((entry) => entry.id === id)!;
    expect(decision).toBeDefined();
    const choice = decision.options.find((option) => option.quality === quality)
      ?? [...decision.options].sort((a, b) => Math.abs(rank.indexOf(a.quality) - rank.indexOf(quality)) - Math.abs(rank.indexOf(b.quality) - rank.indexOf(quality)))[0];
    await page.locator(`[data-choice="${choice.id}"]`).click();
    await expect(page.getByRole('region', { name: 'Choice feedback' })).toContainText(choice.feedback);
    await page.getByRole('button', { name: /Continue the conversation|Open the workbench|Review the outcome/ }).click();
  }
}
async function solve(page: Page, puzzle: Puzzle) {
  const bench = page.locator(`[data-puzzle="${puzzle.id}"]`);
  const solution = puzzle.solution;
  if (puzzle.kind === 'match' && !Array.isArray(solution)) {
    for (const [id, category] of Object.entries(solution)) await bench.locator(`[data-match="${id}"]`).selectOption(category);
  } else if (puzzle.kind === 'order' && Array.isArray(solution)) {
    for (let target = 0; target < solution.length; target++) {
      let order = await bench.locator('[data-order-item]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-order-item')));
      while (order.indexOf(solution[target]) > target) {
        await bench.locator(`[data-order-item="${solution[target]}"]`).getByRole('button', { name: /earlier/ }).click();
        order = await bench.locator('[data-order-item]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-order-item')));
      }
    }
  } else if (Array.isArray(solution)) {
    for (const id of solution) await bench.locator(`input[value="${id}"]`).check();
  }
  await bench.locator('[data-submit-puzzle]').click();
  await expect(bench).toContainText('Evidence accepted');
}

test('clean strong campaign: every quest, reward, level, journal, reload and ending', async ({ page }, info) => {
  const failures = observe(page);
  const external: string[] = [];
  await page.route('**/*', (route) => {
    if (!route.request().url().startsWith('http://127.0.0.1:4173/')) { external.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  await page.goto(projectPath);
  await screenshot(page, 'onboarding', info);
  await accessibility(page);
  await start(page, 'Aster');
  await page.getByRole('button', { name: 'World map', exact: true }).click();
  await screenshot(page, 'world-map', info);
  await page.getByRole('button', { name: 'Current quest', exact: true }).click();
  await screenshot(page, 'first-quest', info);
  for (let i = 0; i < quests.length; i++) {
    const quest = quests[i];
    await expect(page.locator('[data-scene-heading]')).toHaveText(quest.title);
    await chooseAll(page, quest, 'strong');
    if (quest.puzzle) await solve(page, quest.puzzle);
    await page.locator(`[data-claim="${quest.id}"]`).click();
    const save = await stored(page);
    expect(save.records[quest.id].completed).toBe(true);
    expect(derive(save).completed).toHaveLength(i + 1);
    if (i === 3) {
      await page.getByRole('button', { name: /Keeper & satchel/ }).click();
      await expect(page.getByRole('heading', { name: /In your satchel · 4 keepsakes/ })).toBeVisible();
      await page.getByRole('button', { name: 'Train Insight +2' }).click();
      expect((await stored(page)).talents).toContain('analysis');
      await page.getByRole('button', { name: 'Current quest', exact: true }).click();
    }
    if (i === 7) {
      const snapshot = await stored(page);
      await page.reload();
      expect(await stored(page)).toEqual(snapshot);
      await page.getByRole('button', { name: 'Field journal', exact: true }).click();
      await expect(page.getByRole('button', { name: /Evidence ledger · 8/ })).toBeVisible();
      await accessibility(page);
      await page.getByRole('button', { name: 'Current quest', exact: true }).click();
    }
    if (i < quests.length - 1) await page.getByRole('button', { name: 'Follow the next light', exact: false }).click();
  }
  await expect(page.locator('[data-scene-heading]')).toHaveText('A constellation, not a crown');
  const final = derive(await stored(page));
  expect(final.concepts).toHaveLength(48);
  expect(final.level).toBeGreaterThan(8);
  expect(final.badges).toContain('Keeper of Tomorrow');
  await screenshot(page, 'ending', info);
  await accessibility(page);
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
});

test('weak campaign, conditional consequences, independent retry and assisted recovery reach a different ending', async ({ page }) => {
  const failures = observe(page);
  await start(page);
  await chooseAll(page, quests[0], 'weak');
  await page.locator('[data-submit-puzzle]').click();
  await page.locator('[data-submit-puzzle]').click();
  await page.getByText('Work through it with Pip', { exact: true }).click();
  await page.getByRole('button', { name: 'Apply this guided repair' }).click();
  await expect(page.getByRole('heading', { name: 'Repaired with Pip’s guidance' })).toBeVisible();
  await page.locator('[data-claim="q01"]').click();
  const record = (await stored(page)).records.q01;
  expect(record.assisted).toBe(true);
  expect(record.attempts).toBe(2);
  for (const quest of quests.slice(1)) {
    await page.getByRole('button', { name: 'Follow the next light' }).click();
    await chooseAll(page, quest, 'weak');
    if (quest.puzzle) await solve(page, quest.puzzle);
    await page.locator(`[data-claim="${quest.id}"]`).click();
  }
  await expect(page.locator('[data-scene-heading]')).toHaveText('A second dawn');
  const save = await stored(page);
  expect(derive(save).badges).toContain('Learned Through Repair');
  for (const quest of quests) {
    for (const decision of quest.decisions.filter((beat) => beat.when?.value === 'none' || beat.when?.value === 'vague')) {
      // A condition whose antecedent occurred must be represented in the persisted history.
      if (nextDecision({ ...save, records: { ...save.records, [quest.id]: { ...save.records[quest.id], completed: false } } }, quest)?.id === decision.id) throw new Error(`Unanswered branch ${quest.id}/${decision.id}`);
    }
  }
  expect(Object.keys(save.records.q04.decisions).length).toBeGreaterThan(2);
  expect(Object.keys(save.records.q16.decisions).length).toBeGreaterThan(2);
  expect(failures).toEqual([]);
});

test('responsive keyboard journey, 200% reflow, dialogs, save export/import/reset, and legacy return', async ({ page }, info) => {
  const failures = observe(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(projectPath);
  await noOverflow(page);
  await accessibility(page);
  // Browser engines differ on where focus lands after clicking a tabindex=-1
  // container. Enter the document's real tab order from the next link, then
  // verify that the skip link is immediately before it and keyboard-operable.
  await page.bringToFront();
  await page.getByRole('link', { name: 'Asterfall world map' }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('link', { name: 'Skip to the adventure' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Begin the journey' }).focus();
  await page.keyboard.press('Enter');
  await screenshot(page, 'mobile-map', info);
  await noOverflow(page);
  await accessibility(page);
  await page.locator('[data-open-quest="q01"]').click();
  const first = quests[0].decisions[0].options.find((choice) => choice.quality === 'weak')!;
  await page.locator(`[data-choice="${first.id}"]`).focus();
  await page.keyboard.press('Enter');
  const beforeRetry = derive(await stored(page));
  expect(beforeRetry.xp).toBe(0);
  await page.getByRole('button', { name: 'Reconsider this quest' }).click();
  expect(derive(await stored(page)).metrics).toEqual({ trust: 50, resilience: 40, supplies: 65 });
  await chooseAll(page, quests[0], 'strong');
  await accessibility(page);
  await solve(page, quests[0].puzzle!);
  await page.locator('[data-claim="q01"]').click();
  const checkpoint = await stored(page);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Text size').selectOption('2');
  await page.getByLabel('Reduce decorative movement').check();
  await page.getByLabel('Increase contrast').check();
  await noOverflow(page);
  await accessibility(page);
  await screenshot(page, '200-percent-settings', info);
  await page.getByRole('button', { name: 'World map', exact: true }).click();
  await noOverflow(page);
  await page.setViewportSize({ width: 320, height: 800 });
  await noOverflow(page);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Text size').selectOption('1');
  await page.setViewportSize({ width: 390, height: 844 });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export expedition', exact: true }).click();
  const download = await downloadPromise;
  const exported = await readFile((await download.path())!, 'utf8');
  expect(parseSave(exported).records).toEqual(checkpoint.records);
  await page.getByRole('button', { name: 'Start a new expedition', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await accessibility(page);
  await page.keyboard.press('Escape');
  expect((await stored(page)).records.q01.completed).toBe(true);
  await page.getByLabel('Import expedition', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  expect((await stored(page)).records.q01.completed).toBe(true);
  await page.getByRole('button', { name: 'Start a new expedition', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Start new expedition' }).click();
  await expect(page.getByRole('button', { name: 'Begin the journey' })).toBeVisible();
  await page.getByRole('button', { name: 'Reading settings & saved expeditions' }).click();
  await page.getByLabel('Import expedition', { exact: true }).setInputFiles({ name: 'expedition.json', mimeType: 'application/json', buffer: Buffer.from(exported) });
  await page.getByRole('dialog').getByRole('button', { name: 'Replace expedition' }).click();
  expect((await stored(page)).records.q01.completed).toBe(true);
  await page.getByRole('link', { name: /Other episodes/ }).click();
  await expect(page.getByRole('button', { name: 'Start Coffee Lab', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Start Coffee Lab', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Coffee Service Systems Lab' })).toBeVisible();
  await page.getByRole('button', { name: 'Main Page', exact: true }).click();
  await page.getByRole('link', { name: 'Play Asterfall RPG' }).click();
  await expect(page.locator('[data-scene-heading]')).toHaveText(quests[0].title);
  await noOverflow(page);
  expect(failures).toEqual([]);
});

test('storage errors preserve originals, stale tabs cannot overwrite, and deployment paths are isolated', async ({ page, context }) => {
  await page.goto(projectPath);
  await page.evaluate(({ key }) => localStorage.setItem(key, '{unreadable'), { key });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('original is preserved');
  await page.getByRole('button', { name: 'Begin the journey' }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe('{unreadable');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Start a new expedition', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Start new expedition' }).click();
  await page.getByRole('button', { name: 'Begin the journey' }).click();
  const other = await context.newPage();
  await other.goto(projectPath);
  await expect(other.getByRole('heading', { name: 'Every light is a promise.' })).toBeVisible();
  await page.locator('[data-open-quest="q01"]').click();
  await expect(other.getByRole('alert')).toContainText('Another tab changed');
  const storedBefore = await stored(page);
  await other.locator('[data-open-quest="q01"]').click();
  const decision = quests[0].decisions[0];
  await other.locator(`[data-choice="${decision.options[0].id}"]`).click();
  expect(await stored(page)).toEqual(storedBefore);
  await other.close();
  await page.goto('/renamed-project/');
  await expect(page.getByRole('button', { name: 'Begin the journey' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /The world is/ })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin the journey' })).toBeVisible();
});

test('unavailable browser storage still permits a playable in-memory expedition and export', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked for test', 'SecurityError'); } });
  });
  await start(page);
  await expect(page.getByRole('alert')).toContainText('Browser storage is unavailable');
  await chooseAll(page, quests[0], 'strong');
  await solve(page, quests[0].puzzle!);
  await page.locator('[data-claim="q01"]').click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export expedition', exact: true }).click();
  const result = await pending;
  expect(parseSave(await readFile((await result.path())!, 'utf8')).records.q01.completed).toBe(true);
});

test('imported mid-campaign bench remains operable on narrow screens', async ({ page }) => {
  // UI import uses a real replayed save; full campaigns above never seed engine state.
  let save = { ...newSave('Mara'), onboarded: true };
  for (const quest of quests.slice(0, 14)) {
    save = beginQuest(save, quest.id);
    while (nextDecision(save, quest)) {
      const decision = nextDecision(save, quest)!;
      save = choose(save, decision.id, (decision.options.find((choice) => choice.quality === 'strong') ?? decision.options[0]).id);
    }
    if (quest.puzzle) save = submitPuzzle(save, quest.puzzle.solution);
    save = completeQuest(save);
  }
  save = beginQuest(save, 'q15');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(projectPath);
  await page.getByRole('button', { name: 'Reading settings & saved expeditions' }).click();
  await page.getByLabel('Import expedition', { exact: true }).setInputFiles({ name: 'midpoint.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(save)) });
  await page.getByRole('dialog').getByRole('button', { name: 'Replace expedition' }).click();
  const quest = quests.find((quest) => quest.id === 'q15')!;
  await chooseAll(page, quest, 'mixed');
  await accessibility(page);
  await noOverflow(page);
  await solve(page, quest.puzzle!);
  await page.locator('[data-claim="q15"]').click();
  await expect(page.getByRole('heading', { name: quest.reward.name, exact: true })).toBeVisible();
});
