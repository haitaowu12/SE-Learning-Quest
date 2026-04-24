import test from 'node:test';
import assert from 'node:assert/strict';
import campaignData from '../src/data/campaign.json' with { type: 'json' };
import { installMemoryStorage } from './helpers.ts';
import { SaveManager } from '../src/game/SaveManager.ts';

test('legacy saves are archived and reset', () => {
  const storage = installMemoryStorage();
  storage.setItem('se_learning_quest_campaign', JSON.stringify({
    version: 1,
    data: { legacy: true },
  }));

  const result = SaveManager.load();
  assert.equal(result.state, null);
  assert.match(result.resetNotice ?? '', /reset/i);
  assert.ok(storage.getItem('se_learning_quest_legacy_backup'));
});

test('campaign manifest keeps three decisions and one subgame per chapter', () => {
  assert.equal(campaignData.chapters.length, 5);

  for (const chapter of campaignData.chapters) {
    assert.equal(chapter.decisions.length, 3);
    assert.ok(chapter.subgame);
    assert.ok(chapter.brief.journal.length >= 1);
    assert.ok(chapter.debrief.journal.length >= 1);
    assert.ok(chapter.decisions.some((decision) =>
      decision.options.some((option) => option.consequence.trigger_subgame === true),
    ));
  }
});
