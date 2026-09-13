import test from 'node:test';
import assert from 'node:assert/strict';
import { quests, questById } from '../src/rpg/campaign.ts';
import {
  beginQuest, choose, completeQuest, derive, newSave, nextDecision, retryQuest,
  submitPuzzle, train,
} from '../src/rpg/engine.ts';
import { loadSave, MAX_SAVE_BYTES, parseSave, saveKey, writeSave } from '../src/rpg/persistence.ts';
import type { StoragePort } from '../src/rpg/persistence.ts';
import type { Quality, Quest, Save } from '../src/rpg/types.ts';
import { MemoryStorage } from './helpers.ts';

function currentQuest(id: string): Quest {
  const result = questById.get(id);
  assert.ok(result);
  return result;
}

function conversations(save: Save, current: Quest, quality: Quality = 'strong', flag?: { key: string; value: string }): Save {
  let result = beginQuest(save, current.id);
  const order: Quality[] = quality === 'weak' ? ['weak', 'mixed', 'strong']
    : quality === 'mixed' ? ['mixed', 'strong', 'weak'] : ['strong', 'mixed', 'weak'];
  for (let decision = nextDecision(result, current); decision; decision = nextDecision(result, current)) {
    const option = decision.options.find((entry) => flag && entry.flag?.key === flag.key && entry.flag.value === flag.value)
      ?? order.flatMap((item) => decision!.options.filter((entry) => entry.quality === item))[0];
    result = choose(result, decision.id, option.id);
  }
  return result;
}

function expedition(count = quests.length, quality: Quality = 'strong', flag?: { key: string; value: string }): Save {
  let result = { ...newSave('Mina', 'craft'), onboarded: true };
  for (const current of quests.slice(0, count)) {
    result = conversations(result, current, quality, flag);
    if (current.puzzle) result = submitPuzzle(result, structuredClone(current.puzzle.solution));
    result = completeQuest(result);
  }
  return result;
}

function atBench(id: string): Save {
  const index = quests.findIndex((entry) => entry.id === id);
  return conversations(expedition(index), currentQuest(id));
}

function roundTrip(save: Save): Save {
  const result = parseSave(JSON.stringify(save));
  assert.deepEqual(result, save);
  assert.deepEqual(derive(result), derive(save));
  assert.equal(JSON.stringify(parseSave(JSON.stringify(result))), JSON.stringify(result));
  return result;
}

function rejected(base: Save, mutate: (input: Save) => void): void {
  const input = structuredClone(base);
  mutate(input);
  assert.throws(() => parseSave(JSON.stringify(input)));
}

test('fresh, started, active and partially answered expeditions round-trip without derived state', () => {
  roundTrip(newSave());
  const started = { ...newSave('  Mina  ', 'assurance'), onboarded: true };
  roundTrip(started);
  let active = beginQuest(started, 'q01');
  roundTrip(active);
  const decision = nextDecision(active, currentQuest('q01'))!;
  active = choose(active, decision.id, decision.options[0].id);
  roundTrip(active);
  const exported = JSON.stringify(active);
  for (const key of ['xp', 'level', 'flags', 'unlocked', 'metrics', 'badges']) {
    assert.equal(Object.hasOwn(JSON.parse(exported), key), false);
  }
});

for (const quality of ['strong', 'mixed', 'weak'] as const) {
  test(`${quality}-preference saves replay after every actual choice and quest completion`, () => {
    let save = { ...newSave('Mina', 'craft'), onboarded: true };
    const order: Quality[] = quality === 'weak' ? ['weak', 'mixed', 'strong']
      : quality === 'mixed' ? ['mixed', 'strong', 'weak'] : ['strong', 'mixed', 'weak'];
    for (const current of quests) {
      save = roundTrip(beginQuest(save, current.id));
      for (let decision = nextDecision(save, current); decision; decision = nextDecision(save, current)) {
        const option = order.flatMap((item) => decision!.options.filter((entry) => entry.quality === item))[0];
        save = roundTrip(choose(save, decision.id, option.id));
      }
      if (current.puzzle) save = roundTrip(submitPuzzle(save, structuredClone(current.puzzle.solution)));
      save = roundTrip(completeQuest(save));
    }
    assert.equal(derive(save).completed.length, 24);
  });
}

