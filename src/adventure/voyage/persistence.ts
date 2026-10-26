import { archiveSaveKey, parseArchiveSave } from '../archive/model.ts';
import type { ArchiveSave } from '../archive/types.ts';
import type { StoragePort } from '../council/persistence.ts';
import type { TabSnapshot } from '../tab-memory.ts';
import { freshVoyageSave, MAX_VOYAGE_BYTES, parseVoyageSave, voyageSaveKey } from './model.ts';
import type { VoyageSave } from './types.ts';
export type VoyageStorageSnapshot = { readable: true; raw: string | null } | { readable: false; raw: null };
export interface IncomingVoyage { save: VoyageSave; baseline: VoyageStorageSnapshot }
export type LoadedVoyage = TabSnapshot<VoyageSave | null> & { incoming: IncomingVoyage | null };
export type ReplacedVoyage =
  | { ok: true; raw: string | null; blocked: boolean; notice: string }
  | { ok: false; current: VoyageStorageSnapshot; notice: string };
let prepared: ArchiveSave | null = null;
export function prepareVoyage(save: ArchiveSave): void { prepared = freshVoyageSave(save).arrival; }
export function consumeVoyageArrival(): ArchiveSave | null { const arrival = prepared; prepared = null; return arrival; }
export function readVoyageStorage(storage: StoragePort, path: string): VoyageStorageSnapshot {
  try { return { readable: true, raw: storage.getItem(voyageSaveKey(path)) }; }
  catch { return { readable: false, raw: null }; }
}
function sameArchiveHistory(left: ArchiveSave, right: ArchiveSave): boolean {
  const history = (save: ArchiveSave) => JSON.stringify(save, (key, value) => key === 'settings' ? undefined : value);
  return history(left) === history(right);
}
function withIncoming(loaded: TabSnapshot<VoyageSave | null>, candidate: VoyageSave | null, baseline: VoyageStorageSnapshot, confirmArrival: boolean): LoadedVoyage {
  const incoming = confirmArrival && candidate && loaded.save && !sameArchiveHistory(loaded.save.arrival, candidate.arrival) ? { save: candidate, baseline } : null;
  return { ...loaded, incoming };
}
export function parseVoyageImport(raw: string): VoyageSave {
  if (new TextEncoder().encode(raw).length > MAX_VOYAGE_BYTES) throw new Error('This journey exceeds the 1 MB limit.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your journey has not changed.'); }
  if (value && typeof value === 'object' && 'campaign' in value && value.campaign === 'asterfall-dispatch-archive') return freshVoyageSave(parseArchiveSave(raw));
  return parseVoyageSave(raw);
}
export function loadVoyage(storage: StoragePort, path: string, arrival: ArchiveSave | null = null, remembered: TabSnapshot<VoyageSave | null> | null = null, confirmArrival = false): LoadedVoyage {
  const candidate = arrival ? freshVoyageSave(arrival) : null;
  let raw: string | null = null;
  let baseline: VoyageStorageSnapshot = { readable: false, raw: null };
  try {
    raw = storage.getItem(voyageSaveKey(path));
    baseline = { readable: true, raw };
    if (remembered?.save) return withIncoming(remembered.raw === raw ? remembered : { ...remembered, blocked: true, notice: 'Another tab changed this journey while you were away. Export this tab or load the stored journey.' }, candidate, baseline, confirmArrival);
    if (raw !== null) return withIncoming({ save: parseVoyageSave(raw), raw, blocked: false, notice: '' }, candidate, baseline, confirmArrival);
  } catch {
    return withIncoming({ save: remembered?.save ?? candidate, raw: remembered?.raw ?? raw, blocked: true,
      notice: raw !== null ? 'The original journey is preserved but could not be read. Export the stored copy before replacing it.' : 'Storage is unavailable. Continue or import in this tab, then export before reloading or closing it.' }, candidate, baseline, confirmArrival);
  }
  if (candidate) return { save: candidate, raw, blocked: false, notice: '', incoming: null };
  try {
    const archive = storage.getItem(archiveSaveKey(path));
    return { save: archive === null ? null : freshVoyageSave(parseArchiveSave(archive)), raw, blocked: false, notice: '', incoming: null };
  } catch { return { save: null, raw, blocked: false, notice: 'Finish the archive or import its completed packet. The original archive is unchanged.', incoming: null }; }
}
export function writeVoyage(storage: StoragePort, path: string, save: VoyageSave, expected: string | null): { ok: true; raw: string } | { ok: false; notice: string } {
  try {
    if (storage.getItem(voyageSaveKey(path)) !== expected) return { ok: false, notice: 'Another tab changed the journey. Export this tab or load the stored journey before saving again.' };
    const raw = JSON.stringify(save); storage.setItem(voyageSaveKey(path), raw); return { ok: true, raw };
  } catch { return { ok: false, notice: 'The journey is in memory. Export it before closing the tab; browser storage could not save it.' }; }
}
export function replaceVoyage(storage: StoragePort, path: string, save: VoyageSave, expected: VoyageStorageSnapshot): ReplacedVoyage {
  const current = readVoyageStorage(storage, path);
  if (!current.readable) return { ok: true, raw: expected.readable ? expected.raw : null, blocked: true, notice: 'The replacement is in memory. Export it before closing or reloading this tab; browser storage could not save it.' };
  if (!expected.readable || current.raw !== expected.raw) return { ok: false, current, notice: 'The stored journey changed while this confirmation was open. Nothing was overwritten. Review the current stored journey, then confirm again if you still want to replace it.' };
  try { const raw = JSON.stringify(save); storage.setItem(voyageSaveKey(path), raw); return { ok: true, raw, blocked: false, notice: '' }; }
  catch { return { ok: true, raw: expected.raw, blocked: true, notice: 'The replacement is in memory. Export it before closing or reloading this tab; browser storage could not save it.' }; }
}
