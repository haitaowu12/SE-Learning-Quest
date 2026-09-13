import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveSaveKey, archiveStep, canFinishArchive, dispatchArchive, evidenceReady, freshArchiveSave, MAX_ARCHIVE_ACTIONS, parseArchiveSave, replayArchive } from '../src/adventure/archive/model.ts';
import { consumeArchiveArrival, loadArchive, parseArchiveImport, prepareArchive, writeArchive } from '../src/adventure/archive/persistence.ts';
import type { ArchiveAction } from '../src/adventure/archive/types.ts';
import { councilSaveKey, freshCouncilSave } from '../src/adventure/council/model.ts';
import { saveKey as openingKey } from '../src/adventure/model.ts';
import { completedCouncil, councilActions, directHearing, recordedOpening, targetActions } from './council-helpers.ts';
import { addresses, archiveActions, completedArchive, evidence, proposedArchive, toTable } from './archive-helpers.ts';
import { MemoryStorage } from './helpers.ts';

test('both proposal routes preserve either hearing and every export prefix', () => {
  for (const hearing of ['direct', 'written'] as const) for (const route of ['amend', 'rebuild'] as const) {
    const arrival = completedCouncil(hearing), original = JSON.stringify(arrival);
    const finished = dispatchArchive(proposedArchive(route, freshArchiveSave(arrival)), { type: 'finish' });
    assert.equal(replayArchive(finished).complete, true);
    assert.deepEqual(replayArchive(finished).proposal, { lower: 'LQ07', crown: 'CS02', east: 'EL03', north: 'NW09' });
    for (let i = 0; i <= finished.actions.length; i++) {
      const prefix = { ...finished, actions: finished.actions.slice(0, i) };
      assert.deepEqual(parseArchiveSave(JSON.stringify(prefix)), prefix);
    }
    assert.equal(JSON.stringify(finished.arrival), original);
    assert.equal(JSON.stringify(arrival), original);
  }
  const alternate = councilActions([...directHearing, ...targetActions, { type: 'finish' }], freshCouncilSave(recordedOpening('messenger')));
  assert.deepEqual(proposedArchive('amend', freshArchiveSave(alternate)).arrival, alternate);
});

test('arrival and scene gates require real preceding evidence, with independent reading settings', () => {
  assert.throws(() => freshArchiveSave(freshCouncilSave(recordedOpening())), /Finish/);
  const arrival = completedCouncil(); arrival.settings.largeText = true;
  const save = freshArchiveSave(arrival); save.settings.largeText = false;
  assert.equal(save.arrival.settings.largeText, true); assert.equal(arrival.settings.largeText, true);
  assert.throws(() => dispatchArchive(save, { type: 'travel', scene: 'table' }), /Read list B/);
  assert.throws(() => dispatchArchive(archiveActions(toTable), { type: 'travel', scene: 'dispatch' }), /Compare/);
});

test('wrong evidence reports the missing account and supports correction without loss of sources', () => {
  let save = archiveActions([...toTable, { type: 'focus', quay: 'crown' }, { type: 'pin', slot: 'population', record: 'roll' }, { type: 'pin', slot: 'recipients', record: 'change' }, { type: 'review-evidence' }]);
  assert.equal(replayArchive(save).evidence!.gaps.length, 4);
  assert.match(replayArchive(save).evidence!.gaps[0], /Crown Steps appears/);
  assert.match(replayArchive(save).evidence!.gaps[2], /not the recipient list used/);
  save = archiveActions(evidence, save);
  assert.equal(evidenceReady(replayArchive(save)), true); assert.equal(replayArchive(save).discoveries.length, 5);
});

test('all evidence-pocket and rebuilt-address ordering permutations work', () => {
  function* orders<T>(items: T[]): Generator<T[]> {
    if (!items.length) yield [];
    else for (let i = 0; i < items.length; i++) for (const tail of orders(items.filter((_, j) => j !== i))) yield [items[i], ...tail];
  }
  for (const pins of orders(evidence.filter(a => a.type === 'pin'))) {
    assert.equal(evidenceReady(replayArchive(archiveActions([...toTable, { type: 'focus', quay: 'lower' }, ...pins, { type: 'review-evidence' }]))), true);
  }
  for (const order of orders(addresses)) {
    const save = archiveActions([...toTable, ...evidence, { type: 'choose-route', route: 'rebuild' }, ...order, { type: 'finding', finding: 'listed-only' }, { type: 'review-proposal' }, { type: 'label', status: 'proposed' }]);
    assert.equal(canFinishArchive(replayArchive(save)), true);
  }
});