test('failed and partial answers, retries, guided solutions and earned training survive replay', () => {
  let select = atBench('q01');
  select = roundTrip(submitPuzzle(select, []));
  select = roundTrip(submitPuzzle(select, ['forecast']));
  select = roundTrip(submitPuzzle(select, [], true));
  roundTrip(completeQuest(select));
  roundTrip(retryQuest(select));
  const match = roundTrip(submitPuzzle(atBench('q02'), { 'masked-bell': 'act' }));
  assert.equal(match.records.q02.completed, false);
  const order = currentQuest('q05').puzzle!;
  roundTrip(submitPuzzle(atBench('q05'), [...order.solution as string[]].reverse()));
  roundTrip(submitPuzzle(atBench('q08'), ['copper']));
  const trained = train(expedition(3), 'empathy');
  assert.equal(derive(trained).talentPoints, 0);
  roundTrip(trained);
});

test('failed-submission counts survive reconsideration and reload without counting dialogue resets', () => {
  let save = beginQuest({ ...newSave(), onboarded: true }, 'q01');
  save = roundTrip(retryQuest(retryQuest(save)));
  assert.equal(save.records.q01.attempts, 0);
  save = conversations(save, currentQuest('q01'));
  assert.throws(() => submitPuzzle(save, [], true));
  save = roundTrip(submitPuzzle(save, []));
  save = roundTrip(retryQuest(save));
  assert.equal(save.records.q01.attempts, 1);
  save = conversations(save, currentQuest('q01'));
  assert.throws(() => submitPuzzle(save, [], true));
  save = roundTrip(submitPuzzle(save, []));
  roundTrip(completeQuest(submitPuzzle(save, [], true)));
});

test('record and decision property order is canonicalized by replay rather than trusted as chronology', () => {
  const save = expedition();
  const shuffled = structuredClone(save);
  shuffled.records = Object.fromEntries(Object.entries(shuffled.records).reverse().map(([id, record]) => [
    id, { ...record, decisions: Object.fromEntries(Object.entries(record.decisions).reverse()) },
  ]));
  const reorderedRoot = Object.fromEntries(Object.entries(shuffled).reverse());
  const restored = parseSave(JSON.stringify(reorderedRoot));
  assert.deepEqual(restored, save);
  assert.equal(JSON.stringify(restored), JSON.stringify(save));
});

test('corrupt JSON, non-object roots and unsupported game or content versions are rejected', () => {
  for (const raw of ['', '{broken', 'null', '[]', 'true', '42', '"save"']) assert.throws(() => parseSave(raw));
  const base = newSave();
  rejected(base, (input) => { input.version = 2 as never; });
  rejected(base, (input) => { input.version = '1' as never; });
  rejected(base, (input) => { input.contentVersion = 2 as never; });
  rejected(base, (input) => { input.campaign = 'another-game' as never; });
  rejected(base, (input) => { Reflect.deleteProperty(input, 'records'); });
  rejected(base, (input) => { input.records = [] as never; });
});

test('import size is bounded in UTF-8 bytes, including multibyte text', () => {
  const text = JSON.stringify({ ...newSave(), padding: '界'.repeat(Math.ceil(MAX_SAVE_BYTES / 3)) });
  assert.ok(text.length < MAX_SAVE_BYTES);
  assert.ok(new TextEncoder().encode(text).byteLength > MAX_SAVE_BYTES);
  assert.throws(() => parseSave(text), /500 KB/);
});

test('unknown and derived fields cannot smuggle flags, rewards or fabricated XP into the save', () => {
  for (const field of ['xp', 'flags', 'unlocked', 'metrics', 'completed', 'badges']) {
    rejected(newSave(), (input) => { Object.assign(input, { [field]: 999 }); });
  }
  rejected(newSave(), (input) => { Object.assign(input.player, { level: 99 }); });
  rejected(newSave(), (input) => { Object.assign(input.settings, { skipEvidence: true }); });
  rejected(expedition(1), (input) => { Object.assign(input.records.q01, { rewardClaimed: true }); });
});

test('names, origins, booleans, text scales and mandatory settings are validated', () => {
  const base = newSave();
  for (const name of ['', '  ', 'a'.repeat(25), 'Mi\u0000na', 'Mi\nna']) {
    rejected(base, (input) => { input.player.name = name; });
  }
  rejected(base, (input) => { input.player.origin = 'unknown' as never; });
  rejected(base, (input) => { input.onboarded = 1 as never; });
  rejected(base, (input) => { input.settings.textScale = 3 as never; });
  rejected(base, (input) => { input.settings.textScale = '2' as never; });
  rejected(base, (input) => { input.settings.highContrast = 'true' as never; });
  rejected(base, (input) => { Reflect.deleteProperty(input.settings, 'reducedMotion'); });
  for (const scale of [1, 1.25, 1.5, 2] as const) {
    const valid = newSave('星河');
    valid.settings = { textScale: scale, reducedMotion: true, highContrast: true };
    roundTrip(valid);
  }
});

