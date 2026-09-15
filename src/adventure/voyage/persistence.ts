import { archiveSaveKey, parseArchiveSave } from '../archive/model.ts';
import type { ArchiveSave } from '../archive/types.ts';
import type { StoragePort } from '../council/persistence.ts';
import type { TabSnapshot } from '../tab-memory.ts';
import { freshVoyageSave, MAX_VOYAGE_BYTES, parseVoyageSave, voyageSaveKey } from './model.ts';
import type { VoyageSave } from './types.ts';
export type LoadedVoyage = TabSnapshot<VoyageSave | null>;
let prepared: ArchiveSave | null = null;
export function prepareVoyage(save: ArchiveSave): void { prepared = freshVoyageSave(save).arrival; }
export function consumeVoyageArrival(): ArchiveSave | null { const arrival = prepared; prepared = null; return arrival; }
export function parseVoyageImport(raw: string): VoyageSave {
  if (new TextEncoder().encode(raw).length > MAX_VOYAGE_BYTES) throw new Error('This journey exceeds the 1 MB limit.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your journey has not changed.'); }
  if (value && typeof value === 'object' && 'campaign' in value && value.campaign === 'asterfall-dispatch-archive') return freshVoyageSave(parseArchiveSave(raw));
  return parseVoyageSave(raw);
}
export function loadVoyage(storage: StoragePort, path: string, arrival: ArchiveSave | null = null, remembered: LoadedVoyage | null = null): LoadedVoyage {
  let raw: string | null = null;
  try {
    raw = storage.getItem(voyageSaveKey(path));
    if (remembered?.save) return remembered.raw === raw ? remembered : { ...remembered, blocked: true, notice: 'Another tab changed this journey while you were away. Export this tab or load the stored journey.' };
    if (raw !== null) return { save: parseVoyageSave(raw), raw, blocked: false, notice: '' };
  } catch {
    return { save: remembered?.save ?? (arrival ? freshVoyageSave(arrival) : null), raw: remembered?.raw ?? raw, blocked: true,
      notice: raw !== null ? 'The original journey is preserved but could not be read. Export the stored copy before replacing it.' : 'Storage is unavailable. Continue or import in this tab, then export before reloading or closing it.' };
  }
  if (arrival) return { save: freshVoyageSave(arrival), raw, blocked: false, notice: '' };
  try {
    const archive = storage.getItem(archiveSaveKey(path));
    return { save: archive === null ? null : freshVoyageSave(parseArchiveSave(archive)), raw, blocked: false, notice: '' };
  } catch { return { save: null, raw, blocked: false, notice: 'Finish the archive or import its completed packet. The original archive is unchanged.' }; }
}
export function writeVoyage(storage: StoragePort, path: string, save: VoyageSave, expected: string | null): { ok: true; raw: string } | { ok: false; notice: string } {
  try {
    if (storage.getItem(voyageSaveKey(path)) !== expected) return { ok: false, notice: 'Another tab changed the journey. Export this tab or load the stored journey before saving again.' };
    const raw = JSON.stringify(save); storage.setItem(voyageSaveKey(path), raw); return { ok: true, raw };
  } catch { return { ok: false, notice: 'The journey is in memory. Export it before closing the tab; browser storage could not save it.' }; }
}