import type { PlayerProgress, GameSettings } from '@/types/index.ts';

const SAVE_KEY = 'se_learning_quest_progress';
const BACKUP_KEY = 'se_learning_quest_backup';
const SAVE_VERSION = 1;

interface SavePayload {
  version: number;
  data: PlayerProgress;
}

function validateProgress(data: unknown): data is PlayerProgress {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  if (typeof d.playerId !== 'string') return false;
  if (typeof d.currentModule !== 'number') return false;
  if (!Array.isArray(d.modulesCompleted)) return false;
  if (typeof d.totalScore !== 'number') return false;
  if (!Array.isArray(d.achievements)) return false;
  if (!Array.isArray(d.scenarioHistory)) return false;
  if (typeof d.competencyScores !== 'object' || d.competencyScores === null) return false;
  if (typeof d.levelScores !== 'object' || d.levelScores === null) return false;
  if (typeof d.levelStars !== 'object' || d.levelStars === null) return false;
  if (typeof d.sessionStart !== 'string') return false;
  if (typeof d.lastUpdated !== 'string') return false;
  if (typeof d.settings !== 'object' || d.settings === null) return false;
  return true;
}

function migratePayload(payload: SavePayload): PlayerProgress | null {
  if (payload.version === SAVE_VERSION) {
    return payload.data;
  }
  return null;
}

export class SaveManager {
  static load(): PlayerProgress | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed: SavePayload = JSON.parse(raw);
      const migrated = migratePayload(parsed);
      if (!migrated) return null;
      if (!validateProgress(migrated)) {
        localStorage.setItem(BACKUP_KEY, raw);
        localStorage.removeItem(SAVE_KEY);
        return null;
      }
      return migrated;
    } catch {
      return null;
    }
  }

  static save(progress: PlayerProgress): boolean {
    try {
      const payload: SavePayload = { version: SAVE_VERSION, data: progress };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  static reset(): boolean {
    try {
      localStorage.removeItem(SAVE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  static createDefaultProgress(playerId: string): PlayerProgress {
    const now = new Date().toISOString();
    return {
      playerId,
      currentModule: 1,
      modulesCompleted: [],
      totalScore: 0,
      achievements: [],
      scenarioHistory: [],
      competencyScores: {
        systems_thinking: 0,
        requirements_engineering: 0,
        architecture_design: 0,
        verification_validation: 0,
        integration_management: 0,
      },
      levelScores: {},
      levelStars: {},
      streak: 0,
      sessionStart: now,
      lastUpdated: now,
      settings: this.createDefaultSettings(),
    };
  }

  static createDefaultSettings(): GameSettings {
    return {
      masterVolume: 1,
      musicVolume: 0.6,
      sfxVolume: 0.8,
      muted: false,
      highContrast: false,
      reducedMotion: false,
    };
  }
}