test('switching routes resets the draft and an obsolete rollback requires repair', () => {
  let save = dispatchArchive(proposedArchive(), { type: 'choose-route', route: 'rebuild' });
  assert.deepEqual(replayArchive(save).proposal, {}); assert.equal(replayArchive(save).review, null);
  save = archiveActions([{ type: 'choose-route', route: 'amend' }, { type: 'address', quay: 'lower', address: 'LQ07' }, { type: 'address', quay: 'north', address: 'NW04' }, { type: 'review-proposal' }], save);
  assert.equal(replayArchive(save).review!.gaps.length, 1); assert.match(replayArchive(save).review!.gaps[0], /NW04 was superseded/);
  assert.throws(() => dispatchArchive(save, { type: 'finish' }));
  save = archiveActions([{ type: 'address', quay: 'north', address: 'NW09' }, { type: 'review-proposal' }, { type: 'label', status: 'proposed' }], save);
  assert.equal(canFinishArchive(replayArchive(save)), true);
});

test('neither universal warning nor universal non-receipt follows from the tally', () => {
  for (const finding of ['all-warned', 'none-received'] as const) {
    const save = archiveActions([{ type: 'finding', finding }, { type: 'review-proposal' }], proposedArchive());
    assert.equal(replayArchive(save).review!.gaps.length, 1); assert.equal(canFinishArchive(replayArchive(save)), false);
    assert.match(replayArchive(save).review!.gaps[0], finding === 'none-received' ? /does not erase/ : /neither a perceived local warning/);
  }
});

test('a reading seal supplies no service approval and rejection leaves the reviewed history unchanged', () => {
  const save = proposedArchive(), before = JSON.stringify(save);
  assert.throws(() => dispatchArchive(save, { type: 'label', status: 'approved' }), /authorizes reading.*unperformed/);
  assert.equal(JSON.stringify(save), before); assert.equal(canFinishArchive(replayArchive(save)), true);
});

test('changed evidence, addresses or findings invalidate the dependent review and stamp', () => {
  const table = dispatchArchive(proposedArchive(), { type: 'travel', scene: 'table' });
  for (const action of [{ type: 'focus', quay: 'north' }, { type: 'pin', slot: 'population', record: 'roll' }] as ArchiveAction[]) {
    const changed = dispatchArchive(table, action), state = replayArchive(changed);
    assert.equal(state.evidence, null); assert.equal(state.review, null); assert.equal(state.status, null);
    assert.equal(state.proposal.lower, 'LQ07'); assert.throws(() => dispatchArchive(changed, { type: 'travel', scene: 'dispatch' }));
  }
  for (const action of [{ type: 'address', quay: 'lower', address: 'omitted' }, { type: 'finding', finding: 'all-warned' }] as ArchiveAction[]) {
    const state = replayArchive(dispatchArchive(proposedArchive(), action));
    assert.equal(evidenceReady(state), true); assert.equal(state.review, null); assert.equal(state.status, null);
  }
});

test('unchanged selections and reviews preserve accepted work without growing history', () => {
  const save = proposedArchive();
  for (const action of [{ type: 'choose-route', route: 'amend' }, { type: 'address', quay: 'lower', address: 'LQ07' }, { type: 'finding', finding: 'listed-only' }, { type: 'review-proposal' }, { type: 'label', status: 'proposed' }] as ArchiveAction[]) assert.strictEqual(dispatchArchive(save, action), save);
  const table = dispatchArchive(save, { type: 'travel', scene: 'table' });
  for (const action of [{ type: 'focus', quay: 'lower' }, { type: 'pin', slot: 'population', record: 'survey' }, { type: 'review-evidence' }] as ArchiveAction[]) assert.strictEqual(dispatchArchive(table, action), table);
});

test('unread sources, wrong-scene actions and forged post-completion histories are rejected', () => {
  const unread = archiveActions(toTable.slice(0, -1));
  assert.throws(() => dispatchArchive(unread, { type: 'pin', slot: 'receipts', record: 'tally' }), /Read the source/);
  assert.throws(() => dispatchArchive(unread, { type: 'inspect', record: 'roll' }), /another scene/);
  const done = completedArchive();
  for (const action of [{ type: 'travel', scene: 'table' }, { type: 'inspect', record: 'tally' }, { type: 'finish' }] as ArchiveAction[]) {
    assert.throws(() => dispatchArchive(done, action), /recorded/);
    assert.throws(() => parseArchiveSave(JSON.stringify({ ...done, actions: [...done.actions, action] })), /recorded/);
  }
});