test('quest records require onboarding, known IDs and completed prerequisite evidence', () => {
  const full = expedition();
  rejected(full, (input) => { input.onboarded = false; });
  rejected(full, (input) => { input.records.q99 = structuredClone(input.records.q01); });
  rejected(full, (input) => { Reflect.deleteProperty(input.records, 'q01'); });
  rejected(full, (input) => { input.records.q02.completed = false; });
  rejected(full, (input) => { Reflect.deleteProperty(input.records, 'q03'); });
  rejected(full, (input) => { input.records.q11.completed = false; });
  const ahead = { ...newSave(), onboarded: true };
  ahead.records.q24 = structuredClone(full.records.q24);
  assert.throws(() => parseSave(JSON.stringify(ahead)), /prerequisite/);
});

test('attempts and quest booleans reject missing, fractional, negative and excessive values', () => {
  const base = beginQuest({ ...newSave(), onboarded: true }, 'q01');
  for (const attempts of [-1, 0.5, 1000, '2', null]) {
    rejected(base, (input) => { input.records.q01.attempts = attempts as never; });
  }
  rejected(base, (input) => { input.records.q01.assisted = 0 as never; });
  rejected(base, (input) => { input.records.q01.completed = 'true' as never; });
  rejected(base, (input) => { Reflect.deleteProperty(input.records.q01, 'puzzleAnswer'); });
});

test('quests without a workbench cannot import failed attempts or fabricate a repair badge', () => {
  const base = expedition(3);
  assert.equal(currentQuest('q03').puzzle, undefined);
  assert.ok(!derive(base).badges.includes('Learned Through Repair'));
  const altered = structuredClone(base);
  altered.records.q03.attempts = 1;
  assert.throws(() => parseSave(JSON.stringify(altered)), /require a quest with a workbench/);
  roundTrip(base);
});

test('out-of-order, unknown and invalid decision IDs or choices are rejected', () => {
  const base = beginQuest({ ...newSave(), onboarded: true }, 'q01');
  const [first, second] = currentQuest('q01').decisions;
  rejected(base, (input) => { input.records.q01.decisions[second.id] = second.options[0].id; });
  rejected(base, (input) => { input.records.q01.decisions[first.id] = 'unknown-choice'; });
  rejected(base, (input) => { input.records.q01.decisions.unknown = first.options[0].id; });
  rejected(base, (input) => { input.records.q01.decisions[first.id] = 7 as never; });
});

test('hidden branch choices are rejected and a visible branch cannot be skipped at completion', () => {
  const conditional = currentQuest('q04').decisions.find((decision) => decision.when)!;
  const noBranch = expedition(4, 'strong');
  assert.equal(noBranch.records.q04.decisions[conditional.id], undefined);
  rejected(noBranch, (input) => { input.records.q04.decisions[conditional.id] = conditional.options[0].id; });
  const branch = expedition(4, 'weak');
  assert.ok(branch.records.q04.decisions[conditional.id]);
  rejected(branch, (input) => { Reflect.deleteProperty(input.records.q04.decisions, conditional.id); });
});

for (const [id, key, value] of [['q18', 'topology', 'hub'], ['q23', 'baseline', 'partial']] as const) {
  test(`${id} replays its alternative-path branch and rejects an omitted required branch answer`, () => {
    const current = currentQuest(id);
    const conditional = current.decisions.find((decision) => decision.when?.flag === key && decision.when.value === value)!;
    const save = expedition(quests.indexOf(current) + 1, 'strong', { key, value });
    assert.ok(save.records[id].decisions[conditional.id]);
    roundTrip(save);
    rejected(save, (input) => { Reflect.deleteProperty(input.records[id].decisions, conditional.id); });
  });
}

