import { councilSaveKey, parseCouncilSave } from '../council/model.ts';
import type { CouncilSave } from '../council/types.ts';
import type { StoragePort } from '../council/persistence.ts';
import type { TabSnapshot } from '../tab-memory.ts';
import { archiveSaveKey, freshArchiveSave, MAX_ARCHIVE_BYTES, parseArchiveSave } from './model.ts';
import type { ArchiveSave } from './types.ts';

export type LoadedArchive = TabSnapshot<ArchiveSave | null>;
let preparedArrival: CouncilSave | null = null;
export function prepareArchive(save: CouncilSave): void { preparedArrival = freshArchiveSave(save).arrival; }
export function consumeArchiveArrival(): CouncilSave | null {
  const arrival = preparedArrival;
  preparedArrival = null;
  return arrival;
}
export function parseArchiveImport(raw: string): ArchiveSave {
  if (new TextEncoder().encode(raw).length > MAX_ARCHIVE_BYTES) throw new Error('This save exceeds the 600 KB limit.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your archive history has not changed.'); }
  if (value && typeof value === 'object' && 'campaign' in value && value.campaign === 'asterfall-brass-quarter') return freshArchiveSave(parseCouncilSave(raw));
  return parseArchiveSave(raw);
}
export function loadArchive(storage: StoragePort, path: string, arrival: CouncilSave | null = null, remembered: LoadedArchive | null = null): LoadedArchive {
  let raw: string | null = null;
  try {
    raw = storage.getItem(archiveSaveKey(path));
    if (remembered?.save) return remembered.raw === raw ? remembered : { ...remembered, blocked: true, notice: 'Another tab changed this archive while you were away. Export this tab or load the stored investigation to reconcile.' };
    if (raw !== null) return { save: parseArchiveSave(raw), raw, blocked: false, notice: '' };
  } catch {
    return {
      save: remembered?.save ?? (arrival ? freshArchiveSave(arrival) : null), raw: remembered?.raw ?? raw, blocked: true,
      notice: raw !== null ? 'The original archive save is preserved but could not be read. Export the stored copy before replacing it.' : 'Storage is unavailable. Import or continue in this tab, then export before reloading or closing it.',
    };
  }
  if (arrival) return { save: freshArchiveSave(arrival), raw, blocked: false, notice: '' };
  try {
    const crossing = storage.getItem(councilSaveKey(path));
    return { save: crossing === null ? null : freshArchiveSave(parseCouncilSave(crossing)), raw, blocked: false, notice: '' };
  } catch {
    return { save: null, raw, blocked: false, notice: 'Finish the Brass Quarter or import a completed crossing. Its original save is unchanged.' };
  }
}
export function writeArchive(storage: StoragePort, path: string, save: ArchiveSave, expected: string | null): { ok: true; raw: string } | { ok: false; notice: string } {
  try {
    const key = archiveSaveKey(path);
    if (storage.getItem(key) !== expected) return { ok: false, notice: 'Another tab changed the archive. Export this tab or load the stored investigation before saving again.' };
    const raw = JSON.stringify(save);
    storage.setItem(key, raw);
    return { ok: true, raw };
  } catch {
    return { ok: false, notice: 'The archive is in memory. Export it before closing the tab; browser storage could not save it.' };
  }
}