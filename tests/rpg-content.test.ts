import test from 'node:test';
import assert from 'node:assert/strict';
import { quests } from '../src/rpg/campaign.ts';
import { validateRpgContent } from '../src/rpg/validation.ts';

test('Asterfall content, curriculum, conditional branches and weighted puzzles are coherent', () => {
  assert.deepEqual(validateRpgContent(), []);
});

test('content validation detects broken prerequisites, unreachable flags and invalid trade scoring', () => {
  const modified = structuredClone(quests);
  modified[0].prerequisites = ['missing'];
  modified[0].decisions[0].when = { flag: 'never-set', value: 'missing' };
  const trade = modified.find((quest) => quest.puzzle?.kind === 'trade')!.puzzle!;
  trade.solution = ['not-a-design'];
  const errors = validateRpgContent(modified);
  assert.ok(errors.some((error) => error.includes('prerequisite')));
  assert.ok(errors.some((error) => error.includes('branch condition')));
  assert.ok(errors.some((error) => error.includes('weighted optimum')));
});
