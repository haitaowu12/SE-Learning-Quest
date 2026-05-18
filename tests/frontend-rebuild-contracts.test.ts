import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import coffeeLabCourse from '../src/data/coffee-lab-course.json' with { type: 'json' };
import railCampaignData from '../src/data/campaign.json' with { type: 'json' };
import { assetManifest } from '../src/data/assetManifest.ts';
import { examManifests } from '../src/data/exams.ts';
import { veeModel } from '../src/data/veeModel.ts';
import { CoffeeLabProgressManager } from '../src/game/CoffeeLabProgressManager.ts';
import { LearnerProgressManager } from '../src/game/LearnerProgressManager.ts';
import { SaveManager } from '../src/game/SaveManager.ts';
import { assertContentValid } from '../src/utils/contentValidation.ts';
import { installMemoryStorage } from './helpers.ts';

test('frontend rebuild content contracts validate cleanly', () => {
  assert.doesNotThrow(() => assertContentValid());
});

test('asset manifest points at existing webp and png fallbacks', () => {
  assert.ok(assetManifest.assets.length >= 12);

  for (const asset of assetManifest.assets) {
    assert.equal(asset.path.endsWith('.webp'), true, `${asset.key} primary asset must be WebP`);
    assert.equal(asset.fallbackPath.endsWith('.png'), true, `${asset.key} fallback asset must be PNG`);
    assert.ok(asset.width > 0 && asset.height > 0, `${asset.key} needs stable dimensions`);
    assert.ok(
      existsSync(fileURLToPath(new URL(`../public/${asset.path}`, import.meta.url))),
      `${asset.key} missing ${asset.path}`,
    );
    assert.ok(
      existsSync(fileURLToPath(new URL(`../public/${asset.fallbackPath}`, import.meta.url))),
      `${asset.key} missing ${asset.fallbackPath}`,
    );
  }
});

test('optional exams cover both episodes with scorable unseen tasks', () => {
  assert.deepEqual(
    examManifests.map((exam) => exam.episodeId),
    ['ep1-coffee-lab', 'ep2-rail-quest'],
  );

  for (const exam of examManifests) {
    assert.ok(exam.passingScore >= 70);
    assert.ok(exam.tasks.length >= 3);
    assert.ok(exam.tasks.every((task) => task.options.length >= 3));
    assert.ok(exam.tasks.every((task) => task.correct.every((answer) => task.options.includes(answer))));
  }
});

test('rail campaign renders from a complete Vee model instead of image hotspots', () => {
  const chapterIds = railCampaignData.chapters.map((chapter) => chapter.id);
  assert.deepEqual(
    veeModel.map((node) => node.chapterId),
    chapterIds,
  );

  for (const node of veeModel) {
    assert.ok(node.concept.length > 40);
    assert.ok(node.learnerQuestion.endsWith('?'));
    assert.ok(node.x >= 0 && node.x <= 100);
    assert.ok(node.y >= 0 && node.y <= 100);
  }
});

test('versioned learner progress migrates existing episode saves and stores exam results', () => {
  const storage = installMemoryStorage();
  CoffeeLabProgressManager.complete(coffeeLabCourse, 'frame', 'The boundary model connects the coffee machine, support route, users, and validation evidence.');
  const campaign = {
    ...SaveManager.createDefaultState('learner-1', 'ep2-rail-quest'),
    completedChapterIds: ['chapter-1'],
  };

  const migrated = LearnerProgressManager.migrate(coffeeLabCourse, campaign);
  assert.deepEqual(migrated.coffeeLab.completedUnitIds, ['frame']);
  assert.deepEqual(migrated.campaign.completedChapterIds, ['chapter-1']);

  const saved = LearnerProgressManager.saveExamResult(
    coffeeLabCourse,
    campaign,
    {
      examId: 'ep1-readiness-exam',
      score: 100,
      passed: true,
      completedAt: '2026-05-17T00:00:00.000Z',
      responses: { 'ep1-trace': 'Need -> requirement -> architecture/interface/RAMS -> implementation -> integration -> verification -> validation/transition -> operation -> retirement/gate' },
    },
    'ep1-coffee-lab',
  );

  assert.equal(saved.examResults['ep1-readiness-exam'].passed, true);
  assert.match(storage.getItem('se_learning_quest_learner_progress_v1') ?? '', /ep1-readiness-exam/);
});
