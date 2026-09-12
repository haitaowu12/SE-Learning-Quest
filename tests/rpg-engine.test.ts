import test from 'node:test';
import assert from 'node:assert/strict';
import { quests, questById } from '../src/rpg/campaign.ts';
import {
  beginQuest, canComplete, choose, completeQuest, derive, ending, flagsBefore,
  newSave, nextDecision, puzzlePassed, retryQuest, storyDecisions, submitPuzzle,
  tradeTotals, train,
} from '../src/rpg/engine.ts';
import type { Choice, Decision, Quality, Quest, Save } from '../src/rpg/types.ts';

type Selector = (decision: Decision, quest: Quest) => Choice;

function quest(id: string): Quest {
  const found = questById.get(id);
  assert.ok(found, `The production campaign contains ${id}`);
  return found;
}

// Some contextual choices deliberately have no weak option (and q24 governance
// has no universally strongest form). Use the nearest available quality.
function prefer(quality: Quality): Selector {
  const order: Quality[] = quality === 'weak' ? ['weak', 'mixed', 'strong']
    : quality === 'mixed' ? ['mixed', 'strong', 'weak'] : ['strong', 'mixed', 'weak'];
  return (decision) => {
    const selected = order.flatMap((item) => decision.options.filter((option) => option.quality === item))[0];
    assert.ok(selected, `An available choice exists for ${decision.id}`);
    return selected;
  };
}

function converse(save: Save, current: Quest, select: Selector = prefer('strong')): Save {
  let next = beginQuest(save, current.id);
  for (let decision = nextDecision(next, current); decision; decision = nextDecision(next, current)) {
    next = choose(next, decision.id, select(decision, current).id);
  }
  return next;
}

function finish(save: Save, current: Quest, select: Selector = prefer('strong')): Save {
  let next = converse(save, current, select);
  if (current.puzzle) next = submitPuzzle(next, structuredClone(current.puzzle.solution));
  return completeQuest(next);
}

function journey(select: Selector = prefer('strong'), count = quests.length): Save {
  let save = { ...newSave('Ari', 'analysis'), onboarded: true };
  for (const current of quests.slice(0, count)) save = finish(save, current, select);
  return save;
}

function bench(id: string): Save {
  return converse(journey(prefer('strong'), quests.findIndex((entry) => entry.id === id)), quest(id));
}

test('new expeditions have isolated state, a bounded name and their chosen origin', () => {
  const first = newSave('  Ari  ', 'analysis');
  const other = newSave();
  assert.equal(first.player.name, 'Ari');
  assert.equal(newSave('   ').player.name, 'Iona');
  assert.equal(newSave('a'.repeat(30)).player.name.length, 24);
  assert.equal(first.onboarded, false);
  assert.equal(derive(first).skills.analysis, 1);
  assert.equal(derive(first).xp, 0);
  first.settings.highContrast = true;
  first.talents.push('craft');
  assert.equal(other.settings.highContrast, false);
  assert.deepEqual(other.talents, []);
  assert.deepEqual(other.records, {});
});

test('onboarding and both sides of the q02/q03 prerequisite join are required', () => {
  assert.throws(() => beginQuest(newSave(), 'q01'));
  const start = { ...newSave(), onboarded: true };
  assert.deepEqual(derive(start).unlocked, ['q01']);
  assert.throws(() => beginQuest(start, 'q02'));
  assert.throws(() => beginQuest(start, 'missing'));
  let save = finish(start, quest('q01'));
  assert.ok(derive(save).unlocked.includes('q02'));
  assert.ok(derive(save).unlocked.includes('q03'));
  save = finish(save, quest('q03'));
  assert.throws(() => beginQuest(save, 'q04'));
  save = finish(save, quest('q02'));
  assert.ok(derive(save).unlocked.includes('q04'));
  assert.equal(beginQuest(save, 'q04').activeQuestId, 'q04');
  assert.deepEqual(derive(save).completed, ['q01', 'q02', 'q03']);
});

