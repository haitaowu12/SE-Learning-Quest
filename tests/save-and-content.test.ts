import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import railCampaignData from '../src/data/campaign.json' with { type: 'json' };
import coffeeLabCourse from '../src/data/coffee-lab-course.json' with { type: 'json' };
import episodeCatalog from '../src/data/episodes.json' with { type: 'json' };
import { coffeeLabJourney } from '../src/data/coffee-lab-journey.ts';
import { installMemoryStorage } from './helpers.ts';
import { CoffeeLabProgressManager } from '../src/game/CoffeeLabProgressManager.ts';
import { SaveManager } from '../src/game/SaveManager.ts';

test('legacy saves are archived and reset', () => {
  const storage = installMemoryStorage();
  storage.setItem('se_learning_quest_campaign', JSON.stringify({
    version: 1,
    data: { legacy: true },
  }));

  const result = SaveManager.load('ep2-rail-quest');
  assert.equal(result.state, null);
  assert.match(result.resetNotice ?? '', /reset/i);
  assert.ok(storage.getItem('se_learning_quest_legacy_backup'));
});

test('lab progress and rail campaign saves are stored separately', () => {
  const storage = installMemoryStorage();
  const rail = SaveManager.createDefaultState('learner-1', 'ep2-rail-quest');

  CoffeeLabProgressManager.complete(coffeeLabCourse, 'frame');
  assert.ok(SaveManager.save({ ...rail, completedChapterIds: ['chapter-1'] }));

  const labLoad = CoffeeLabProgressManager.load(coffeeLabCourse);
  const railLoad = SaveManager.load('ep2-rail-quest');

  assert.deepEqual(labLoad.completedUnitIds, ['frame']);
  assert.deepEqual(railLoad.state?.completedChapterIds, ['chapter-1']);
  assert.ok(storage.getItem('se_learning_quest_coffee_lab_progress'));
  assert.ok(storage.getItem('se_learning_quest_campaign_ep2-rail-quest'));
});

