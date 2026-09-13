import { parseChapterSave, replay } from './model.ts';
import type { ChapterSave } from './model.ts';

// Preserve the crossing even when browser storage is denied. A reload still needs
// an exported save; this is deliberately tab memory, not an alternate persistence claim.
let crossing: ChapterSave | null = null;

export function prepareCrossing(save: ChapterSave): void {
  const checked = parseChapterSave(JSON.stringify(save));
  if (!replay(checked).complete) throw new Error('Finish Mara’s watch handover before taking the ferry.');
  crossing = checked;
}

export function consumeCrossing(): ChapterSave | null {
  const result = crossing;
  crossing = null;
  return result;
}
