export interface TabSnapshot<T> { save: T; raw: string | null; blocked: boolean; notice: string }

// A route change is not a browser close. Keep unsaved RPG progress in this tab
// while Classic or another chapter is open; a full page reload still needs storage/export.
const snapshots = new Map<string, TabSnapshot<unknown>>();

export function rememberInTab<T>(key: string, snapshot: TabSnapshot<T>): void {
  snapshots.set(key, structuredClone(snapshot));
}
export function recallInTab<T>(key: string): TabSnapshot<T> | null {
  const snapshot = snapshots.get(key);
  return snapshot ? structuredClone(snapshot) as TabSnapshot<T> : null;
}
