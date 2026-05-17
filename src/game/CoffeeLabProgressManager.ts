import type { CoffeeLabCourse, CoffeeLabProgressState } from '../types/index.ts';

const STORAGE_KEY = 'se_learning_quest_coffee_lab_progress';
const PROGRESS_VERSION = 2;

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export class CoffeeLabProgressManager {
  static load(course: CoffeeLabCourse): CoffeeLabProgressState {
    const fallback = this.createDefault(course);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as CoffeeLabProgressState;
      if (
        parsed.version !== PROGRESS_VERSION ||
        parsed.courseId !== course.id ||
        typeof parsed.currentUnitId !== 'string' ||
        !Array.isArray(parsed.visitedUnitIds) ||
        !Array.isArray(parsed.completedUnitIds) ||
        typeof parsed.artifactNotes !== 'object' ||
        parsed.artifactNotes === null
      ) {
        return fallback;
      }
      return parsed;
    } catch {
      return fallback;
    }
  }

  static save(progress: CoffeeLabProgressState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...progress,
      updatedAt: new Date().toISOString(),
    }));
  }

  static visit(course: CoffeeLabCourse, unitId: string): CoffeeLabProgressState {
    const progress = this.load(course);
    const next = {
      ...progress,
      currentUnitId: unitId,
      visitedUnitIds: unique(progress.visitedUnitIds.concat(unitId)),
    };
    this.save(next);
    return next;
  }

  static complete(course: CoffeeLabCourse, unitId: string, artifactNote = ''): CoffeeLabProgressState {
    const progress = this.load(course);
    const next = {
      ...progress,
      currentUnitId: unitId,
      visitedUnitIds: unique(progress.visitedUnitIds.concat(unitId)),
      completedUnitIds: unique(progress.completedUnitIds.concat(unitId)),
      artifactNotes: {
        ...progress.artifactNotes,
        [unitId]: artifactNote.trim(),
      },
    };
    this.save(next);
    return next;
  }

  static reset(course: CoffeeLabCourse): CoffeeLabProgressState {
    localStorage.removeItem(STORAGE_KEY);
    const progress = this.createDefault(course);
    this.save(progress);
    return progress;
  }

  private static createDefault(course: CoffeeLabCourse): CoffeeLabProgressState {
    const firstUnitId = course.units[0]?.id ?? 'frame';
    return {
      version: PROGRESS_VERSION,
      courseId: course.id,
      currentUnitId: firstUnitId,
      visitedUnitIds: [firstUnitId],
      completedUnitIds: [],
      artifactNotes: {},
      updatedAt: new Date().toISOString(),
    };
  }
}
