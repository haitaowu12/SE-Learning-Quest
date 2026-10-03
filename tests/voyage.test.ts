import assert from 'node:assert/strict';
import test from 'node:test';
import { scenes } from '../src/adventure/voyage/content.ts';
import { assessRecord, canSeal, currentRecord, dispatchVoyage, endingLines, freshVoyageSave, MAX_VOYAGE_ACTIONS, parseVoyageSave, replayVoyage, voyageSaveKey } from '../src/adventure/voyage/model.ts';
import { loadVoyage, parseVoyageImport, writeVoyage } from '../src/adventure/voyage/persistence.ts';
import { completedArchive, proposedArchive } from './archive-helpers.ts';
import { atScene, completedVoyage, freshTestVoyage, readyScene } from './voyage-helpers.ts';

test('voyage: sixteen sourced scenes with reachable tile contracts and dependency cards', () => {
  assert.equal(scenes.length, 16); assert.equal(new Set(scenes.map(scene => scene.id)).size, 16);
  assert.deepEqual([...new Set(scenes.map(scene => scene.chapter))], [4, 5, 6, 7]);
  for (const scene of scenes) {
    assert.ok(scene.sources.length && scene.lesson && scene.artifact && scene.result);
    for (const socket of scene.sockets) for (const accepted of socket.accepts) assert.ok(socket.options.some(tile => tile.id === accepted));
    if (scene.kind === 'sequence') assert.equal(new Set(scene.sequence?.map(tile => tile.id)).size, 4);
    if (scene.kind === 'trial') assert.equal(scene.cases?.length, 3);
  }
});
test('voyage: entry requires the actual sealed archive; import preserves all three earlier histories', () => {
  assert.throws(() => freshVoyageSave(proposedArchive()), /Seal the archive/);
  const archive = completedArchive('rebuild'), save = parseVoyageImport(JSON.stringify(archive));
  assert.deepEqual(save.arrival, archive); assert.deepEqual(replayVoyage(save).records[0].choices, {});
  assert.deepEqual(parseVoyageSave(JSON.stringify(save)), save);
});
test('voyage: viable alternative routes finish with different obligations and preserved evidence', () => {
  for (const route of ['diverse', 'lookouts'] as const) for (const warning of ['beacon', 'lookout'] as const) {
    const alternate = route === 'lookouts';
    const save = completedVoyage({ route, warning, fallback: alternate ? 'posts' : 'east', change: alternate ? 'parallel' : 'extend', governance: alternate ? 'office' : 'council', support: alternate ? 'local' : 'maker', legacy: alternate ? 'recover' : 'exhibit' });
    const state = replayVoyage(save);
    assert.equal(state.complete, true); assert.equal(state.records.filter(record => record.sealed).length, 16);
    assert.deepEqual(parseVoyageSave(JSON.stringify(save)), save);
    assert.match(endingLines(state).join(' '), alternate ? /initial|Training and tooling/i : /retainer/);
    assert.equal(state.records.find(record => record.scene === 'winter')!.runs.at(-1)!.observations.length, 5);
  }
});
test('voyage: no skipped steps, fake review or post-ending edits', () => {
  const save = freshTestVoyage(); assert.throws(() => dispatchVoyage(save, { type: 'seal' }), /Review/);
  assert.throws(() => parseVoyageSave(JSON.stringify({ ...save, actions: [{ type: 'review', gaps: [] }, { type: 'seal' }] })), /unsupported fields/);
  assert.throws(() => dispatchVoyage(completedVoyage(), { type: 'review' }), /recorded/);
  assert.throws(() => endingLines(replayVoyage(save)), /Finish/);
});
test('voyage: route support is a real constraint, and changing it invalidates approval', () => {
  let save = readyScene(atScene('routes'));
  assert.ok(canSeal(replayVoyage(save)));
  save = dispatchVoyage(save, { type: 'choose', socket: 'route', tile: 'lookouts' });
  assert.equal(currentRecord(replayVoyage(save)).review, null);
  assert.match(assessRecord(replayVoyage(save)).join(' '), /two rotating crews/);
  assert.throws(() => dispatchVoyage(save, { type: 'seal' }));
  save = dispatchVoyage(save, { type: 'choose', socket: 'support', tile: 'crews' });
  save = dispatchVoyage(save, { type: 'review' }); assert.ok(canSeal(replayVoyage(save)));
});
test('voyage: a misplaced valid connector can be explored but cannot pass review', () => {
  let save = readyScene(atScene('interfaces'));
  save = dispatchVoyage(save, { type: 'choose', socket: 'order', tile: 'hold' });
  assert.match(assessRecord(replayVoyage(save)).join(' '), /signed V2/);
  assert.equal(currentRecord(replayVoyage(save)).choices.order, 'hold');
  assert.throws(() => dispatchVoyage(save, { type: 'choose', socket: 'order', tile: 'forged' }));
});
test('voyage: old receiver passes the valid order but fails the expired replay', () => {
  let save = dispatchVoyage(atScene('receiver'), { type: 'choose', socket: 'controller', tile: 'v1' });
  save = dispatchVoyage(save, { type: 'run', caseId: 'valid' });
  save = dispatchVoyage(save, { type: 'run', caseId: 'replay' });
  const runs = currentRecord(replayVoyage(save)).runs;
  assert.equal(runs[0].passed, true); assert.equal(runs[1].passed, false);
  assert.ok(runs.every(run => run.observations.every(item => item.perceived === null)));
});
test('voyage: expired V2 rejection is a passing check without claiming local perception', () => {
  const save = readyScene(atScene('receiver'));
  const run = currentRecord(replayVoyage(save)).runs.find(item => item.caseId === 'replay')!;
  assert.equal(run.passed, true); assert.ok(run.observations.every(item => !item.received && item.seconds === null && item.perceived === null));
});
test('voyage: local night obstruction is visible despite a received packet', () => {
  let save = dispatchVoyage(atScene('warning'), { type: 'choose', socket: 'warning', tile: 'exposed' });
  save = dispatchVoyage(save, { type: 'run', caseId: 'day' });
  save = dispatchVoyage(save, { type: 'run', caseId: 'night' });
  const runs = currentRecord(replayVoyage(save)).runs;
  assert.equal(runs[0].passed, true); assert.equal(runs[1].passed, false);
  assert.equal(runs[1].observations[0].received, true); assert.equal(runs[1].observations[0].perceived, false);
});
test('voyage: configuration changes erase current trials and review; identical actions preserve them', () => {
  const good = readyScene(atScene('warning'));
  assert.equal(dispatchVoyage(good, { type: 'choose', socket: 'warning', tile: 'beacon' }), good);
  assert.equal(dispatchVoyage(good, { type: 'run', caseId: 'day' }), good);
  const changed = dispatchVoyage(good, { type: 'choose', socket: 'warning', tile: 'lookout' });
  assert.equal(currentRecord(replayVoyage(changed)).runs.length, 0);
  assert.equal(currentRecord(replayVoyage(changed)).review, null);
  assert.deepEqual(currentRecord(replayVoyage(good)).runs.length, 3);
  assert.ok(assessRecord(replayVoyage(changed)).some(gap => gap.includes('Run the')));
});
test('voyage: the old winter configuration omits Drift without erasing the other four observations', () => {
  let save = dispatchVoyage(atScene('winter'), { type: 'choose', socket: 'scope', tile: 'four' });
  save = dispatchVoyage(save, { type: 'run', caseId: 'winter' });
  const run = currentRecord(replayVoyage(save)).runs[0];
  assert.equal(run.passed, false); assert.equal(run.observations.length, 5);
  assert.equal(run.observations.filter(item => item.received).length, 4);
  assert.equal(run.observations[4].perceived, false);
});
test('voyage: a six-token budget cannot hide missing cover or overspend', () => {
  let save = readyScene(atScene('stewardship'));
  save = dispatchVoyage(save, { type: 'allocate', role: 'watch', amount: 1 });
  assert.match(assessRecord(replayVoyage(save)).join(' '), /Watch coverage/);
  save = dispatchVoyage(save, { type: 'allocate', role: 'watch', amount: 6 });
  assert.match(assessRecord(replayVoyage(save)).join(' '), /six tokens/);
  assert.throws(() => dispatchVoyage(save, { type: 'allocate', role: '__proto__', amount: 1 }));
  assert.throws(() => dispatchVoyage(save, { type: 'allocate', role: 'watch', amount: 1.5 }));
});
test('voyage: sequence dependencies and relief remain enforced after portable reload', () => {
  const save = atScene('relief');
  assert.equal(replayVoyage(save).records.some(record => record.scene === 'relief' && record.sealed), false);
  assert.throws(() => dispatchVoyage(parseVoyageSave(JSON.stringify(save)), { type: 'seal' }));
  const done = dispatchVoyage(readyScene(save), { type: 'seal' });
  assert.equal(replayVoyage(done).records.find(record => record.scene === 'relief')!.sealed, true);
});
test('voyage: bounded parser rejects forged inputs without modifying the original', () => {
  const save = freshTestVoyage(), raw = JSON.stringify(save);
  for (const mutation of [{ version: 2 }, { actions: [{ type: 'teleport' }] }, { settings: { largeText: 'yes', lessMotion: false } }, { actions: Array(MAX_VOYAGE_ACTIONS + 1).fill({ type: 'review' }) }]) assert.throws(() => parseVoyageSave(JSON.stringify({ ...save, ...mutation })));
  assert.throws(() => parseVoyageSave(' '.repeat(1_000_001)));
  assert.throws(() => parseVoyageImport('{}'));
  assert.equal(JSON.stringify(save), raw);
});
test('voyage: path-scoped writes detect conflicts and preserve corrupt stored originals', () => {
  const values = new Map<string, string>(), storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, raw: string) => { values.set(key, raw); } };
  const path = '/SE-Learning-Quest/', key = voyageSaveKey(path), save = freshTestVoyage();
  assert.equal(key, voyageSaveKey(path + 'index.html')); assert.notEqual(key, voyageSaveKey('/other/'));
  values.set(key, '{bad');
  const loaded = loadVoyage(storage, path, save.arrival); assert.equal(loaded.blocked, true); assert.equal(loaded.raw, '{bad');
  assert.equal(writeVoyage(storage, path, save, null).ok, false); assert.equal(values.get(key), '{bad');
  assert.equal(writeVoyage(storage, path, save, '{bad').ok, true);
});
test('voyage: denied storage and changed bytes preserve the tab snapshot', () => {
  const save = readyScene(freshTestVoyage()), denied = { getItem(): never { throw Error('denied'); }, setItem(): never { throw Error('denied'); } };
  const remembered = { save, raw: null, blocked: true, notice: 'Export' };
  assert.deepEqual(loadVoyage(denied, '/', null, remembered).save, save);
  assert.equal(writeVoyage(denied, '/', save, null).ok, false);
  const changed = loadVoyage({ getItem: () => '{}', setItem() {} }, '/', null, remembered);
  assert.equal(changed.blocked, true); assert.deepEqual(changed.save, save);
});