import type { PlayerProgress, GameSettings } from '@/types/index.ts';

const SAVE_KEY = 'se_learning_quest_progress';
const SAVE_VERSION = 1;

interface SavePayload {
  version: number;
  data: PlayerProgress;
}

export class SaveManager {
  static load(): PlayerProgress | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed: SavePayload = JSON.parse(raw);
      if (parsed.version !== SAVE_VERSION) {
        // Future migration logic goes here
        return null;
      }
      return parsed.data;
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
