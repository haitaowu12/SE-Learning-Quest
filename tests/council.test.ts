import test from 'node:test';
import assert from 'node:assert/strict';
import { freshSave, replay as replayOpening, saveKey as openingKey } from '../src/adventure/model.ts';
import { consumeCrossing, prepareCrossing } from '../src/adventure/crossing.ts';
import { recallInTab, rememberInTab } from '../src/adventure/tab-memory.ts';
import { canFinishCouncil, councilSaveKey, dispatchCouncil, freshCouncilSave, hearingReady, parseCouncilSave, promiseReady, replayCouncil, seats } from '../src/adventure/council/model.ts';
import { loadCouncil, parseCrossingImport, writeCouncil } from '../src/adventure/council/persistence.ts';
import type { CouncilAction, CouncilSave } from '../src/adventure/council/types.ts';
import { councilActions, completedCouncil, directHearing, recordedOpening, targetActions, toHearing, writtenHearing } from './council-helpers.ts';
import { MemoryStorage } from './helpers.ts';

for (const route of ['direct', 'written'] as const) {
  test(`${route} hearing reaches a recorded target and replayable two-chapter journal`, () => {
    const save = completedCouncil(route);
    const state = replayCouncil(save);
    assert.equal(state.complete, true);
    assert.equal(state.evidenceStatus, 'planned');
    assert.equal(state.hearing?.route, route === 'direct' ? 'in-person' : 'written');
    assert.equal(state.readback, route === 'written');
    assert.equal(replayOpening(save.arrival).complete, true);
    assert.deepEqual(save.arrival, recordedOpening());
    for (let end = 0; end <= save.actions.length; end++) {
      const partial = { ...save, actions: save.actions.slice(0, end) };
      assert.deepEqual(parseCouncilSave(JSON.stringify(partial)), partial);
    }
  });
}

test('old opening exports are accepted only after the recorded watch handover and retain their chosen branch', () => {
  for (const device of ['beacon', 'messenger'] as const) {
    const opening = recordedOpening(device);
    const before = structuredClone(opening);
    const crossing = parseCrossingImport(JSON.stringify(opening));
    assert.deepEqual(crossing.arrival, opening);
    assert.equal(replayOpening(crossing.arrival).device, device);
    const played = councilActions(directHearing, crossing);
    assert.deepEqual(played.arrival, before);
    assert.deepEqual(opening, before);
  }
  assert.throws(() => freshCouncilSave(freshSave()), /Finish Mara/);
  assert.throws(() => parseCrossingImport(JSON.stringify(freshSave())), /Finish Mara/);
  const incomplete = recordedOpening();
  incomplete.actions.pop();
  assert.throws(() => parseCouncilSave(JSON.stringify({ ...completedCouncil(), arrival: incomplete })), /Finish the opening/);
});

test('chapter-one observations and hearing accounts precede dependent actions', () => {
  const fresh = freshCouncilSave(recordedOpening());
  assert.throws(() => dispatchCouncil(fresh, { type: 'travel', scene: 'hearing' }), /register/);
  const hearing = councilActions(toHearing);
  assert.throws(() => dispatchCouncil(hearing, { type: 'seat', guest: 'mara', seat: 'left' }), /Ask/);
  assert.throws(() => dispatchCouncil(hearing, { type: 'relief' }), /night keeper/);
  assert.throws(() => dispatchCouncil(hearing, { type: 'collect-note' }), /night keeper and Neri/);
  assert.throws(() => dispatchCouncil(hearing, { type: 'travel', scene: 'atelier' }), /Hear/);
  const atelier = councilActions([...directHearing, { type: 'travel', scene: 'atelier' }]);
  assert.throws(() => dispatchCouncil(atelier, { type: 'place', slot: 'who', token: 'inhabited' }), /demonstration/);
});