test('episode catalog exposes coffee lab and rail campaign with public references', () => {
  assert.equal(episodeCatalog.episodes.length, 2);
  assert.deepEqual(
    episodeCatalog.episodes.map((episode) => episode.id),
    ['ep1-coffee-lab', 'ep2-rail-quest'],
  );

  const coffeeEpisode = episodeCatalog.episodes.find((episode) => episode.id === 'ep1-coffee-lab');
  assert.ok(coffeeEpisode);
  assert.equal(coffeeEpisode?.format, 'lab');
  assert.equal(coffeeEpisode?.learningMode, 'Guided artifact lab');
  assert.equal(coffeeEpisode?.nextEpisodeId, 'ep2-rail-quest');
  assert.match(coffeeEpisode?.heroImage ?? '', /^(motion|assets)\//);
  assert.ok(coffeeEpisode?.standards.some((standard) => standard.framework === 'SEBoK'));
  assert.ok(coffeeEpisode?.standards.some((standard) => standard.citation.startsWith('https://')));

  const railEpisode = episodeCatalog.episodes.find((episode) => episode.id === 'ep2-rail-quest');
  assert.equal(railEpisode?.format, 'campaign');
  assert.equal(railEpisode?.learningMode, 'Applied decision campaign');
  assert.ok(episodeCatalog.episodes.every((episode) => episode.standards.every((standard) => standard.citation.startsWith('https://'))));
});

test('rail campaign manifest keeps seven guided chapters with decisions and subgames', () => {
  assert.equal(railCampaignData.chapters.length, 7);

  for (const chapter of railCampaignData.chapters) {
    assert.equal(chapter.decisions.length, 3);
    assert.ok(chapter.subgame);
    assert.ok(chapter.brief.journal.length >= 1);
    assert.ok(chapter.debrief.journal.length >= 1);
    assert.ok(chapter.decisions.some((decision) =>
      decision.options.some((option) => option.consequence.trigger_subgame === true),
    ));
  }
});

test('rail campaign standards references use public URLs', () => {
  for (const chapter of railCampaignData.chapters) {
    for (const entry of [...chapter.brief.journal, ...chapter.debrief.journal]) {
      assert.ok(entry.standards.length > 0);
      for (const standard of entry.standards) {
        assert.match(standard.citation, /^https:\/\//);
        assert.doesNotMatch(standard.citation, /§/);
      }
    }
  }
});

test('coffee lab covers the full technical-process lifecycle in beginner clusters', () => {
  assert.deepEqual(
    coffeeLabCourse.units.map((unit) => unit.cluster),
    ['Frame', 'Define', 'Architect', 'Implement', 'Integrate', 'Prove', 'Operate', 'Retire'],
  );
  assert.deepEqual(
    coffeeLabCourse.units.map((unit) => unit.processes),
    [
      ['Business or Mission Analysis'],
      ['Stakeholder Needs and Requirements Definition', 'System Requirements Definition'],
      ['Architecture Definition', 'Design Definition', 'System Analysis'],
      ['Implementation'],
      ['Integration'],
      ['Verification', 'Transition', 'Validation'],
      ['Operation', 'Maintenance'],
      ['Disposal'],
    ],
  );

  const text = JSON.stringify(coffeeLabCourse).toLowerCase();
  const processTerms = [
    'business or mission analysis',
    'stakeholder needs',
    'system requirements',
    'architecture',
    'design definition',
    'system analysis',
    'implementation',
    'integration',
    'verification',
    'transition',
    'validation',
    'operation',
    'maintenance',
    'disposal',
    'rams',
    'interface register',
    'retirement',
  ];

  for (const term of processTerms) {
    assert.match(text, new RegExp(term));
  }
});

test('coffee lab units have concept, artifact, practice, terms, and references', () => {
  assert.equal(coffeeLabCourse.units.length, 8);

  for (const unit of coffeeLabCourse.units) {
    assert.ok(unit.learningGoal.length > 20);
    assert.ok(unit.concept.length > 40);
    assert.ok(unit.artifacts.length >= 2);
    assert.ok(unit.supportingPractices.length >= 2);
    assert.ok(unit.terms.length >= 3);
    assert.ok(unit.practice.activityType.length > 2);
    assert.ok(unit.practice.why.length > 40);
    assert.ok(unit.practice.steps.length >= 4);
    assert.ok(unit.practice.checklist.length >= 4);
    assert.ok(unit.references.every((reference) => reference.url.startsWith('https://')));
  }
});

test('coffee lab cheat sheet exposes visible reference links', () => {
  const overlaySource = readFileSync(new URL('../src/app/GameOverlay.tsx', import.meta.url), 'utf8');

  assert.match(overlaySource, /Open reference/);
  assert.match(overlaySource, /https:\/\/haitaowu12\.github\.io\/SE_Tailoring_Framework\/#dashboard/);
  assert.match(overlaySource, /ISO\/IEC\/IEEE 15288/);
  assert.match(overlaySource, /INCOSE SE Handbook/);
});

test('coffee lab journey supplies worked examples and guidance for every unit', () => {
  for (const unit of coffeeLabCourse.units) {
    const journey = coffeeLabJourney[unit.id];
    assert.ok(journey);
    assert.ok(journey.storyBeat.length > 40);
    assert.ok(journey.starterEvidence.length >= 4);
    assert.ok(journey.workedExample.weak.length > 20);
    assert.ok(journey.workedExample.strong.length > 40);
    assert.ok(journey.artifactTemplate.fields.length >= 4);
    assert.ok(journey.rubric.length >= 4);
    assert.ok(journey.microCheck.options.length >= 3);
    assert.ok(journey.nextBridge.length > 30);
  }
});

test('public learner data does not expose classroom-only material', () => {
  const publicText = JSON.stringify([episodeCatalog, coffeeLabCourse, coffeeLabJourney, railCampaignData]);
  assert.doesNotMatch(publicText, /answer key/i);
  assert.doesNotMatch(publicText, /facilitator/i);
  assert.doesNotMatch(publicText, /download/i);
  assert.doesNotMatch(publicText, /\/Users\/tony/i);
});

test('match subgames expose unique right-side options', () => {
  for (const chapter of railCampaignData.chapters) {
    if (chapter.subgame.type !== 'match') continue;
    assert.equal(
      new Set(chapter.subgame.rightOptions).size,
      chapter.subgame.rightOptions.length,
    );
  }
});
