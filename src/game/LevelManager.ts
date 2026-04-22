import type { LevelData, LevelMeta, ModuleMeta, PlayerProgress } from '@/types/index.ts';
import moduleData from '@/data/modules.json';
import { LEVELS_PER_MODULE, MODULE_COUNT } from '@/utils/constants.ts';

export class LevelManager {
  private static instance: LevelManager | null = null;
  private modules: ModuleMeta[] = [];
  private levels: Map<string, LevelData> = new Map();

  private constructor() {
    this.loadModules();
  }

  static getInstance(): LevelManager {
    if (!LevelManager.instance) {
      LevelManager.instance = new LevelManager();
    }
    return LevelManager.instance;
  }

  getModuleCount(): number {
    return this.modules.length;
  }

  private loadModules(): void {
    const raw = moduleData as { modules: ModuleMeta[]; levels: LevelData[] };
    this.modules = raw.modules;
    for (const lvl of raw.levels) {
      this.levels.set(lvl.id, lvl);
    }
  }

  getModules(progress: PlayerProgress): ModuleMeta[] {
    return this.modules.map((m) => ({
      ...m,
      locked: m.id > 1 && !progress.modulesCompleted.includes(m.id - 1),
      completed: progress.modulesCompleted.includes(m.id),
      levels: m.levels.map((l) => this.enrichLevelMeta(l, progress)),
    }));
  }

  private enrichLevelMeta(level: LevelMeta, progress: PlayerProgress): LevelMeta {
    const best = progress.levelScores[level.id] ?? 0;
    const unlocked = this.isLevelUnlocked(level.id, progress);
    return {
      ...level,
      locked: !unlocked,
      completed: best > 0,
      bestScore: best,
    };
  }

  isLevelUnlocked(levelId: string, progress: PlayerProgress): boolean {
    const parts = levelId.split('_');
    const moduleId = parseInt(parts[0], 10);
    const levelNum = parseInt(parts[1], 10);

    if (moduleId === 1 && levelNum === 1) return true;
    if (levelNum === 1) {
      return progress.modulesCompleted.includes(moduleId - 1);
    }
    const prev = `${moduleId}_${levelNum - 1}`;
    return (progress.levelScores[prev] ?? 0) > 0;
  }

  getLevelData(levelId: string): LevelData | undefined {
    return this.levels.get(levelId);
  }

  getModuleLevels(moduleId: number): LevelData[] {
    return Array.from(this.levels.values()).filter((l) => l.moduleId === moduleId);
  }

  getNextLevelId(currentLevelId: string): string | null {
    const parts = currentLevelId.split('_');
    const moduleId = parseInt(parts[0], 10);
    const levelNum = parseInt(parts[1], 10);
    if (levelNum < LEVELS_PER_MODULE) {
      return `${moduleId}_${levelNum + 1}`;
    }
    if (moduleId < MODULE_COUNT) {
      return `${moduleId + 1}_1`;
    }
    return null;
  }
}
