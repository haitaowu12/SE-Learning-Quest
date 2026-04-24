import campaignData from '../data/campaign.json' with { type: 'json' };
import type { CampaignChapter, CampaignManifest, CampaignState, ChapterProgress } from '../types/index.ts';

export class LevelManager {
  private static instance: LevelManager | null = null;
  private manifest: CampaignManifest;

  private constructor() {
    this.manifest = campaignData as CampaignManifest;
  }

  static getInstance(): LevelManager {
    if (!LevelManager.instance) {
      LevelManager.instance = new LevelManager();
    }
    return LevelManager.instance;
  }

  getManifest(): CampaignManifest {
    return this.manifest;
  }

  getChapters(): CampaignChapter[] {
    return this.manifest.chapters.slice().sort((left, right) => left.order - right.order);
  }

  getChapterById(chapterId: string): CampaignChapter | undefined {
    return this.getChapters().find((chapter) => chapter.id === chapterId);
  }

  getNextChapterId(chapterId: string): string | null {
    const chapters = this.getChapters();
    const index = chapters.findIndex((chapter) => chapter.id === chapterId);
    if (index === -1 || index === chapters.length - 1) {
      return null;
    }
    return chapters[index + 1].id;
  }

  isChapterUnlocked(chapterId: string, state: CampaignState): boolean {
    return state.unlockedChapterIds.includes(chapterId);
  }

  getChapterProgress(state: CampaignState): ChapterProgress[] {
    return this.getChapters().map((chapter) => ({
      chapterId: chapter.id,
      unlocked: this.isChapterUnlocked(chapter.id, state),
      completed: state.completedChapterIds.includes(chapter.id),
      result: state.chapterResults[chapter.id] ?? null,
    }));
  }
}