test('conversation order and choice membership are enforced without changing the input save', () => {
  const current = quest('q01');
  const save = beginQuest({ ...newSave(), onboarded: true }, current.id);
  const before = structuredClone(save);
  const [first, second] = current.decisions;
  assert.throws(() => choose(save, second.id, second.options[0].id));
  assert.throws(() => choose(save, first.id, 'not-a-choice'));
  assert.throws(() => submitPuzzle(save, current.puzzle!.solution));
  assert.throws(() => completeQuest(save));
  const next = choose(save, first.id, first.options[0].id);
  assert.deepEqual(save, before);
  assert.equal(nextDecision(next, current)?.id, second.id);
  assert.throws(() => choose(next, first.id, first.options[1].id));
  assert.equal(derive(next).xp, 0);
});

for (const quality of ['strong', 'mixed', 'weak'] as const) {
  test(`${quality}-preference choices can complete the actual 24-quest campaign without resource soft locks`, () => {
    const save = journey(prefer(quality));
    const state = derive(save);
    assert.equal(state.completed.length, 24);
    assert.deepEqual(state.completed, quests.map((entry) => entry.id));
    assert.ok(ending(save));
    assert.ok(state.xp > 0);
    assert.ok(state.badges.length >= 7);
    assert.equal(Object.values(state.skills).reduce((sum, value) => sum + value, 0), 25);
    assert.deepEqual(new Set(state.concepts), new Set(quests.flatMap((entry) => [...entry.processes, ...entry.concepts])));
    for (const value of Object.values(state.metrics)) assert.ok(value >= 0 && value <= 100);
    for (const current of quests) {
      assert.ok(save.records[current.id].completed);
      if (current.puzzle) assert.ok(puzzlePassed(current.puzzle, save.records[current.id].puzzleAnswer));
    }
  });
}

test('all three epilogues are reachable and only a completed campaign has an epilogue', () => {
  const strong = journey();
  const varied = journey(prefer('mixed'));
  const weak = journey(prefer('weak'));
  assert.equal(ending(journey(prefer('strong'), 23)), null);
  assert.equal(ending(strong)?.title, 'A constellation, not a crown');
  assert.equal(ending(varied)?.title, 'The patient light');
  assert.equal(ending(weak)?.title, 'A second dawn');
  assert.ok(derive(strong).xp > derive(varied).xp);
  assert.ok(derive(varied).xp > derive(weak).xp);
});

const branches = [
  ['q04', 'voices', 'none'],
  ['q13', 'integration', 'rush'],
  ['q14', 'alarm-target', 'vague'],
  ['q16', 'voices', 'none'],
  ['q18', 'topology', 'hub'],
  ['q21', 'baseline', 'none'],
  ['q23', 'baseline', 'partial'],
] as const;

for (const [id, flag, value] of branches) {
  test(`${id} requires its conditional conversation only after ${flag}=${value}`, () => {
    const current = quest(id);
    const index = quests.indexOf(current);
    const conditional = current.decisions.find((decision) => decision.when?.flag === flag && decision.when.value === value);
    assert.ok(conditional);
    const select: Selector = (decision, entry) => decision.options.find((choice) => choice.flag?.key === flag && choice.flag.value === value) ?? prefer('strong')(decision, entry);
    const before = journey(select, index);
    const control = journey(prefer('strong'), index);
    assert.equal(flagsBefore(before, current)[flag], value);
    assert.ok(storyDecisions(before, current).some((decision) => decision.id === conditional.id));
    assert.ok(!storyDecisions(control, current).some((decision) => decision.id === conditional.id));
    let save = beginQuest(before, id);
    for (let decision = nextDecision(save, current); decision && decision.id !== conditional.id; decision = nextDecision(save, current)) {
      save = choose(save, decision.id, prefer('strong')(decision, current).id);
    }
    assert.equal(nextDecision(save, current)?.id, conditional.id);
    assert.equal(canComplete(save, current), false);
    assert.throws(() => completeQuest(save));
    if (current.puzzle) assert.throws(() => submitPuzzle(save, current.puzzle!.solution));
    save = choose(save, conditional.id, prefer('strong')(conditional, current).id);
    if (current.puzzle) save = submitPuzzle(save, current.puzzle.solution);
    assert.ok(completeQuest(save).records[id].completed);
  });
}