test('puzzle evidence cannot precede its conversation or appear in a quest without a puzzle', () => {
  const active = beginQuest({ ...newSave(), onboarded: true }, 'q01');
  rejected(active, (input) => { input.records.q01.puzzleAnswer = currentQuest('q01').puzzle!.solution; });
  const complete = expedition(3);
  rejected(complete, (input) => { input.records.q03.puzzleAnswer = []; });
  rejected(atBench('q01'), (input) => { input.records.q01.completed = true; });
  const failed = submitPuzzle(atBench('q01'), []);
  rejected(failed, (input) => { input.records.q01.completed = true; });
});

test('array responses reject unknown IDs, duplicates and incompatible shapes', () => {
  const base = submitPuzzle(atBench('q01'), []);
  for (const response of [['unknown-item'], ['repeater', 'repeater'], { repeater: 'yes' }, 42]) {
    rejected(base, (input) => { input.records.q01.puzzleAnswer = response as never; });
  }
});

test('matching responses reject unknown items, unknown categories and arrays', () => {
  const base = submitPuzzle(atBench('q02'), {});
  for (const response of [{ unknown: 'perceive' }, { 'masked-bell': 'unknown-category' }, [], { 'masked-bell': 2 }]) {
    rejected(base, (input) => { input.records.q02.puzzleAnswer = response as never; });
  }
});

test('guided assistance requires the earned attempt history and a puzzle', () => {
  const base = atBench('q01');
  for (const attempts of [0, 1]) {
    rejected(base, (input) => {
      input.records.q01.assisted = true;
      input.records.q01.attempts = attempts;
      input.records.q01.puzzleAnswer = currentQuest('q01').puzzle!.solution;
    });
  }
  rejected(expedition(3), (input) => { input.records.q03.assisted = true; input.records.q03.attempts = 2; });
});

test('guided assistance cannot appear before the conversation or without a submitted answer', () => {
  const started = beginQuest({ ...newSave(), onboarded: true }, 'q01');
  rejected(started, (input) => { input.records.q01.assisted = true; input.records.q01.attempts = 2; });
  rejected(atBench('q01'), (input) => { input.records.q01.assisted = true; input.records.q01.attempts = 2; });
});

test('an incorrect submitted response must have at least one recorded failed attempt', () => {
  rejected(atBench('q01'), (input) => { input.records.q01.puzzleAnswer = []; });
});

test('active quest must be an owned history entry, including prototype-like names', () => {
  const base = newSave();
  for (const id of ['q01', 'q99', 'toString', 'constructor', '__proto__', 'hasOwnProperty']) {
    rejected(base, (input) => { input.activeQuestId = id; });
  }
  const completed = expedition(2);
  completed.activeQuestId = 'q01';
  roundTrip(completed);
  completed.activeQuestId = null;
  roundTrip(completed);
});

test('training imports can spend only points earned by the replayed campaign', () => {
  rejected(newSave(), (input) => { input.talents = ['craft']; });
  rejected(expedition(3), (input) => { input.talents = ['craft', 'analysis']; });
  rejected(expedition(3), (input) => { input.talents = ['unknown'] as never; });
  rejected(expedition(3), (input) => { input.talents = 'craft' as never; });
  const full = expedition();
  const earned = derive(full).talentPoints;
  full.talents = Array.from({ length: earned }, () => 'assurance');
  roundTrip(full);
});

test('save keys normalize one deployment while isolating root, sibling and nested projects', () => {
  const project = saveKey('/SE-Learning-Quest/');
  assert.equal(project, saveKey('/SE-Learning-Quest'));
  assert.equal(project, saveKey('/SE-Learning-Quest/index.html'));
  assert.equal(project, saveKey('/SE-Learning-Quest///'));
  assert.equal(saveKey('/'), saveKey('/index.html'));
  assert.notEqual(project, saveKey('/'));
  assert.notEqual(project, saveKey('/Another-Quest/'));
  assert.notEqual(project, saveKey('/SE-Learning-Quest/nested/'));
});

test('loading and saving touch only the selected project key and preserve unrelated episodes', () => {
  const storage = new MemoryStorage();
  const key = saveKey('/SE-Learning-Quest/');
  const unrelated = new Map([
    ['coffee-lab-progress', 'coffee bytes'],
    ['rail-quest-save', 'rail bytes'],
    [saveKey('/Another-Quest/'), 'other project bytes'],
  ]);
  for (const [id, raw] of unrelated) storage.setItem(id, raw);
  const calls: string[] = [];
  const port: StoragePort = {
    getItem(id) { calls.push(`get:${id}`); return storage.getItem(id); },
    setItem(id, raw) { calls.push(`set:${id}`); storage.setItem(id, raw); },
    removeItem(id) { calls.push(`remove:${id}`); storage.removeItem(id); },
  };
  const loaded = loadSave(port, key);
  assert.equal(loaded.blocked, false);
  assert.equal(loaded.raw, null);
  assert.deepEqual(calls, [`get:${key}`]);
  assert.equal(storage.length, unrelated.size);
  const written = writeSave(port, key, expedition(1), loaded.raw);
  assert.ok(written.ok);
  for (const [id, raw] of unrelated) assert.equal(storage.getItem(id), raw);
  assert.ok(calls.every((entry) => entry.endsWith(key)));
  assert.equal(storage.length, unrelated.size + 1);
});