test('the night keeper cannot leave the post without relief; the written route needs the actual account and readback', () => {
  let direct = councilActions(directHearing.filter(a => a.type !== 'relief'));
  assert.equal(hearingReady(replayCouncil(direct)), false);
  assert.match(replayCouncil(direct).hearing!.gaps.join(' '), /still on duty/);
  direct = councilActions([{ type: 'relief' }, { type: 'hear' }], direct);
  assert.equal(hearingReady(replayCouncil(direct)), true);
  let written = councilActions(writtenHearing.filter(a => a.type !== 'collect-note' && a.type !== 'readback'));
  assert.equal(hearingReady(replayCouncil(written)), false);
  assert.match(replayCouncil(written).hearing!.gaps.join(' '), /no night-watch account/);
  assert.throws(() => dispatchCouncil(written, { type: 'readback' }), /signed/);
  written = councilActions([{ type: 'collect-note' }, { type: 'hear' }], written);
  assert.equal(hearingReady(replayCouncil(written)), false);
  assert.throws(() => dispatchCouncil(written, { type: 'travel', scene: 'atelier' }), /confirm/);
  written = dispatchCouncil(written, { type: 'readback' });
  assert.equal(hearingReady(replayCouncil(written)), true);
});

test('all six seating orders work, and reassigning a chair never duplicates a guest', () => {
  for (const first of seats) for (const second of seats.filter(s => s !== first)) {
    const third = seats.find(s => s !== first && s !== second)!;
    const actions = directHearing.filter(a => a.type !== 'seat' && a.type !== 'hear');
    const save = councilActions([...actions, { type: 'seat', guest: 'mara', seat: first }, { type: 'seat', guest: 'tavi', seat: second }, { type: 'seat', guest: 'night', seat: third }, { type: 'hear' }]);
    assert.equal(hearingReady(replayCouncil(save)), true);
    const moved = dispatchCouncil(save, { type: 'seat', guest: 'mara', seat: second });
    assert.equal(Object.values(replayCouncil(moved).seats).filter(g => g === 'mara').length, 1);
    assert.equal(replayCouncil(moved).seats[first], undefined);
    assert.equal(Object.values(replayCouncil(moved).seats).includes('tavi'), false);
    assert.equal(replayCouncil(moved).hearing, null);
  }
});

test('changing a guest after target review invalidates the hearing, readback, review and evidence status', () => {
  let save = councilActions([...writtenHearing, ...targetActions]);
  assert.equal(canFinishCouncil(replayCouncil(save)), true);
  save = councilActions([{ type: 'travel', scene: 'hearing' }, { type: 'unseat', seat: 'left' }], save);
  const state = replayCouncil(save);
  assert.equal(state.hearing, null);
  assert.equal(state.readback, false);
  assert.equal(state.review, null);
  assert.equal(state.evidenceStatus, null);
  assert.equal(canFinishCouncil(state), false);
  assert.equal(state.promise.conditions, 'west40-link-out');
  assert.throws(() => dispatchCouncil(save, { type: 'travel', scene: 'atelier' }));
});

test('a new promise choice invalidates its own review and stamp without rewriting the hearing', () => {
  const save = councilActions([...directHearing, ...targetActions]);
  for (const action of [
    { type: 'place', slot: 'who', token: 'registered' }, { type: 'place', slot: 'what', token: 'lamp' },
    { type: 'place', slot: 'when', token: 'twentyTwo' }, { type: 'place', slot: 'conditions', token: 'calm' },
  ] as CouncilAction[]) {
    const changed = dispatchCouncil(save, action);
    const state = replayCouncil(changed);
    assert.equal(state.review, null);
    assert.equal(state.evidenceStatus, null);
    assert.equal(promiseReady(state), false);
    assert.deepEqual(state.hearing, replayCouncil(save).hearing);
    assert.throws(() => dispatchCouncil(changed, { type: 'finish' }));
  }
});

