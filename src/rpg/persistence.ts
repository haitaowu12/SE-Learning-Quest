import { quests, questById } from './campaign.ts';
import { canComplete, derive, newSave, puzzleAnswerProblem, puzzlePassed, skills, storyDecisions } from './engine.ts';
import type { QuestRecord, Save, Settings, Skill } from './types.ts';

export const MAX_SAVE_BYTES = 500_000;
export type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export interface LoadedSave { save: Save; raw: string | null; notice: string; blocked: boolean }
export type WriteResult = { ok: true; raw: string } | { ok: false; reason: 'conflict' | 'storage'; message: string };

/** Scope to the deployed project path: other Pages games and legacy episodes remain separate. */
export function saveKey(pathname: string): string {
  const base = pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  return `se_learning_quest_asterfall_v1:${base}`;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, allowed: string[], label: string): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw new Error(`${label} contains an unrecognized field.`);
}
function bool(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be true or false.`);
  return value;
}
function boundedInt(value: unknown, max: number, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > max) throw new Error(`${label} is out of range.`);
  return value as number;
}

/** Strict schema + replay validation. Imported XP, flags and unlocked rewards are never trusted. */
export function parseSave(text: string): Save {
  if (new TextEncoder().encode(text).byteLength > MAX_SAVE_BYTES) throw new Error('This save is larger than the 500 KB limit.');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('This is not valid JSON. Your current expedition has not changed.'); }
  const root = object(parsed, 'Save');
  exactKeys(root, ['version', 'campaign', 'contentVersion', 'player', 'onboarded', 'activeQuestId', 'records', 'talents', 'settings'], 'Save');
  if (root.version !== 1 || root.campaign !== 'asterfall' || root.contentVersion !== 1) throw new Error('This save belongs to a different game or unsupported version. Keep the original file for its matching release.');
  const player = object(root.player, 'Player');
  exactKeys(player, ['name', 'origin'], 'Player');
  if (typeof player.name !== 'string' || player.name.trim().length < 1 || player.name.length > 24 || /[\u0000-\u001f]/.test(player.name)) throw new Error('The keeper’s name must contain 1–24 readable characters.');
  if (!skills.includes(player.origin as Skill)) throw new Error('The keeper’s origin is not recognized.');
  const save = newSave(player.name, player.origin as Skill);
  save.onboarded = bool(root.onboarded, 'Journey state');
  const settings = object(root.settings, 'Settings');
  exactKeys(settings, ['textScale', 'reducedMotion', 'highContrast'], 'Settings');
  if (![1, 1.25, 1.5, 2].includes(settings.textScale as number)) throw new Error('Text size is not supported.');
  save.settings = {
    textScale: settings.textScale as Settings['textScale'],
    reducedMotion: bool(settings.reducedMotion, 'Reduced motion'),
    highContrast: bool(settings.highContrast, 'High contrast'),
  };
  const records = object(root.records, 'Quest history');
  if (Object.keys(records).some((id) => !questById.has(id))) throw new Error('Quest history contains an unknown quest.');
  if (Object.keys(records).length && !save.onboarded) throw new Error('Quest history requires a started journey.');
  // Canonical order is topological; prerequisites must have already passed replay validation.
  for (const quest of quests) {
    if (!Object.hasOwn(records, quest.id)) continue;
    if (!quest.prerequisites.every((id) => save.records[id]?.completed)) throw new Error(`${quest.title} is missing a completed prerequisite.`);
    const input = object(records[quest.id], 'Quest record');
    exactKeys(input, ['decisions', 'puzzleAnswer', 'attempts', 'assisted', 'completed'], 'Quest record');
    const decisions = object(input.decisions, 'Decisions');
    const record: QuestRecord = {
      decisions: {}, puzzleAnswer: null,
      attempts: boundedInt(input.attempts, 999, 'Attempts'),
      assisted: bool(input.assisted, 'Guided assistance'), completed: false,
    };
    save.records[quest.id] = record;
    let gap = false;
    for (const decision of quest.decisions) {
      const visible = storyDecisions(save, quest).some((entry) => entry.id === decision.id);
      const selected = decisions[decision.id];
      if (selected === undefined) { if (visible) gap = true; continue; }
      if (!visible || gap || typeof selected !== 'string' || !decision.options.some((choice) => choice.id === selected)) throw new Error(`${quest.title} contains an invalid or out-of-order decision.`);
      record.decisions[decision.id] = selected;
    }
    if (Object.keys(decisions).some((id) => !Object.hasOwn(record.decisions, id))) throw new Error(`${quest.title} contains an unknown decision.`);
    if (input.puzzleAnswer !== null) {
      const puzzle = quest.puzzle;
      if (!puzzle || gap) throw new Error('A bench result precedes its conversation or has no matching challenge.');
      const problem = puzzleAnswerProblem(puzzle, input.puzzleAnswer);
      if (problem) throw new Error(problem);
      record.puzzleAnswer = structuredClone(input.puzzleAnswer) as string[] | Record<string, string>;
      if (!puzzlePassed(puzzle, record.puzzleAnswer) && record.attempts < 1) throw new Error('An unsuccessful bench result is missing its recorded attempt.');
    }
    if (record.assisted && (!quest.puzzle || record.attempts < 2 || record.puzzleAnswer === null || !puzzlePassed(quest.puzzle, record.puzzleAnswer))) throw new Error('Guided assistance has no valid preceding attempts and guided result.');
    if (bool(input.completed, 'Quest completion')) {
      if (!canComplete(save, quest)) throw new Error(`${quest.title} is marked complete without its required evidence.`);
      record.completed = true;
    }
  }
  if (root.activeQuestId !== null && (typeof root.activeQuestId !== 'string' || !Object.hasOwn(save.records, root.activeQuestId))) throw new Error('The active quest is not in the expedition history.');
  save.activeQuestId = root.activeQuestId as string | null;
  if (!Array.isArray(root.talents) || root.talents.length > Math.floor(derive(save).level / 2) || root.talents.some((skill) => !skills.includes(skill as Skill))) throw new Error('Training exceeds the points earned by this expedition.');
  save.talents = [...root.talents] as Skill[];
  return save;
}

export function loadSave(storage: StoragePort, key: string): LoadedSave {
  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
    return { save: raw === null ? newSave() : parseSave(raw), raw, notice: '', blocked: false };
  } catch (error) {
    return {
      save: newSave(), raw, blocked: true,
      notice: raw === null
        ? 'Browser storage is unavailable. You can play in this tab and export your expedition before closing it.'
        : `The saved expedition could not be loaded: ${error instanceof Error ? error.message : 'Invalid save.'} The original is preserved; export it before replacing it.`,
    };
  }
}

/** Compare before writing so a stale tab cannot silently replace another tab’s progress. */
export function writeSave(storage: StoragePort, key: string, save: Save, expected: string | null): WriteResult {
  try {
    if (storage.getItem(key) !== expected) return { ok: false, reason: 'conflict', message: 'Another tab changed this expedition. Export this tab’s progress or load the other tab’s save in Settings before continuing to save.' };
    const raw = JSON.stringify(save);
    storage.setItem(key, raw);
    return { ok: true, raw };
  } catch {
    return { ok: false, reason: 'storage', message: 'Your progress is in memory, but browser storage could not save it. Export your expedition before closing this tab.' };
  }
}
