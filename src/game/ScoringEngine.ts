import type {
  CampaignChapter,
  ChapterRating,
  ChapterResult,
  MetricState,
  MissionState,
} from '../types/index.ts';
import { diffMetrics } from './metricUtils.ts';

function scoreMetrics(metrics: MetricState): number {
  return (
    metrics.system_quality * 0.28 +
    metrics.stakeholder_trust * 0.2 +
    (100 - metrics.risk_exposure) * 0.24 +
    metrics.delivery_confidence * 0.16 +
    metrics.team_capacity * 0.12
  );
}

function determineRating(score: number): ChapterRating {
  if (score >= 78) return 'Excellent';
  if (score >= 63) return 'Stable';
  if (score >= 48) return 'Fragile';
  return 'At Risk';
}

function buildHeadline(rating: ChapterRating, chapter: CampaignChapter): string {
  switch (rating) {
    case 'Excellent':
      return `${chapter.brief.title} landed with strong systems control.`;
    case 'Stable':
      return `${chapter.brief.title} stayed on track with manageable tension.`;
    case 'Fragile':
      return `${chapter.brief.title} advanced, but several seams remain exposed.`;
    case 'At Risk':
      return `${chapter.brief.title} moved forward on paper while risk accumulated underneath.`;
  }
}

export class ScoringEngine {
  static evaluateChapter(chapter: CampaignChapter, mission: MissionState): ChapterResult {
    const baseScore = scoreMetrics(mission.metricsCurrent);
    const subgameBonus = mission.subgameResult?.passed ? 4 : -4;
    const criticalPenalty = mission.criticalFlags.length * 6;
    const outcomeScore = Math.round(baseScore + subgameBonus - criticalPenalty);
    const rating = determineRating(outcomeScore);
    const strongPath = rating === 'Excellent' || rating === 'Stable';
    const summary = strongPath ? chapter.debrief.strongSummary : chapter.debrief.weakSummary;

    return {
      chapterId: chapter.id,
      completedAt: new Date().toISOString(),
      rating,
      headline: buildHeadline(rating, chapter),
      summary,
      principle: chapter.debrief.principle,
      finalMetrics: { ...mission.metricsCurrent },
      metricDelta: diffMetrics(mission.metricsBefore, mission.metricsCurrent),
      decisionHistory: mission.decisions.slice(),
      unlockedNotes: mission.unlockedNotes.slice(),
      outcomeTags: mission.outcomeTags.slice(),
      criticalFlags: mission.criticalFlags.slice(),
      subgameResult: mission.subgameResult ? { ...mission.subgameResult } : null,
      standards: chapter.debrief.journal.slice(),
    };
  }
}