test('the demonstration cannot be stamped as proof of the wider requirement, with no mutation or lost review', () => {
  const save = councilActions([...directHearing, ...targetActions.slice(0, -1)]);
  const before = structuredClone(save);
  assert.throws(() => dispatchCouncil(save, { type: 'label', status: 'proven' }), /22-second central demonstration/);
  assert.deepEqual(save, before);
  assert.equal(promiseReady(replayCouncil(save)), true);
  assert.equal(replayCouncil(save).evidenceStatus, null);
  const planned = dispatchCouncil(save, { type: 'label', status: 'planned' });
  assert.equal(canFinishCouncil(replayCouncil(planned)), true);
});

test('wrong or incomplete promise tiles can be revised while an unsupported drop is rejected', () => {
  let save = councilActions([...directHearing, ...targetActions.slice(0, 2)]);
  assert.throws(() => dispatchCouncil(save, { type: 'place', slot: 'who', token: 'ninety' }), /different part/);
  save = councilActions([{ type: 'place', slot: 'who', token: 'registered' }, { type: 'review' }], save);
  assert.equal(replayCouncil(save).review?.gaps.length, 4);
  save = councilActions(targetActions.slice(2), save);
  assert.equal(canFinishCouncil(replayCouncil(save)), true);
});

test('repeat selection and review are idempotent and do not erase already confirmed facts', () => {
  const heard = councilActions(writtenHearing);
  assert.strictEqual(dispatchCouncil(heard, { type: 'hear' }), heard);
  assert.strictEqual(dispatchCouncil(heard, { type: 'collect-note' }), heard);
  assert.strictEqual(dispatchCouncil(heard, { type: 'readback' }), heard);
  const planned = councilActions(targetActions, heard);
  assert.strictEqual(dispatchCouncil(planned, { type: 'review' }), planned);
  assert.strictEqual(dispatchCouncil(planned, { type: 'place', slot: 'who', token: 'inhabited' }), planned);
});

test('completion prevents post-completion travel, guest edits and invented replay actions', () => {
  const save = completedCouncil();
  for (const action of [{ type: 'travel', scene: 'hearing' }, { type: 'inspect', discovery: 'demo' }, { type: 'finish' }] as CouncilAction[]) {
    assert.throws(() => dispatchCouncil(save, action), /recorded/);
    assert.throws(() => parseCouncilSave(JSON.stringify({ ...save, actions: [...save.actions, action] })), /recorded/);
  }
});

test('imports reject fabricated arrivals, unsupported versions, extra fields, action shapes and future evidence', () => {
  const save = completedCouncil();
  const invalid: unknown[] = [null, [], { ...save, version: 2 }, { ...save, campaign: 'asterfall' }, { ...save, complete: true },
    { ...save, arrival: { complete: true } }, { ...save, arrival: { ...save.arrival, actions: [{ type: 'finish' }] } },
    { ...save, settings: { lessMotion: true, largeText: 'true' } }, { ...save, actions: [null] },
    { ...save, actions: [{ type: 'toString' }] }, { ...save, actions: [{ type: 'inspect', discovery: 'roll', points: 42 }] },
    { ...save, actions: [{ type: 'travel', scene: 'atelier' }] }, { ...save, actions: [{ type: 'label', status: 'proven' }] },
  ];
  for (const input of invalid) assert.throws(() => parseCouncilSave(JSON.stringify(input)));
  assert.throws(() => parseCouncilSave(JSON.stringify({ ...save, padding: '界'.repeat(150_000) })), /400 KB/);
  assert.throws(() => parseCouncilSave(JSON.stringify({ ...save, actions: Array.from({ length: 1001 }, () => ({ type: 'inspect', discovery: 'roll' })) })), /too many actions/);
});

