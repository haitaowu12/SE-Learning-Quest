import episodeCatalog from '../data/episodes.json' with { type: 'json' };
import railCampaignData from '../data/campaign.json' with { type: 'json' };
import type {
  CampaignChapter,
  CampaignManifest,
  CampaignState,
  ChapterProgress,
  EpisodeCatalog,
  EpisodeSummary,
} from '../types/index.ts';

export class LevelManager {
  private static instance: LevelManager | null = null;
  private readonly catalog: EpisodeCatalog;
  private readonly manifests: Record<string, CampaignManifest>;
  private selectedEpisodeId = 'ep2-rail-quest';

  private constructor() {
    this.catalog = episodeCatalog as EpisodeCatalog;
    this.manifests = {
      'ep2-rail-quest': railCampaignData as CampaignManifest,
    };
  }

  static getInstance(): LevelManager {
    if (!LevelManager.instance) {
      LevelManager.instance = new LevelManager();
    }
    return LevelManager.instance;
  }

  getCatalog(): EpisodeCatalog {
    return this.catalog;
  }

  getEpisodes(): EpisodeSummary[] {
    return this.catalog.episodes.slice();
  }

  getEpisode(episodeId: string = this.selectedEpisodeId): EpisodeSummary | undefined {
    return this.catalog.episodes.find((episode) => episode.id === episodeId);
  }

  getSelectedEpisodeId(): string {
    return this.selectedEpisodeId;
  }

  selectEpisode(episodeId: string): boolean {
    if (!this.manifests[episodeId]) return false;
    this.selectedEpisodeId = episodeId;
    return true;
  }

  getManifest(episodeId: string = this.selectedEpisodeId): CampaignManifest {
    return this.manifests[episodeId] ?? this.manifests['ep2-rail-quest'];
  }

  getChapters(): CampaignChapter[] {
    return this.getManifest().chapters.slice().sort((left, right) => left.order - right.order);
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
