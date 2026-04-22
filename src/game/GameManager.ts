import type { PlayerProgress, ScenarioRecord } from '@/types/index.ts';
import { SaveManager } from './SaveManager.ts';
import { TOTAL_LEVELS } from '@/utils/constants.ts';
import { LevelManager } from './LevelManager.ts';

export class GameManager {
  private static instance: GameManager | null = null;
  private progress: PlayerProgress;

  private constructor() {
    const saved = SaveManager.load();
    this.progress = saved ?? SaveManager.createDefaultProgress(this.generatePlayerId());
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  private generatePlayerId(): string {
    return `se_player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  getProgress(): PlayerProgress {
    return this.progress;
  }

  save(): boolean {
    this.progress.lastUpdated = new Date().toISOString();
    return SaveManager.save(this.progress);
  }

  reset(): boolean {
    const ok = SaveManager.reset();
    if (ok) {
      this.progress = SaveManager.createDefaultProgress(this.generatePlayerId());
    }
    return ok;
  }

  completeLevel(levelId: string, score: number, hintsUsed: number, retries: number): void {
    const existing = this.progress.levelScores[levelId] ?? 0;
    if (score > existing) {
      this.progress.totalScore += score - existing;
      this.progress.levelScores[levelId] = score;
    }

    this.progress.streak++;

    const record: ScenarioRecord = {
      timestamp: new Date().toISOString(),
      module: parseInt(levelId.split('_')[0], 10),
      levelId,
      score,
      hintsUsed,
      retries,
    };
    this.progress.scenarioHistory.push(record);

    this.save();
  }

  advanceModule(moduleId: number): void {
    const levelManager = LevelManager.getInstance();
    const moduleLevels = levelManager.getModuleLevels(moduleId);
    const allLevelsCompleted = moduleLevels.every((l) => (this.progress.levelScores[l.id] ?? 0) > 0);
    if (!allLevelsCompleted) return;

    if (!this.progress.modulesCompleted.includes(moduleId)) {
      this.progress.modulesCompleted.push(moduleId);
    }

    this.addAchievement(`module_${moduleId}_complete`);

    const totalModules = levelManager.getModuleCount();
    if (this.progress.modulesCompleted.length >= totalModules) {
      this.addAchievement('all_modules');
    }

    if (moduleId < totalModules) {
      this.progress.currentModule = moduleId + 1;
    }
    this.save();
  }

  updateCompetency(competency: string, score: number): void {
    const current = this.progress.competencyScores[competency] ?? 0;
    if (current === 0) {
      this.progress.competencyScores[competency] = score;
    } else {
      this.progress.competencyScores[competency] = 0.7 * score + 0.3 * current;
    }
    this.save();
  }

  addAchievement(achievementId: string): boolean {
    if (this.progress.achievements.includes(achievementId)) return false;
    this.progress.achievements.push(achievementId);
    this.save();
    return true;
  }

  hasAchievement(achievementId: string): boolean {
    return this.progress.achievements.includes(achievementId);
  }

  isLevelUnlocked(levelId: string): boolean {
    return LevelManager.getInstance().isLevelUnlocked(levelId, this.progress);
  }

  isModuleCompleted(moduleId: number): boolean {
    return this.progress.modulesCompleted.includes(moduleId);
  }

  getOverallProgress(): { percentage: number; completedLevels: number; totalLevels: number } {
    const completedLevels = Object.values(this.progress.levelScores).filter((s) => s > 0).length;
    return {
      percentage: Math.round((completedLevels / TOTAL_LEVELS) * 100),
      completedLevels,
      totalLevels: TOTAL_LEVELS,
    };
  }

  getStreak(): number {
    return this.progress.streak;
  }

  resetStreak(): void {
    this.progress.streak = 0;
    this.save();
  }

  getSettings() {
    return this.progress.settings;
  }

  updateSettings(settings: Partial<PlayerProgress['settings']>): void {
    this.progress.settings = { ...this.progress.settings, ...settings };
    this.save();
  }
}