test('loading a completed opening starts a separate crossing without writes or altering the opening', () => {
  const storage = new MemoryStorage();
  const path = '/SE-Learning-Quest/';
  const opening = JSON.stringify(recordedOpening('messenger'));
  storage.setItem(openingKey(path), opening);
  storage.setItem('unrelated', 'unchanged');
  const loaded = loadCouncil(storage, path);
  assert.ok(loaded.save);
  assert.equal(loaded.raw, null);
  assert.equal(storage.getItem(councilSaveKey(path)), null);
  assert.equal(replayOpening(loaded.save.arrival).device, 'messenger');
  const result = writeCouncil(storage, path, loaded.save, loaded.raw);
  assert.equal(result.ok, true);
  assert.equal(storage.getItem(openingKey(path)), opening);
  assert.equal(storage.getItem('unrelated'), 'unchanged');
  assert.notEqual(councilSaveKey(path), openingKey(path));
  assert.equal(councilSaveKey(path), councilSaveKey('/SE-Learning-Quest/index.html'));
  assert.notEqual(councilSaveKey('/'), councilSaveKey(path));
});

test('corrupt, future and stale stored crossings are preserved until explicit replacement', () => {
  const path = '/SE-Learning-Quest/';
  for (const raw of ['', '{broken', JSON.stringify({ ...completedCouncil(), version: 2 })]) {
    const storage = new MemoryStorage();
    storage.setItem(councilSaveKey(path), raw);
    const loaded = loadCouncil(storage, path, recordedOpening());
    assert.equal(loaded.blocked, true);
    assert.equal(loaded.raw, raw);
    assert.equal(storage.getItem(councilSaveKey(path)), raw);
  }
  const storage = new MemoryStorage();
  const tabA = freshCouncilSave(recordedOpening());
  const first = writeCouncil(storage, path, tabA, null);
  assert.ok(first.ok);
  const tabB = loadCouncil(storage, path);
  assert.ok(tabB.save);
  const newer = dispatchCouncil(tabA, { type: 'inspect', discovery: 'roll' });
  const written = writeCouncil(storage, path, newer, first.raw);
  assert.ok(written.ok);
  assert.equal(writeCouncil(storage, path, tabB.save, tabB.raw).ok, false);
  assert.equal(storage.getItem(councilSaveKey(path)), written.raw);
});

test('the in-memory ferry crossing supports denied storage and exports its actual opening history', () => {
  const opening = recordedOpening('messenger');
  prepareCrossing(opening);
  const crossing = consumeCrossing();
  assert.deepEqual(crossing, opening);
  assert.equal(consumeCrossing(), null);
  assert.throws(() => prepareCrossing(freshSave()));
  const denied = { getItem(): never { throw new Error('Denied'); }, setItem(): never { throw new Error('Denied'); } };
  const loaded = loadCouncil(denied, '/', crossing);
  assert.equal(loaded.blocked, true);
  assert.ok(loaded.save);
  const played = councilActions(directHearing, loaded.save);
  const restored: CouncilSave = parseCouncilSave(JSON.stringify(played));
  assert.equal(hearingReady(replayCouncil(restored)), true);
  assert.equal(replayOpening(restored.arrival).device, 'messenger');
});

test('route navigation retains unsaved crossing state and still detects changes made by another tab', () => {
  const path = '/memory-test/';
  const key = councilSaveKey(path);
  const played = councilActions(writtenHearing);
  rememberInTab(key, { save: played, raw: null, blocked: true, notice: 'Storage denied' });
  const remembered = recallInTab<CouncilSave>(key);
  assert.ok(remembered);
  const denied = { getItem(): never { throw new Error('Denied'); }, setItem(): never { throw new Error('Denied'); } };
  const restored = loadCouncil(denied, path, null, remembered);
  assert.deepEqual(restored.save, played);
  assert.equal(restored.blocked, true);
  assert.match(restored.notice, /reloading or closing/);
  const storage = new MemoryStorage();
  const other = JSON.stringify(completedCouncil());
  storage.setItem(key, other);
  const conflict = loadCouncil(storage, path, null, remembered);
  assert.equal(conflict.blocked, true);
  assert.deepEqual(conflict.save, played);
  assert.match(conflict.notice, /while you were away/);
  assert.equal(storage.getItem(key), other);
  remembered.save.actions.length = 0;
  assert.deepEqual(recallInTab<CouncilSave>(key)!.save, played);
});
