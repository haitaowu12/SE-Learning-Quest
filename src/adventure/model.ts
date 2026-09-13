/** Original, bounded RPG chapter. Outcomes describe this fictional quay rehearsal only. */
export type Place = 'workshop' | 'quay' | 'bench';
export type Clue = 'lamp' | 'crystal' | 'ledger' | 'mara' | 'crew' | 'receiver' | 'trial';
export type Device = 'bell' | 'beacon' | 'messenger';
export type Meaning = 'hold' | 'wait';
export type Claim = 'sent' | 'acted';
export type Action =
  | { type: 'inspect'; clue: Clue }
  | { type: 'travel'; place: Place }
  | { type: 'observe' }
  | { type: 'equip'; device: Device }
  | { type: 'brief'; meaning: Meaning }
  | { type: 'test' }
  | { type: 'pin'; claim: Claim; clue: Clue }
  | { type: 'finish' };
export interface Trial { device: Device; meaning: Meaning | null; noticed: boolean; acted: boolean }
export interface Chapter {
  place: Place;
  clues: Clue[];
  observed: boolean;
  device: Device;
  meaning: Meaning | null;
  trial: Trial | null;
  pins: Partial<Record<Claim, Clue>>;
  complete: boolean;
}
export interface ChapterSave {
  version: 1;
  campaign: 'asterfall-illustrated';
  actions: Action[];
  settings: { lessMotion: boolean; largeText: boolean };
}
export const freshSave = (): ChapterSave => ({ version: 1, campaign: 'asterfall-illustrated', actions: [], settings: { lessMotion: false, largeText: false } });
export const freshChapter = (): Chapter => ({ place: 'workshop', clues: [], observed: false, device: 'bell', meaning: null, trial: null, pins: {}, complete: false });
const places: Place[] = ['workshop', 'quay', 'bench'];
const devices: Device[] = ['bell', 'beacon', 'messenger'];
const cluePlace: Partial<Record<Clue, Place>> = { lamp: 'workshop', crystal: 'workshop', ledger: 'workshop', mara: 'quay', crew: 'quay', receiver: 'quay' };
export const canLeaveWorkshop = (s: Chapter): boolean => ['lamp', 'crystal'].every(id => s.clues.includes(id as Clue));
export const canRepair = (s: Chapter): boolean => s.observed && ['mara', 'crew', 'receiver'].every(id => s.clues.includes(id as Clue));
export const canFinish = (s: Chapter): boolean => !!s.trial?.acted && s.pins.sent === 'lamp' && s.pins.acted === 'trial';
export const evaluateTrial = (device: Device, meaning: Meaning | null): Trial => ({ device, meaning, noticed: device !== 'bell', acted: device !== 'bell' && meaning === 'hold' });