test('later flags do not change an earlier conversation or its historical echoes', () => {
  const early = journey(prefer('weak'), 3);
  const full = journey(prefer('weak'));
  const current = quest('q04');
  assert.deepEqual(flagsBefore(full, current), flagsBefore(early, current));
  assert.deepEqual(storyDecisions(full, current), storyDecisions(early, current));
  assert.equal(flagsBefore(full, current).governance, undefined);
  assert.ok(derive(full).flags.governance);
});

test('all authored puzzle solutions pass, with set, map and sequence semantics preserved', () => {
  for (const current of quests) {
    const puzzle = current.puzzle;
    if (!puzzle) continue;
    assert.ok(puzzlePassed(puzzle, structuredClone(puzzle.solution)), current.id);
    assert.equal(puzzlePassed(puzzle, null), false, current.id);
    if (Array.isArray(puzzle.solution)) {
      const solution = puzzle.solution;
      assert.equal(puzzlePassed(puzzle, solution.slice(1)), false, `${current.id}: incomplete`);
      assert.equal(puzzlePassed(puzzle, [...solution, 'unknown-item']), false, `${current.id}: extra`);
      if (solution.length > 1) {
        assert.equal(puzzlePassed(puzzle, solution.map(() => solution[0])), false, `${current.id}: duplicates`);
        assert.equal(puzzlePassed(puzzle, [...solution].reverse()), puzzle.kind !== 'order', `${current.id}: ordering`);
      }
    } else {
      const entries = Object.entries(puzzle.solution);
      assert.ok(puzzlePassed(puzzle, Object.fromEntries([...entries].reverse())), `${current.id}: map order`);
      assert.equal(puzzlePassed(puzzle, Object.fromEntries(entries.slice(1))), false, `${current.id}: incomplete map`);
      assert.equal(puzzlePassed(puzzle, { ...puzzle.solution, extra: entries[0][1] }), false, `${current.id}: extra map key`);
      const alternate = puzzle.categories!.find((category) => category.id !== entries[0][1])!;
      assert.equal(puzzlePassed(puzzle, { ...puzzle.solution, [entries[0][0]]: alternate.id }), false, `${current.id}: wrong category`);
      assert.equal(puzzlePassed(puzzle, []), false);
    }
  }
});

test('actual weighted matrices have the computed unique winner and reject every inferior candidate', () => {
  const expected = {
    q08: { copper: 75, glass: 73, reed: 80, runner: 75 },
    q18: { 'standard-spares': 20, 'independent-unit': 22, 'shore-crew': 19 },
    q22: { 'extend-yard': 26, 'broad-expansion': 19, 'modular-pilot': 27 },
  };
  for (const [id, totals] of Object.entries(expected)) {
    const puzzle = quest(id).puzzle!;
    assert.deepEqual(tradeTotals(puzzle), totals);
    const ranking = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    assert.ok(ranking[0][1] > ranking[1][1]);
    for (const item of puzzle.items) assert.equal(puzzlePassed(puzzle, [item.id]), item.id === ranking[0][0]);
  }
});

test('failed attempts award no XP, assistance needs two attempts and earns its stated reduced bench reward', () => {
  const current = quest('q01');
  let save = bench(current.id);
  assert.throws(() => submitPuzzle(save, current.puzzle!.solution, true));
  save = submitPuzzle(save, []);
  assert.equal(save.records.q01.attempts, 1);
  assert.equal(derive(save).xp, 0);
  assert.equal(canComplete(save, current), false);
  assert.throws(() => completeQuest(save));
  assert.throws(() => submitPuzzle(save, current.puzzle!.solution, true));
  save = submitPuzzle(save, []);
  save = submitPuzzle(save, [], true);
  assert.equal(save.records.q01.attempts, 2);
  assert.ok(save.records.q01.assisted);
  assert.ok(puzzlePassed(current.puzzle!, save.records.q01.puzzleAnswer));
  const complete = completeQuest(save);
  assert.equal(derive(complete).xp, 170);
  assert.equal(derive(journey(prefer('strong'), 1)).xp, 190);
  assert.ok(derive(complete).badges.includes('Learned Through Repair'));
});

