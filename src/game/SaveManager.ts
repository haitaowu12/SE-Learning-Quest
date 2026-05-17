import type { CampaignState, GameSettings, SaveLoadResult } from '../types/index.ts';
import { LevelManager } from './LevelManager.ts';

const SAVE_PREFIX = 'se_learning_quest_campaign';
const LEGACY_SAVE_KEY = 'se_learning_quest_campaign';
const BACKUP_KEY = 'se_learning_quest_legacy_backup';
const SAVE_VERSION = 3;

interface SavePayload {
  version: number;
  data: CampaignState;
}

function validateSettings(value: unknown): value is GameSettings {
  if (typeof value !== 'object' || value === null) return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.masterVolume === 'number' &&
    typeof settings.musicVolume === 'number' &&
    typeof settings.sfxVolume === 'number' &&
    typeof settings.muted === 'boolean' &&
    typeof settings.highContrast === 'boolean' &&
    typeof settings.reducedMotion === 'boolean'
  );
}

function validateState(value: unknown): value is CampaignState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    typeof state.episodeId === 'string' &&
    typeof state.playerId === 'string' &&
    typeof state.startedAt === 'string' &&
    typeof state.updatedAt === 'string' &&
    (typeof state.currentChapterId === 'string' || state.currentChapterId === null) &&
    Array.isArray(state.unlockedChapterIds) &&
    Array.isArray(state.completedChapterIds) &&
    typeof state.metrics === 'object' &&
    state.metrics !== null &&
    typeof state.chapterResults === 'object' &&
    state.chapterResults !== null &&
    validateSettings(state.settings)
  );
}

export class SaveManager {
  private static storageKey(episodeId: string): string {
    return `${SAVE_PREFIX}_${episodeId}`;
  }

  static load(episodeId: string): SaveLoadResult {
    try {
      const key = this.storageKey(episodeId);
      const raw = localStorage.getItem(key) ?? this.loadLegacyRaw(episodeId);
      if (!raw) {
        return { state: null, resetNotice: null };
      }
      const parsed = JSON.parse(raw) as SavePayload;
      if (parsed.version !== SAVE_VERSION || !validateState(parsed.data)) {
        localStorage.setItem(BACKUP_KEY, raw);
        localStorage.removeItem(key);
        return {
          state: null,
          resetNotice: 'Legacy progress was archived and reset for the multi-episode release.',
        };
      }
      if (parsed.data.episodeId !== episodeId) {
        return { state: null, resetNotice: null };
      }
      return { state: parsed.data, resetNotice: parsed.data.resetNotice };
    } catch {
      return { state: null, resetNotice: 'Existing save data was unreadable and has been replaced with a clean campaign.' };
    }
  }

  private static loadLegacyRaw(episodeId: string): string | null {
    if (episodeId !== 'ep2-rail-quest') return null;
    return localStorage.getItem(LEGACY_SAVE_KEY);
  }

  static save(state: CampaignState): boolean {
    try {
      const payload: SavePayload = {
        version: SAVE_VERSION,
        data: {
          ...state,
          updatedAt: new Date().toISOString(),
        },
      };
      localStorage.setItem(this.storageKey(state.episodeId), JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  static reset(episodeId: string): void {
    localStorage.removeItem(this.storageKey(episodeId));
  }

  static createDefaultSettings(): GameSettings {
    return {
      masterVolume: 1,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      muted: false,
      highContrast: false,
      reducedMotion: false,
    };
  }

  static createDefaultState(playerId: string, episodeId: string, resetNotice: string | null = null): CampaignState {
    const manifest = LevelManager.getInstance().getManifest(episodeId);
    const now = new Date().toISOString();
    return {
      episodeId,
      playerId,
      startedAt: now,
      updatedAt: now,
      currentChapterId: null,
      unlockedChapterIds: [manifest.chapters[0]?.id ?? 'chapter-1'],
      completedChapterIds: [],
      metrics: { ...manifest.baselineMetrics },
      activeMission: null,
      chapterResults: {},
      resetNotice,
      settings: this.createDefaultSettings(),
    };
  }
}
