import test from 'node:test';
import assert from 'node:assert/strict';
import { installMemoryStorage } from './helpers.ts';
import { applyMetricDelta } from '../src/game/metricUtils.ts';
import { GameManager } from '../src/game/GameManager.ts';
import { LevelManager } from '../src/game/LevelManager.ts';

installMemoryStorage();

test('metric deltas clamp inside 0..100', () => {
  const result = applyMetricDelta(
    {
      system_quality: 97,
      stakeholder_trust: 2,
      risk_exposure: 98,
      delivery_confidence: 4,
      team_capacity: 50,
    },
    {
      system_quality: 10,
      stakeholder_trust: -10,
      risk_exposure: 9,
      delivery_confidence: -12,
    },
  );

  assert.deepEqual(result, {
    system_quality: 100,
    stakeholder_trust: 0,
    risk_exposure: 100,
    delivery_confidence: 0,
    team_capacity: 50,
  });
});

test('completing a strong first chapter unlocks chapter two and stores result', () => {
  const manager = GameManager.getInstance();
  manager.resetCampaign();

  const mission = manager.startChapter('chapter-1');
  assert.ok(mission);

  manager.chooseDecisionOption('boundary-workshop');
  manager.chooseDecisionOption('treat-as-interface');
  manager.chooseDecisionOption('issue-assumptions-log');

  const result = manager.completeSubgame(['independent-safety-assessor', 'program-sponsor']);
  assert.ok(result);
  assert.equal(result?.chapterId, 'chapter-1');
  assert.ok(['Excellent', 'Stable'].includes(result?.rating ?? ''));

  const state = manager.getState();
  assert.ok(state.unlockedChapterIds.includes('chapter-2'));
  assert.ok(state.completedChapterIds.includes('chapter-1'));
  assert.ok(state.chapterResults['chapter-1']);
});

test('level manager exposes five ordered chapters', () => {
  const chapters = LevelManager.getInstance().getChapters();
  assert.equal(chapters.length, 5);
  assert.deepEqual(chapters.map((chapter) => chapter.order), [1, 2, 3, 4, 5]);
});