function requireThat(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function invalidate(s: Chapter): void { s.trial = null; s.pins = {}; s.clues = s.clues.filter(id => id !== 'trial'); }

export function step(state: Chapter, action: Action): Chapter {
  requireThat(action && typeof action === 'object' && !Array.isArray(action), 'Choose an action in the scene.');
  const expected: Record<string, string[]> = { inspect: ['type', 'clue'], travel: ['type', 'place'], observe: ['type'], equip: ['type', 'device'], brief: ['type', 'meaning'], test: ['type'], pin: ['type', 'claim', 'clue'], finish: ['type'] };
  requireThat(Object.hasOwn(expected, action.type), 'This chapter does not recognize that action.');
  requireThat(Object.keys(action).length === expected[action.type].length && Object.keys(action).every(key => expected[action.type].includes(key)), 'The action contains an unsupported field.');
  requireThat(!state.complete, 'This chapter is recorded. Start another journey to try a different ending.');
  const next = structuredClone(state);
  if (action.type === 'travel') {
    requireThat(places.includes(action.place), 'That place is not on this journey.');
    requireThat(action.place === 'workshop' || canLeaveWorkshop(state), 'Inspect the lamp and voice crystal before following Sera’s trail.');
    requireThat(action.place !== 'bench' || canRepair(state), 'Meet Mara, inspect the crew and receiver, and try the old bell first.');
    next.place = action.place;
    return next;
  }
  if (action.type === 'inspect') {
    requireThat(Object.hasOwn(cluePlace, action.clue) && cluePlace[action.clue] === state.place, 'That object is in a different scene.');
    if (!next.clues.includes(action.clue)) next.clues.push(action.clue);
    return next;
  }
  if (action.type === 'observe') {
    requireThat(state.place === 'quay', 'Try the old bell at Lower Quay.');
    next.observed = true;
    if (!next.clues.includes('receiver')) next.clues.push('receiver');
    return next;
  }
  requireThat(state.place === 'bench' && canRepair(state), 'Reach the warning station with Mara first.');
  switch (action.type) {
    case 'equip':
      requireThat(devices.includes(action.device), 'Choose one of the available warning tools.');
      if (next.device !== action.device) { next.device = action.device; invalidate(next); }
      break;
    case 'brief':
      requireThat(action.meaning === 'hold' || action.meaning === 'wait', 'Choose a meaning for the crew’s signal.');
      if (next.meaning !== action.meaning) { next.meaning = action.meaning; invalidate(next); }
      break;
    case 'test':
      next.trial = evaluateTrial(state.device, state.meaning);
      next.pins = {};
      if (!next.clues.includes('trial')) next.clues.push('trial');
      break;
    case 'pin':
      requireThat(state.trial?.acted, 'Rehearse until the crew can notice the warning and hold the ferry.');
      requireThat(action.claim === 'sent' || action.claim === 'acted', 'Choose a claim in the ledger.');
      requireThat(state.clues.includes(action.clue), 'Collect that evidence before using it.');
      requireThat(action.clue === (action.claim === 'sent' ? 'lamp' : 'trial'), action.claim === 'sent' ? 'Use the tower log: it records the message being sent.' : 'The tower log cannot show what this crew did. Use the quay rehearsal.');
      next.pins[action.claim] = action.clue;
      break;
    case 'finish':
      requireThat(canFinish(state), 'Match the two records to what they actually show.');
      next.complete = true;
      break;
  }
  return next;
}

export function replay(save: ChapterSave): Chapter { return save.actions.reduce(step, freshChapter()); }
export function dispatch(save: ChapterSave, action: Action): ChapterSave {
  const before = replay(save);
  const after = step(before, action);
  if (JSON.stringify(before) === JSON.stringify(after)) return save;
  requireThat(save.actions.length < 1000, 'This expedition has reached its action limit. Export it and start another journey.');
  return { ...save, actions: [...save.actions, structuredClone(action)] };
}
export const saveKey = (path: string): string => `se_learning_quest_illustrated_v1:${path.replace(/index\.html$/, '').replace(/\/+$/, '') || '/'}`;

export function parseChapterSave(raw: string): ChapterSave {
  requireThat(new TextEncoder().encode(raw).length <= 250_000, 'This save exceeds the 250 KB limit.');
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your journey has not changed.'); }
  requireThat(data && typeof data === 'object' && !Array.isArray(data), 'A chapter save must be an object.');
  const input = data as ChapterSave;
  requireThat(Object.keys(input).length === 4 && Object.keys(input).every(k => ['version', 'campaign', 'actions', 'settings'].includes(k)), 'This save contains unsupported fields.');
  requireThat(input.version === 1 && input.campaign === 'asterfall-illustrated', 'This is not a supported illustrated-chapter save. Keep Classic saves for Classic.');
  requireThat(Array.isArray(input.actions) && input.actions.length <= 1000, 'This save contains too many actions.');
  requireThat(input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings), 'Reading settings are missing.');
  requireThat(Object.keys(input.settings).length === 2 && typeof input.settings.lessMotion === 'boolean' && typeof input.settings.largeText === 'boolean', 'Reading settings are not supported.');
  replay(input);
  return structuredClone(input);
}

export function objective(s: Chapter): string {
  if (s.complete) return 'You earned Mara’s trust. Sera’s trail leads to the Brass Quarter.';
  if (s.place === 'workshop') return canLeaveWorkshop(s) ? 'Follow Sera’s trail. Meet Mara at Lower Quay.' : 'Inspect the green lamp and Sera’s voice crystal.';
  if (s.place === 'quay') {
    if (!s.clues.includes('mara')) return 'Talk to Mara beside her ferry.';
    if (!s.observed) return 'Try the old bell. Watch the crew, not just the lamp.';
    if (!s.clues.includes('crew')) return 'Look at the crew. What made the warning hard to notice?';
    return 'Go with Mara to the warning station.';
  }
  if (!s.trial?.acted) return 'Help this crew notice a warning and hold the ferry.';
  if (!canFinish(s)) return 'Match each record to what it shows. Then hand over the watch.';
  return 'Hand the plan to Mara and learn where Sera went.';
}
