import type {
  CampaignState,
  CoffeeLabCourse,
  ExamResult,
  LearnerProgress,
} from '../types/index.ts';
import { CoffeeLabProgressManager } from './CoffeeLabProgressManager.ts';

const LEARNER_PROGRESS_KEY = 'se_learning_quest_learner_progress_v1';
const LEARNER_PROGRESS_VERSION = 1;

function isExamResult(value: unknown): value is ExamResult {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.examId === 'string' &&
    typeof result.score === 'number' &&
    typeof result.passed === 'boolean' &&
    typeof result.completedAt === 'string' &&
    typeof result.responses === 'object' &&
    result.responses !== null
  );
}

function extractExamResults(value: unknown): Record<string, ExamResult> {
  if (typeof value !== 'object' || value === null) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, result]) => isExamResult(result)),
  ) as Record<string, ExamResult>;
}

export class LearnerProgressManager {
  static load(course: CoffeeLabCourse, campaign: CampaignState): LearnerProgress {
    const fallback = this.create(course, campaign);
    try {
      const raw = localStorage.getItem(LEARNER_PROGRESS_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<LearnerProgress>;
      if (parsed.version !== LEARNER_PROGRESS_VERSION) return fallback;
      return {
        ...fallback,
        activeEpisodeId: typeof parsed.activeEpisodeId === 'string' ? parsed.activeEpisodeId : fallback.activeEpisodeId,
        examResults: extractExamResults(parsed.examResults),
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : fallback.updatedAt,
      };
    } catch {
      return fallback;
    }
  }

  static migrate(course: CoffeeLabCourse, campaign: CampaignState): LearnerProgress {
    const progress = this.load(course, campaign);
    this.save(progress);
    return progress;
  }

  static touchActiveEpisode(course: CoffeeLabCourse, campaign: CampaignState, activeEpisodeId: string): LearnerProgress {
    const progress = {
      ...this.load(course, campaign),
      activeEpisodeId,
    };
    this.save(progress);
    return progress;
  }

  static saveExamResult(
    course: CoffeeLabCourse,
    campaign: CampaignState,
    result: ExamResult,
    activeEpisodeId: string,
  ): LearnerProgress {
    const progress = {
      ...this.load(course, campaign),
      activeEpisodeId,
      examResults: {
        ...this.load(course, campaign).examResults,
        [result.examId]: result,
      },
    };
    this.save(progress);
    return progress;
  }

  private static create(course: CoffeeLabCourse, campaign: CampaignState): LearnerProgress {
    return {
      version: LEARNER_PROGRESS_VERSION,
      activeEpisodeId: campaign.episodeId,
      coffeeLab: CoffeeLabProgressManager.load(course),
      campaign,
      examResults: {},
      updatedAt: new Date().toISOString(),
    };
  }

  private static save(progress: LearnerProgress): void {
    localStorage.setItem(LEARNER_PROGRESS_KEY, JSON.stringify({
      ...progress,
      updatedAt: new Date().toISOString(),
    }));
  }
}