test('retry removes this quest’s provisional flags and effects without farming or undoing earlier rewards', () => {
  const previous = journey(prefer('strong'), 1);
  let save = beginQuest(previous, 'q02');
  const current = quest('q02');
  const decision = nextDecision(save, current)!;
  const choice = decision.options.find((item) => item.flag?.value === 'none')!;
  save = choose(save, decision.id, choice.id);
  assert.equal(derive(save).flags.voices, 'none');
  const retried = retryQuest(save);
  assert.equal(derive(retried).flags.voices, undefined);
  assert.deepEqual(derive(retried).metrics, derive(previous).metrics);
  assert.equal(derive(retried).xp, derive(previous).xp);
  assert.deepEqual(retried.records.q01, previous.records.q01);
  assert.deepEqual(retried.records.q02.decisions, {});
  assert.equal(retried.records.q02.attempts, 1);
  assert.equal(derive(save).flags.voices, 'none');
});

test('claiming and revisiting completed quests cannot repeat rewards or rewrite history', () => {
  const saved = journey(prefer('strong'), 4);
  const original = structuredClone(saved);
  const revisited = beginQuest(saved, 'q01');
  assert.strictEqual(completeQuest(revisited), revisited);
  assert.equal(derive(revisited).xp, derive(saved).xp);
  assert.throws(() => retryQuest(revisited));
  assert.throws(() => choose(revisited, quest('q01').decisions[0].id, quest('q01').decisions[0].options[0].id));
  assert.throws(() => submitPuzzle(revisited, quest('q01').puzzle!.solution));
  assert.deepEqual(saved, original);
});

test('attempts remain bounded without accumulating rewards', () => {
  let save = bench('q01');
  save.records.q01.attempts = 998;
  save = submitPuzzle(save, []);
  save = submitPuzzle(save, []);
  assert.equal(save.records.q01.attempts, 999);
  assert.equal(retryQuest(save).records.q01.attempts, 999);
  assert.equal(derive(save).xp, 0);
});

test('training consumes only earned points and grants the stated skill increase', () => {
  assert.throws(() => train(newSave(), 'craft'));
  const save = journey(prefer('strong'), 3);
  assert.equal(derive(save).level, 2);
  assert.equal(derive(save).talentPoints, 1);
  const trained = train(save, 'craft');
  assert.equal(derive(trained).skills.craft, derive(save).skills.craft + 2);
  assert.equal(derive(trained).talentPoints, 0);
  assert.equal(derive(trained).xp, derive(save).xp);
  assert.deepEqual(save.talents, []);
  assert.throws(() => train(trained, 'empathy'));
  let final = journey();
  const budget = derive(final).talentPoints;
  for (let i = 0; i < budget; i++) final = train(final, 'assurance');
  assert.equal(derive(final).talentPoints, 0);
  assert.throws(() => train(final, 'assurance'));
});

test('runtime puzzle submission rejects unknown items and incompatible answer shapes', () => {
  const select = bench('q01');
  const before = structuredClone(select);
  assert.throws(() => submitPuzzle(select, ['unknown-item']));
  assert.throws(() => submitPuzzle(select, {}));
  assert.deepEqual(select, before);
  const match = bench('q02');
  assert.throws(() => submitPuzzle(match, []));
  assert.throws(() => submitPuzzle(match, { 'masked-bell': 'unknown-category' }));
  assert.throws(() => submitPuzzle(match, { 'unknown-item': 'perceive' }));
});

test('playing and grading do not mutate the authored campaign data', () => {
  const before = structuredClone(quests);
  journey(prefer('weak'));
  journey(prefer('strong'));
  assert.deepEqual(quests, before);
});
