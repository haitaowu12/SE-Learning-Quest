import campaignData from '../data/campaign.json' with { type: 'json' };
import coffeeLabCourseData from '../data/coffee-lab-course.json' with { type: 'json' };
import episodeCatalogData from '../data/episodes.json' with { type: 'json' };
import { assetManifest } from '../data/assetManifest.ts';
import { examManifests } from '../data/exams.ts';
import { coffeeLabJourney } from '../data/coffee-lab-journey.ts';
import { veeModel } from '../data/veeModel.ts';
import { METRIC_KEYS } from '../game/metricUtils.ts';
import type { CampaignManifest, CoffeeLabCourse, EpisodeCatalog } from '../types/index.ts';

export interface ValidationIssue {
  code: string;
  message: string;
}

function issue(code: string, message: string): ValidationIssue {
  return { code, message };
}

function isHttps(value: string): boolean {
  return value.startsWith('https://');
}

function validateStandards(
  issues: ValidationIssue[],
  scope: string,
  standards: { framework: string; citation: string }[],
): void {
  standards.forEach((standard) => {
    if (!isHttps(standard.citation)) {
      issues.push(issue(
        `${scope}.reference`,
        `${scope} has a non-public reference: ${standard.framework}`,
      ));
    }
  });
}

export function validateContent(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const catalog = episodeCatalogData as EpisodeCatalog;
  const campaign = campaignData as CampaignManifest;
  const course = coffeeLabCourseData as CoffeeLabCourse;
  const episodeIds = new Set(catalog.episodes.map((episode) => episode.id));
  const chapterIds = new Set(campaign.chapters.map((chapter) => chapter.id));
  const unitIds = new Set(course.units.map((unit) => unit.id));
  const assetPaths = new Set(assetManifest.assets.flatMap((asset) => [asset.path, asset.fallbackPath]));

  if (!episodeIds.has('ep1-coffee-lab') || !episodeIds.has('ep2-rail-quest')) {
    issues.push(issue('episodes.required', 'Episode catalog must include EP1 and EP2.'));
  }

  catalog.episodes.forEach((episode) => {
    if (!assetPaths.has(episode.heroImage)) {
      issues.push(issue('episodes.asset', `${episode.id} hero image is not in the asset manifest: ${episode.heroImage}`));
    }
    validateStandards(issues, `episodes.${episode.id}`, episode.standards);
  });

  if (course.units.length !== 8) {
    issues.push(issue('coffee.units', 'Coffee Lab must keep eight lifecycle units.'));
  }
  course.units.forEach((unit) => {
    if (!coffeeLabJourney[unit.id]) {
      issues.push(issue('coffee.journey', `${unit.id} is missing journey guidance.`));
    }
    if (unit.practice.steps.length < 3 || unit.terms.length < 3) {
      issues.push(issue('coffee.practice', `${unit.id} needs practice steps and learner terms.`));
    }
    unit.references.forEach((reference) => {
      if (!isHttps(reference.url)) {
        issues.push(issue('coffee.reference', `${unit.id} has a non-public reference: ${reference.label}`));
      }
    });
  });

  campaign.chapters.forEach((chapter) => {
    if (chapter.decisions.length !== 3) {
      issues.push(issue('campaign.decisions', `${chapter.id} must have exactly three decisions.`));
    }
    chapter.decisions.forEach((decision) => {
      decision.options.forEach((option) => {
        Object.keys(option.consequence.metrics).forEach((key) => {
          if (!METRIC_KEYS.includes(key as never)) {
            issues.push(issue('campaign.metric', `${chapter.id} uses an unknown metric key: ${key}`));
          }
        });
      });
    });
    if (!chapterIds.has(chapter.id)) {
      issues.push(issue('campaign.chapter', `${chapter.id} is not self-indexed.`));
    }
    [...chapter.brief.journal, ...chapter.debrief.journal].forEach((entry) => {
      validateStandards(issues, `campaign.${chapter.id}.${entry.title}`, entry.standards);
    });
  });

  const veeChapterIds = new Set(veeModel.map((node) => node.chapterId));
  campaign.chapters.forEach((chapter) => {
    if (!veeChapterIds.has(chapter.id)) {
      issues.push(issue('vee.chapter', `${chapter.id} is missing from the rendered Vee model.`));
    }
  });
  veeModel.forEach((node) => {
    if (!chapterIds.has(node.chapterId)) {
      issues.push(issue('vee.unknown', `${node.chapterId} appears in the Vee model but not the campaign.`));
    }
    if (node.x < 0 || node.x > 100 || node.y < 0 || node.y > 100) {
      issues.push(issue('vee.position', `${node.chapterId} has an invalid Vee coordinate.`));
    }
    node.evidenceLinkIds.forEach((targetId) => {
      if (!chapterIds.has(targetId)) {
        issues.push(issue('vee.link', `${node.chapterId} links to an unknown Vee chapter: ${targetId}`));
      }
    });
  });

  examManifests.forEach((exam) => {
    if (!episodeIds.has(exam.episodeId)) {
      issues.push(issue('exam.episode', `${exam.id} points at an unknown episode: ${exam.episodeId}`));
    }
    if (exam.tasks.length < 3) {
      issues.push(issue('exam.tasks', `${exam.id} needs at least three exam tasks.`));
    }
    exam.tasks.forEach((task) => {
      if (task.correct.some((answer) => !task.options.includes(answer))) {
        issues.push(issue('exam.answer', `${exam.id}/${task.id} has a correct answer missing from options.`));
      }
    });
  });

  assetManifest.assets.forEach((asset) => {
    if (!asset.key || asset.width <= 0 || asset.height <= 0) {
      issues.push(issue('asset.shape', `${asset.key || asset.path} has invalid asset dimensions.`));
    }
    if (!asset.path.endsWith('.webp') || !asset.fallbackPath.endsWith('.png')) {
      issues.push(issue('asset.fallback', `${asset.key} must define WebP primary and PNG fallback.`));
    }
  });

  if (!unitIds.has('frame') || !unitIds.has('retire')) {
    issues.push(issue('coffee.lifecycle', 'Coffee Lab must preserve frame-to-retire lifecycle anchors.'));
  }

  return issues;
}

export function assertContentValid(): void {
  const issues = validateContent();
  if (issues.length > 0) {
    throw new Error(issues.map((entry) => `${entry.code}: ${entry.message}`).join('\n'));
  }
}