test('invalid and future stored saves remain byte-for-byte preserved with automatic writing blocked', () => {
  const key = saveKey('/SE-Learning-Quest/');
  for (const raw of ['{broken', JSON.stringify({ ...newSave(), version: 99 })]) {
    const storage = new MemoryStorage();
    storage.setItem(key, raw);
    const loaded = loadSave(storage, key);
    assert.equal(loaded.blocked, true);
    assert.equal(loaded.raw, raw);
    assert.ok(loaded.notice.includes('preserved'));
    assert.deepEqual(loaded.save, newSave());
    assert.equal(storage.getItem(key), raw);
    assert.equal(storage.length, 1);
  }
});

test('storage-read failures return an exportable in-memory expedition instead of throwing', () => {
  const port: StoragePort = {
    getItem() { throw new Error('Denied'); },
    setItem() { throw new Error('Unexpected write'); },
    removeItem() { throw new Error('Unexpected removal'); },
  };
  const loaded = loadSave(port, saveKey('/blocked/'));
  assert.ok(loaded.blocked);
  assert.equal(loaded.raw, null);
  assert.match(loaded.notice, /storage is unavailable/i);
  roundTrip(loaded.save);
});

test('write compares the observed bytes and reports read or quota errors without claiming a save', () => {
  const key = saveKey('/test/');
  const save = expedition(1);
  const input = structuredClone(save);
  const storage = new MemoryStorage();
  const written = writeSave(storage, key, save, null);
  assert.ok(written.ok);
  assert.equal(written.raw, storage.getItem(key));
  assert.deepEqual(parseSave(written.raw), save);
  assert.deepEqual(save, input);
  for (const failure of ['read', 'write']) {
    const port: StoragePort = {
      getItem() { if (failure === 'read') throw new Error('Denied'); return written.raw; },
      setItem() { throw new Error('Quota'); },
      removeItem() { throw new Error('Unexpected removal'); },
    };
    const result = writeSave(port, key, save, written.raw);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'storage');
  }
});

test('a stale tab cannot replace observed newer progress and can resume after loading that progress', () => {
  const storage = new MemoryStorage();
  const key = saveKey('/tabs/');
  const seed = writeSave(storage, key, { ...newSave(), onboarded: true }, null);
  assert.ok(seed.ok);
  const tabA = loadSave(storage, key);
  const tabB = loadSave(storage, key);
  const newer = beginQuest(tabA.save, 'q01');
  const writeA = writeSave(storage, key, newer, tabA.raw);
  assert.ok(writeA.ok);
  const staleEdit = structuredClone(tabB.save);
  staleEdit.settings.highContrast = true;
  const writeB = writeSave(storage, key, staleEdit, tabB.raw);
  assert.equal(writeB.ok, false);
  if (!writeB.ok) assert.equal(writeB.reason, 'conflict');
  assert.equal(storage.getItem(key), writeA.raw);
  assert.equal(staleEdit.settings.highContrast, true);
  const reloaded = loadSave(storage, key);
  reloaded.save.settings.highContrast = true;
  const afterReload = writeSave(storage, key, reloaded.save, reloaded.raw);
  assert.ok(afterReload.ok);
  assert.ok(loadSave(storage, key).save.records.q01);
  assert.equal(loadSave(storage, key).save.settings.highContrast, true);
});

test('a removed stored snapshot is a conflict, not permission for an old tab to recreate it', () => {
  const storage = new MemoryStorage();
  const key = saveKey('/removed/');
  const result = writeSave(storage, key, expedition(1), null);
  assert.ok(result.ok);
  storage.removeItem(key);
  const stale = writeSave(storage, key, expedition(2), result.raw);
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.reason, 'conflict');
  assert.equal(storage.getItem(key), null);
});
