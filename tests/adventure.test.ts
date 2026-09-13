import test from 'node:test';
import assert from 'node:assert/strict';
import { canFinish, dispatch, evaluateTrial, freshSave, parseChapterSave, replay, saveKey } from '../src/adventure/model.ts';
import type { Action, ChapterSave, Device } from '../src/adventure/model.ts';

const doAll = (actions: Action[], save = freshSave()): ChapterSave => actions.reduce(dispatch, save);
const arrival: Action[] = [{ type: 'inspect', clue: 'lamp' }, { type: 'inspect', clue: 'crystal' }, { type: 'travel', place: 'quay' }, { type: 'inspect', clue: 'mara' }, { type: 'inspect', clue: 'crew' }, { type: 'observe' }, { type: 'travel', place: 'bench' }];
function successful(device: Device): ChapterSave { return doAll([...arrival, { type: 'equip', device }, { type: 'brief', meaning: 'hold' }, { type: 'test' }]); }
function finish(save: ChapterSave): ChapterSave { return doAll([{ type: 'pin', claim: 'sent', clue: 'lamp' }, { type: 'pin', claim: 'acted', clue: 'trial' }, { type: 'finish' }], save); }

for (const device of ['beacon', 'messenger'] as const) {
  test(`the ${device} route completes the chapter using discovered conditions and replayable evidence`, () => {
    const save = finish(successful(device));
    const state = replay(save);
    assert.equal(state.complete, true);
    assert.equal(state.trial?.noticed, true);
    assert.equal(state.trial?.acted, true);
    assert.deepEqual(parseChapterSave(JSON.stringify(save)), save);
    for (let i = 0; i <= save.actions.length; i++) {
      const partial = { ...save, actions: save.actions.slice(0, i) };
      assert.deepEqual(replay(parseChapterSave(JSON.stringify(partial))), replay(partial));
    }
  });
}
test('the story requires its observations, not completion of optional decorative inspections', () => {
  assert.throws(() => dispatch(freshSave(), { type: 'travel', place: 'quay' }), /lamp and voice crystal/);
  const atQuay = doAll(arrival.slice(0, 3));
  assert.throws(() => dispatch(atQuay, { type: 'travel', place: 'bench' }), /Meet Mara/);
  const ready = doAll(arrival);
  assert.equal(replay(ready).clues.includes('ledger'), false);
  assert.equal(replay(ready).place, 'bench');
  assert.throws(() => dispatch(ready, { type: 'inspect', clue: 'crystal' }), /different scene/);
});
test('delivery, perception and agreed action are separate outcomes', () => {
  assert.deepEqual(evaluateTrial('bell', 'hold'), { device: 'bell', meaning: 'hold', noticed: false, acted: false });
  for (const device of ['beacon', 'messenger'] as const) {
    assert.equal(evaluateTrial(device, null).noticed, true);
    assert.equal(evaluateTrial(device, null).acted, false);
    assert.equal(evaluateTrial(device, 'wait').acted, false);
    assert.equal(evaluateTrial(device, 'hold').acted, true);
  }
  const failed = doAll([...arrival, { type: 'brief', meaning: 'hold' }, { type: 'test' }]);
  assert.equal(canFinish(replay(failed)), false);
  assert.throws(() => finish(failed), /Rehearse/);
});
test('records support distinct claims and cannot be interchanged to complete the story', () => {
  const save = successful('beacon');
  assert.throws(() => dispatch(save, { type: 'pin', claim: 'acted', clue: 'lamp' }), /tower log cannot show/);
  assert.throws(() => dispatch(save, { type: 'pin', claim: 'sent', clue: 'trial' }), /tower log/);
  assert.throws(() => dispatch(save, { type: 'finish' }), /Match the two records/);
  assert.equal(canFinish(replay(doAll([{ type: 'pin', claim: 'sent', clue: 'lamp' }, { type: 'pin', claim: 'acted', clue: 'trial' }], save))), true);
});
test('equipment and meaning changes invalidate observations and ledger pins until another rehearsal', () => {
  const save = doAll([{ type: 'pin', claim: 'sent', clue: 'lamp' }, { type: 'pin', claim: 'acted', clue: 'trial' }], successful('beacon'));
  for (const action of [{ type: 'equip', device: 'messenger' }, { type: 'brief', meaning: 'wait' }] as Action[]) {
    const changed = dispatch(save, action);
    const state = replay(changed);
    assert.equal(state.trial, null);
    assert.equal(state.clues.includes('trial'), false);
    assert.deepEqual(state.pins, {});
    assert.equal(canFinish(state), false);
    assert.throws(() => dispatch(changed, { type: 'finish' }));
    assert.deepEqual(parseChapterSave(JSON.stringify(changed)), changed);
  }
  const unchanged = dispatch(save, { type: 'equip', device: 'beacon' });
  assert.strictEqual(unchanged, save);
});
test('completed history rejects subsequent gameplay changes, including imported travel', () => {
  const save = finish(successful('messenger'));
  assert.throws(() => dispatch(save, { type: 'equip', device: 'beacon' }), /recorded/);
  assert.throws(() => dispatch(save, { type: 'test' }), /recorded/);
  assert.throws(() => dispatch(save, { type: 'finish' }), /recorded/);
  assert.throws(() => dispatch(save, { type: 'travel', place: 'workshop' }), /recorded/);
  assert.throws(() => parseChapterSave(JSON.stringify({ ...save, actions: [...save.actions, { type: 'travel', place: 'quay' }] })), /recorded/);
});
test('revisiting an object does not duplicate discoveries or inflate the save', () => {
  const first = dispatch(freshSave(), { type: 'inspect', clue: 'lamp' });
  assert.strictEqual(dispatch(first, { type: 'inspect', clue: 'lamp' }), first);
  assert.deepEqual(replay(first).clues, ['lamp']);
});
test('actions never mutate their inputs and rejected inputs preserve the existing expedition', () => {
  const save = doAll(arrival);
  const before = structuredClone(save);
  dispatch(save, { type: 'equip', device: 'beacon' });
  assert.deepEqual(save, before);
  assert.throws(() => dispatch(save, { type: 'equip', device: 'invented' } as never));
  assert.deepEqual(save, before);
});
test('imports reject foreign versions, fabricated state, invalid actions and broken chronology', () => {
  const valid = successful('beacon');
  const variants: unknown[] = [null, [], { ...valid, version: 2 }, { ...valid, campaign: 'asterfall' }, { ...valid, complete: true }, { ...valid, actions: [{ type: 'finish' }] }, { ...valid, actions: [{ type: 'travel', place: 'bench' }] }, { ...valid, actions: [null] }, { ...valid, actions: [{ type: 'toString' }] }, { ...valid, actions: [{ type: 'inspect', clue: 'lamp', reward: 999 }] }, { ...valid, settings: { lessMotion: true, largeText: 1 } }, { ...valid, actions: [...valid.actions, { type: 'pin', claim: '__proto__', clue: 'trial' }] }];
  for (const value of variants) assert.throws(() => parseChapterSave(JSON.stringify(value)));
  assert.throws(() => parseChapterSave('{broken'), /JSON/);
  assert.throws(() => parseChapterSave(JSON.stringify({ ...valid, padding: '界'.repeat(100_000) })), /250 KB/);
});
test('illustrated saves normalize the deployment path and cannot collide with Classic', () => {
  assert.equal(saveKey('/SE-Learning-Quest/index.html'), saveKey('/SE-Learning-Quest/'));
  assert.notEqual(saveKey('/SE-Learning-Quest/'), 'se_learning_quest_asterfall_v1:/SE-Learning-Quest');
  assert.notEqual(saveKey('/SE-Learning-Quest/'), saveKey('/other/'));
  assert.equal(saveKey('/'), saveKey('/index.html'));
});
