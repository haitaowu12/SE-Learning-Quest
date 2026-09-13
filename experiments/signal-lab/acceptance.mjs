import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const target = new URL('./index.html', import.meta.url);
const output = new URL('../../.release-check/signal-lab/', import.meta.url);
await mkdir(output, { recursive: true });
const source = await readFile(target);
const report = { sourceSha256: createHash('sha256').update(source).digest('hex'), checkedAt: new Date().toISOString(), engines: [] };

for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const result = { name, checks: [], errors: [], passed: false };
  let browser;
  try {
    browser = await engine.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, reducedMotion: 'reduce' });
    await context.route(/^https?:/, route => { result.errors.push(`Unexpected network request: ${route.request().url()}`); return route.abort(); });
    await context.addInitScript(() => {
      // The standalone study must not require or touch the game's browser saves.
      for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(window, key, { configurable: true, get() { throw new Error(`Study attempted ${key}`); } });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
    await page.goto(target.href);
    await expect(page.locator('#run')).toBeVisible();
    const actionBox = await page.locator('#run').boundingBox();
    assert.ok(actionBox && actionBox.y + actionBox.height < 700, 'First action appears without scrolling');
    await expect(page.locator('#reduce-motion')).toBeChecked();
    result.checks.push('Direct file:// launch; no network or browser-storage access; system reduced-motion setting honored');

    const model = await page.evaluate(() => {
      const { simulate, edgeKey: k } = window.SignalLab;
      const initial = [k('tower','north'), k('north','harbour')];
      const connected = [...initial, k('harbour','refuge'), k('refuge','lower')];
      const resilient = [...connected, k('tower','south'), k('south','lower')];
      const alternate = [k('tower','south'), k('south','lower'), k('lower','refuge'), k('refuge','harbour')];
      let rejected = false;
      try { simulate(['missing:route'], [], 'calm', 0); } catch { rejected = true; }
      return {
        initial: simulate(initial, [], 'calm', 0),
        deliveryOnly: simulate(connected, [], 'calm', 1),
        useful: simulate(connected, ['lower'], 'calm', 1),
        cut: simulate(connected, ['lower'], 'storm', 2),
        restored: simulate(resilient, ['lower'], 'storm', 2),
        alternate: simulate(alternate, ['lower'], 'storm', 2),
        rejected,
      };
    });
    assert.equal(model.initial.received, 1);
    assert.equal(model.initial.responded, null);
    assert.equal(model.deliveryOnly.received, 3);
    assert.equal(model.deliveryOnly.responded, 2);
    assert.equal(model.useful.responded, 3);
    assert.equal(model.cut.received, 0);
    assert.equal(model.restored.responded, 3);
    assert.equal(model.alternate.responded, 3);
    assert.equal(model.rejected, true);
    result.checks.push('Computed reachability, delivery/response distinction, declared fault, alternative successful topology and invalid-input rejection');

    const run = async () => {
      await page.locator('#run').click();
      await expect(page.locator('#run')).toBeEnabled();
    };
    const connect = async (first, second) => {
      await page.locator('#tool-link').click();
      await page.locator(`#node-${first}`).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator(`#node-${first}`)).toHaveAttribute('aria-pressed', 'true');
      await page.locator(`#node-${second}`).focus();
      await page.keyboard.press('Enter');
    };
    const axe = async label => {
      const findings = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      assert.deepEqual(findings.violations.map(v => ({ id:v.id, targets:v.nodes.map(n=>n.target) })), [], label);
    };
    const noOverflow = async () => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    };
    await axe('Opening board');
    await run();
    await expect(page.locator('#received')).toHaveText('1/3');
    await expect(page.locator('#next')).toBeHidden();
    await connect('harbour','refuge');
    await connect('refuge','lower');
    await run();
    await expect(page.locator('#received')).toHaveText('3/3');
    await expect(page.locator('#responded')).toHaveText('—');
    await page.locator('#next').click();
    await expect(page.locator('#mission-title')).toBeFocused();
    await expect(page.locator('#crew-clue')).toBeVisible();
    await run();
    await expect(page.locator('#received')).toHaveText('3/3');
    await expect(page.locator('#responded')).toHaveText('2/3');
    await expect(page.locator('#node-lower .node-state')).toHaveText('! Missed cue');
    await expect(page.locator('#next')).toBeHidden();
    await axe('Delivery without useful response');
    if (name === 'chromium') await page.screenshot({ path: fileURLToPath(new URL('signal-lab-desktop.png', output)) });
    await page.locator('#tool-beacon').click();
    await page.locator('#node-lower').click();
    await run();
    await expect(page.locator('#responded')).toHaveText('3/3');
    await page.locator('#next').click();
    result.checks.push('Keyboard cable construction; experiment 1 requires delivery, experiment 2 requires a usable cue; visible needs precede grading');

    await run();
    await expect(page.locator('#calm-evidence')).toContainText('Passed');
    await page.locator('#storm').click();
    await run();
    await expect(page.locator('#received')).toHaveText('0/3');
    await connect('tower','south');
    await connect('south','lower');
    await expect(page.locator('#calm-evidence')).toContainText('Not tested');
    await expect(page.locator('#storm-evidence')).toContainText('Not tested');
    await run();
    await expect(page.locator('#storm-evidence')).toContainText('Passed');
    await expect(page.locator('#next')).toBeHidden();
    await page.locator('#calm').click();
    await run();
    await expect(page.locator('#next')).toBeVisible();
    await page.locator('#next').click();
    await expect(page.locator('#final')).toBeVisible();
    await page.locator('#undo').click();
    await expect(page.locator('#final')).toBeHidden();
    await expect(page.locator('#next')).toBeHidden();
    await expect(page.locator('#storm-evidence')).toContainText('Not tested');
    result.checks.push('Both conditions required on one layout; editing and undo invalidate evidence and completion');

    // Restore the last cable, then attempt to exceed the stated parts budget.
    await connect('south','lower');
    await connect('north','south');
    await expect(page.locator('#parts')).toHaveText('8 / 8');
    await page.locator('#tool-beacon').click();
    await page.locator('#node-harbour').click();
    await expect(page.locator('#parts')).toHaveText('8 / 8');
    await expect(page.locator('#status')).toContainText('No spare parts');
    await expect(page.locator('#node-harbour')).not.toHaveClass(/beacon/);
    await page.locator('#undo').click();
    await expect(page.locator('#parts')).toHaveText('7 / 8');
    result.checks.push('Budget rejection leaves layout unchanged; components can be removed or undone');

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height:844 });
      await noOverflow();
      await axe(`Mobile board ${width}px`);
      await page.locator('#storm').click();
      await run();
      await expect(page.locator('#responded')).toHaveText('3/3');
    }
    if (name === 'chromium') {
      await page.setViewportSize({ width:390,height:844 });
      await page.locator('#world').scrollIntoViewIfNeeded();
      await page.screenshot({ path:fileURLToPath(new URL('signal-lab-mobile.png',output)) });
    }
    result.checks.push('320px/390px layouts and controls; no horizontal overflow; automated axe checks in inspected states');

    await page.locator('#reset').click();
    await expect(page.locator('#mission-title')).toHaveText('Reach every receiver.');
    await expect(page.locator('#parts')).toHaveText('2 / 6');
    await expect(page.locator('#run')).toBeFocused();
    await page.reload();
    await expect(page.locator('#parts')).toHaveText('2 / 6');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#reduce-motion').uncheck();
    await page.locator('#run').click();
    await expect(page.locator('#signals circle').first()).toBeAttached();
    await page.waitForFunction(() => [...document.querySelectorAll('#signals circle')].some(el => Number(getComputedStyle(el).opacity) > 0), undefined, { timeout:2000 });
    await expect(page.locator('#received')).toHaveText('1/3', { timeout:4000 });
    await page.locator('#run').click();
    await connect('harbour','refuge');
    await expect(page.locator('#run')).toBeEnabled();
    await expect(page.locator('#signals circle')).toHaveCount(0);
    await expect(page.locator('#received')).toHaveText('—');
    result.checks.push('Animated signal uses computed routes; editing cancels an in-flight test without preserving its result');
    assert.deepEqual(result.errors,[]);
    result.checks.push('Start-over and reload return to the initial study; no page/console errors');
    result.passed = true;
  } catch(error) {
    result.errors.push(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  } finally {
    if(browser) await browser.close();
    report.engines.push(result);
    console.log(JSON.stringify(result,null,2));
  }
}
await writeFile(new URL('acceptance.json',output),JSON.stringify(report,null,2)+'\n');
