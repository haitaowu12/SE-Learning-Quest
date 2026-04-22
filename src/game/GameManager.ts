import type { PlayerProgress, ScenarioRecord } from '@/types/index.ts';
import { SaveManager } from './SaveManager.ts';

export class GameManager {
  private progress: PlayerProgress;

  constructor() {
    const saved = SaveManager.load();
    this.progress = saved ?? SaveManager.createDefaultProgress(this.generatePlayerId());
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

    const record: ScenarioRecord = {
      timestamp: new Date().toISOString(),
      module: this.progress.currentModule,
      levelId,
      score,
      hintsUsed,
      retries,
    };
    this.progress.scenarioHistory.push(record);

    this.save();
  }

  advanceModule(moduleId: number): void {
    if (!this.progress.modulesCompleted.includes(moduleId)) {
      this.progress.modulesCompleted.push(moduleId);
    }
    if (moduleId < 5) {
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
    const parts = levelId.split('_');
    const moduleId = parseInt(parts[0], 10);
    const levelNum = parseInt(parts[1], 10);

    if (moduleId === 1 && levelNum === 1) return true;
    if (levelNum === 1) {
      return this.progress.modulesCompleted.includes(moduleId - 1);
    }
    const prevLevelId = `${moduleId}_${levelNum - 1}`;
    return (this.progress.levelScores[prevLevelId] ?? 0) > 0;
  }

  isModuleCompleted(moduleId: number): boolean {
    return this.progress.modulesCompleted.includes(moduleId);
  }

  getOverallProgress(): { percentage: number; completedLevels: number; totalLevels: number } {
    const totalLevels = 5 * 4; // 5 modules * 4 levels
    const completedLevels = Object.values(this.progress.levelScores).filter((s) => s > 0).length;
    return {
      percentage: Math.round((completedLevels / totalLevels) * 100),
      completedLevels,
      totalLevels,
    };
  }

  getSettings() {
    return this.progress.settings;
  }

  updateSettings(settings: Partial<PlayerProgress['settings']>): void {
    this.progress.settings = { ...this.progress.settings, ...settings };
    this.save();
  }
}
