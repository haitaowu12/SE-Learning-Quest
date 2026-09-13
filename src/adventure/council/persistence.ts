import { parseChapterSave, saveKey as openingKey } from '../model.ts';
import type { ChapterSave } from '../model.ts';
import { councilSaveKey, freshCouncilSave, MAX_COUNCIL_BYTES, parseCouncilSave } from './model.ts';
import type { CouncilSave } from './types.ts';
import type { TabSnapshot } from '../tab-memory.ts';

export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export interface LoadedCouncil {
  save: CouncilSave | null;
  raw: string | null;
  blocked: boolean;
  notice: string;
}

/** An old, completed chapter-one export is also a supported entrance to this chapter. */
export function parseCrossingImport(raw: string): CouncilSave {
  if (new TextEncoder().encode(raw).length > MAX_COUNCIL_BYTES) throw new Error('This save exceeds the 400 KB limit.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your crossing has not changed.'); }
  if (value && typeof value === 'object' && 'campaign' in value && value.campaign === 'asterfall-illustrated') {
    return freshCouncilSave(parseChapterSave(raw));
  }
  return parseCouncilSave(raw);
}

export function loadCouncil(storage: StoragePort, path: string, crossing: ChapterSave | null = null, remembered: TabSnapshot<CouncilSave | null> | null = null): LoadedCouncil {
  let raw: string | null = null;
  try {
    raw = storage.getItem(councilSaveKey(path));
    if (remembered?.save) return remembered.raw === raw ? remembered : { ...remembered, blocked: true, notice: 'Another tab changed this crossing while you were away. Your progress in this tab is preserved; export or load the stored crossing to reconcile.' };
    if (raw !== null) return { save: parseCouncilSave(raw), raw, blocked: false, notice: '' };
  } catch (error) {
    return {
      save: remembered?.save ?? (crossing ? freshCouncilSave(crossing) : null), raw: remembered?.raw ?? raw, blocked: true,
      notice: raw !== null
        ? 'The original Brass Quarter save is preserved but could not be read. Export the stored copy before replacing it.'
        : `Storage is unavailable. ${crossing || remembered?.save ? 'This crossing can continue in memory; export before reloading or closing the tab.' : 'Import a completed opening or Brass Quarter save to play in this tab.'} ${error instanceof Error ? error.message : ''}`,
    };
  }
  if (crossing) return { save: freshCouncilSave(crossing), raw, blocked: false, notice: '' };
  try {
    const opening = storage.getItem(openingKey(path));
    return { save: opening === null ? null : freshCouncilSave(parseChapterSave(opening)), raw, blocked: false, notice: '' };
  } catch {
    return { save: null, raw, blocked: false, notice: 'Finish the opening chapter, or import a completed opening save. The existing opening save is unchanged.' };
  }
}

export function writeCouncil(storage: StoragePort, path: string, save: CouncilSave, expected: string | null): { ok: true; raw: string } | { ok: false; notice: string } {
  try {
    const key = councilSaveKey(path);
    if (storage.getItem(key) !== expected) return { ok: false, notice: 'Another tab changed this crossing. Export this tab or load the stored crossing before saving again.' };
    const raw = JSON.stringify(save);
    storage.setItem(key, raw);
    return { ok: true, raw };
  } catch {
    return { ok: false, notice: 'This crossing is in memory. Export it before closing the tab; browser storage could not save it.' };
  }
}