test('strict imports reject fabricated arrivals and unsupported shapes, bytes and action counts', () => {
  const save = completedArchive();
  for (const input of [null, [], {}, { ...save, version: 2 }, { ...save, complete: true }, { ...save, campaign: 'asterfall' },
    { ...save, settings: { largeText: 'true', lessMotion: false } }, { ...save, settings: { ...save.settings, extra: true } },
    { ...save, arrival: { complete: true } }, { ...save, arrival: { ...save.arrival, actions: [{ type: 'finish' }] } },
    { ...save, actions: [null] }, { ...save, actions: [{ type: 'toString' }] }, { ...save, actions: [{ type: 'inspect', record: 'roll', extra: true }] },
    { ...save, actions: [{ type: 'travel', scene: 'dispatch' }] }, { ...save, actions: [{ type: 'inspect', record: '__proto__' }] },
    { ...save, arrival: { ...save.arrival, arrival: { ...save.arrival.arrival, actions: [{ type: 'finish' }] } } },
  ]) assert.throws(() => parseArchiveSave(JSON.stringify(input)));
  assert.throws(() => parseArchiveSave(JSON.stringify({ ...save, padding: '界'.repeat(200_000) })), /600 KB/);
  assert.throws(() => parseArchiveSave(JSON.stringify({ ...save, actions: Array(1001).fill({ type: 'inspect', record: 'roll' }) })), /too many/);
  let capped = archiveActions(toTable), state = replayArchive(capped);
  const actions = [...capped.actions];
  while (actions.length < MAX_ARCHIVE_ACTIONS) {
    const action: ArchiveAction = { type: 'focus', quay: actions.length % 2 ? 'lower' : 'north' };
    state = archiveStep(state, action); actions.push(action);
  }
  capped = { ...capped, actions }; assert.deepEqual(parseArchiveSave(JSON.stringify(capped)), capped);
  assert.throws(() => dispatchArchive(capped, { type: 'focus', quay: state.focus === 'lower' ? 'north' : 'lower' }), /action limit/);
});

test('completed crossing exports continue without changing either predecessor storage namespace', () => {
  const storage = new MemoryStorage(), path = '/SE-Learning-Quest/';
  const crossing = JSON.stringify(completedCouncil('written')), opening = JSON.stringify(completedCouncil('written').arrival);
  storage.setItem(councilSaveKey(path), crossing); storage.setItem(openingKey(path), opening); storage.setItem('unrelated', 'keep');
  const loaded = loadArchive(storage, path); assert.ok(loaded.save);
  assert.equal(storage.getItem(archiveSaveKey(path)), null); assert.deepEqual(parseArchiveImport(crossing), loaded.save);
  assert.ok(writeArchive(storage, path, loaded.save, loaded.raw).ok);
  assert.equal(storage.getItem(councilSaveKey(path)), crossing); assert.equal(storage.getItem(openingKey(path)), opening); assert.equal(storage.getItem('unrelated'), 'keep');
  assert.equal(archiveSaveKey(path), archiveSaveKey(path + 'index.html')); assert.notEqual(archiveSaveKey(path), archiveSaveKey('/renamed-project/'));
  assert.throws(() => parseArchiveImport(opening));
});

test('corrupt originals are preserved and stale tabs cannot replace newer stored progress', () => {
  const path = '/archive-test/';
  for (const raw of ['', '{broken', JSON.stringify({ ...completedArchive(), version: 9 })]) {
    const storage = new MemoryStorage(); storage.setItem(archiveSaveKey(path), raw);
    const loaded = loadArchive(storage, path, completedCouncil());
    assert.equal(loaded.blocked, true); assert.equal(loaded.raw, raw); assert.equal(storage.getItem(archiveSaveKey(path)), raw);
  }
  const storage = new MemoryStorage(), initial = freshArchiveSave(completedCouncil());
  const first = writeArchive(storage, path, initial, null); assert.ok(first.ok);
  const tabA = loadArchive(storage, path), tabB = loadArchive(storage, path);
  const newer = writeArchive(storage, path, dispatchArchive(initial, { type: 'inspect', record: 'roll' }), tabA.raw); assert.ok(newer.ok);
  assert.equal(writeArchive(storage, path, tabB.save!, tabB.raw).ok, false);
  const returning = loadArchive(storage, path, null, tabB);
  assert.equal(returning.blocked, true); assert.deepEqual(returning.save, tabB.save); assert.equal(storage.getItem(archiveSaveKey(path)), newer.raw);
});

test('denied storage preserves actual continuation in tab memory and portable exports', () => {
  const denied = { getItem(): never { throw new Error('Denied'); }, setItem(): never { throw new Error('Denied'); } };
  assert.equal(loadArchive(denied, '/').save, null); assert.equal(loadArchive(new MemoryStorage(), '/').save, null);
  assert.throws(() => prepareArchive(freshCouncilSave(recordedOpening())));
  const arrival = completedCouncil('written'); prepareArchive(arrival); const carried = consumeArchiveArrival();
  assert.deepEqual(carried, arrival); assert.equal(consumeArchiveArrival(), null);
  const loaded = loadArchive(denied, '/', carried); assert.ok(loaded.save); assert.equal(loaded.blocked, true);
  const played = archiveActions(toTable, loaded.save), remembered = { ...loaded, save: played };
  assert.deepEqual(loadArchive(denied, '/', null, remembered).save, played); assert.equal(writeArchive(denied, '/', played, null).ok, false);
  assert.deepEqual(parseArchiveImport(JSON.stringify(played)), played);
});