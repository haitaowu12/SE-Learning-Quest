import { parseChapterSave, replay as replayOpening } from '../model.ts';
import type { ChapterSave } from '../model.ts';
import type { CouncilAction, CouncilSave, CouncilState, Guest, HearingResult, PromiseSlot, PromiseToken } from './types.ts';

export const MAX_COUNCIL_BYTES = 400_000;
export const MAX_COUNCIL_ACTIONS = 1000;
export const seats = ['left', 'middle', 'right'] as const;
export const guests: Guest[] = ['mara', 'tavi', 'night', 'neri'];
export const slots: PromiseSlot[] = ['who', 'what', 'when', 'conditions'];
export const slotTokens: Record<PromiseSlot, PromiseToken[]> = {
  who: ['inhabited', 'registered'], what: ['perceivable', 'lamp'],
  when: ['ninety', 'twentyTwo'], conditions: ['west40-link-out', 'calm'],
};

function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export const freshCouncil = (): CouncilState => ({
  scene: 'landing', discoveries: [], seats: {}, relief: false, note: false,
  hearing: null, readback: false, promise: {}, review: null, evidenceStatus: null, complete: false,
});

export function freshCouncilSave(arrival: ChapterSave): CouncilSave {
  const opening = parseChapterSave(JSON.stringify(arrival));
  requireThat(replayOpening(opening).complete, 'Finish Mara’s quay chapter before taking the ferry to the Brass Quarter.');
  return { version: 1, campaign: 'asterfall-brass-quarter', arrival: opening, actions: [], settings: { ...opening.settings } };
}

export const canEnterHearing = (s: CouncilState): boolean => s.discoveries.includes('roll') && s.discoveries.includes('orren');
export const hearingReady = (s: CouncilState): boolean => !!s.hearing && s.hearing.gaps.length === 0 && (s.hearing.route === 'in-person' || s.readback);
export const promiseReady = (s: CouncilState): boolean => hearingReady(s) && !!s.review && s.review.gaps.length === 0;
export const canFinishCouncil = (s: CouncilState): boolean => !s.complete && promiseReady(s) && s.evidenceStatus === 'planned';

/** Several arrangements work. A record keeper is not a substitute for a user's account. */
export function assessHearing(s: CouncilState): HearingResult {
  const seated = Object.values(s.seats);
  const gaps: string[] = [];
  if (!seated.includes('mara')) gaps.push('Mara is missing: the ferry’s day work and Lower Quay homes need a voice.');
  if (!seated.includes('tavi')) gaps.push('Tavi is missing: the maker must hear which conditions the repair needs to serve.');
  const route = seated.includes('night') ? 'in-person' : seated.includes('neri') ? 'written' : null;
  if (route === 'in-person' && !s.relief) gaps.push('The night keeper is still on duty. Arrange the available relief before the keeper leaves the post.');
  if (route === 'written' && !s.note) gaps.push('Neri has records, but no night-watch account yet. Collect the keeper’s signed note.');
  if (route === null) gaps.push('The night watch is unheard. Invite its keeper, or ask Neri to carry the keeper’s account.');
  return { route, gaps };
}

export function assessPromise(s: CouncilState): string[] {
  const gaps: string[] = [];
  if (s.promise.who !== 'inhabited') gaps.push('The old register omits Lower Quay homes. Keep every inhabited quay in this promise.');
  if (s.promise.what !== 'perceivable') gaps.push('A green transmitter lamp does not tell us whether people can perceive the local warning.');
  if (s.promise.when !== 'ninety') gaps.push('22 seconds was the central demonstration, not the agreed field target. The hearing set 90 seconds from order to local warning.');
  if (s.promise.conditions !== 'west40-link-out') gaps.push('Calm workshop evidence leaves the stated west squall and unavailable inter-island link unexamined.');
  return gaps;
}

function invalidatePromise(s: CouncilState): void {
  s.review = null;
  s.evidenceStatus = null;
}
function invalidateHearing(s: CouncilState): void {
  s.hearing = null;
  s.readback = false;
  invalidatePromise(s);
}

export function councilStep(state: CouncilState, action: CouncilAction): CouncilState {
  requireThat(action && typeof action === 'object' && !Array.isArray(action), 'Choose an action in this scene.');
  const fields: Record<string, string[]> = {
    inspect: ['type', 'discovery'], travel: ['type', 'scene'], seat: ['type', 'guest', 'seat'],
    unseat: ['type', 'seat'], relief: ['type'], 'collect-note': ['type'], hear: ['type'],
    readback: ['type'], place: ['type', 'slot', 'token'], review: ['type'], label: ['type', 'status'], finish: ['type'],
  };
  requireThat(Object.hasOwn(fields, action.type), 'That action is not part of this chapter.');
  requireThat(Object.keys(action).length === fields[action.type].length && Object.keys(action).every(k => fields[action.type].includes(k)), 'The action has missing or unsupported fields.');
  requireThat(!state.complete, 'This chapter is recorded. Start it again to explore another arrangement.');
  const next = structuredClone(state);

  if (action.type === 'travel') {
    requireThat(['landing', 'hearing', 'atelier'].includes(action.scene), 'That place is not on this crossing.');
    requireThat(action.scene === 'landing' || canEnterHearing(state), 'Inspect the old register and speak to Orren at the landing first.');
    requireThat(action.scene !== 'atelier' || hearingReady(state), 'Hear the day and night accounts and confirm any written account first.');
    next.scene = action.scene;
    return next;
  }
  if (action.type === 'inspect') {
    const allowed = state.scene === 'landing' ? ['roll', 'orren'] : state.scene === 'hearing' ? guests : ['demo'];
    requireThat(allowed.includes(action.discovery as Guest), 'That person or object is in another scene.');
    if (!next.discoveries.includes(action.discovery)) next.discoveries.push(action.discovery);
    return next;
  }

  if (['seat', 'unseat', 'relief', 'collect-note', 'hear', 'readback'].includes(action.type)) {
    requireThat(state.scene === 'hearing' && canEnterHearing(state), 'Reach the council hearing first.');
    switch (action.type) {
      case 'seat': {
        requireThat(guests.includes(action.guest) && seats.includes(action.seat), 'Choose a person and a chair at this table.');
        requireThat(state.discoveries.includes(action.guest), 'Ask that person for their account before offering a chair.');
        if (state.seats[action.seat] === action.guest) return next;
        for (const seat of seats) if (next.seats[seat] === action.guest) delete next.seats[seat];
        next.seats[action.seat] = action.guest;
        invalidateHearing(next);
        break;
      }
      case 'unseat':
        requireThat(seats.includes(action.seat), 'Choose a chair at this table.');
        if (next.seats[action.seat]) { delete next.seats[action.seat]; invalidateHearing(next); }
        break;
      case 'relief':
        requireThat(state.discoveries.includes('night'), 'Ask the night keeper about duty cover first.');
        if (!next.relief) { next.relief = true; invalidateHearing(next); }
        break;
      case 'collect-note':
        requireThat(state.discoveries.includes('night') && state.discoveries.includes('neri'), 'Ask the night keeper and Neri before collecting a signed account.');
        if (!next.note) { next.note = true; invalidateHearing(next); }
        break;
      case 'hear': {
        const result = assessHearing(state);
        if (JSON.stringify(result) !== JSON.stringify(next.hearing)) {
          next.hearing = result;
          next.readback = false;
          invalidatePromise(next);
        }
        break;
      }
      case 'readback':
        requireThat(state.hearing?.route === 'written' && state.hearing.gaps.length === 0, 'First discuss the signed night-watch account with Mara, Tavi and Neri.');
        next.readback = true;
        break;
    }
    return next;
  }

  requireThat(state.scene === 'atelier' && hearingReady(state), 'Take the heard accounts to Tavi’s atelier first.');
  requireThat(state.discoveries.includes('demo'), 'Inspect the central-lantern demonstration before deciding what it proves.');
  switch (action.type) {
    case 'place':
      requireThat(slots.includes(action.slot), 'Choose a part of the promise parchment.');
      requireThat(slotTokens[action.slot].includes(action.token), 'That tile belongs to a different part of the promise.');
      if (next.promise[action.slot] !== action.token) { next.promise[action.slot] = action.token; invalidatePromise(next); }
      break;
    case 'review': {
      const gaps = assessPromise(state);
      if (JSON.stringify(next.review?.gaps) !== JSON.stringify(gaps)) { next.review = { gaps }; next.evidenceStatus = null; }
      break;
    }
    case 'label':
      requireThat(action.status === 'planned' || action.status === 'proven', 'Choose an evidence stamp on the workbench.');
      requireThat(promiseReady(state), 'Review the assembled promise with Tavi first.');
      requireThat(action.status === 'planned', 'The 22-second central demonstration did not exercise this field promise. Its all-quay storm evidence is still planned.');
      next.evidenceStatus = 'planned';
      break;
    case 'finish':
      requireThat(canFinishCouncil(state), 'Keep the agreed target and its unperformed field tests separate before signing.');
      next.complete = true;
      break;
  }
  return next;
}

export function replayCouncil(save: CouncilSave): CouncilState {
  requireThat(replayOpening(save.arrival).complete, 'The ferry crossing requires a completed opening chapter.');
  return save.actions.reduce(councilStep, freshCouncil());
}

export function dispatchCouncil(save: CouncilSave, action: CouncilAction): CouncilSave {
  const before = replayCouncil(save);
  const after = councilStep(before, action);
  if (JSON.stringify(before) === JSON.stringify(after)) return save;
  requireThat(save.actions.length < MAX_COUNCIL_ACTIONS, 'This chapter has reached its action limit. Export it before starting again.');
  return { ...save, actions: [...save.actions, structuredClone(action)] };
}

export function parseCouncilSave(raw: string): CouncilSave {
  requireThat(new TextEncoder().encode(raw).length <= MAX_COUNCIL_BYTES, 'This save exceeds the 400 KB limit.');
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your journey has not changed.'); }
  requireThat(data && typeof data === 'object' && !Array.isArray(data), 'A saved crossing must be an object.');
  const input = data as CouncilSave;
  requireThat(Object.keys(input).length === 5 && Object.keys(input).every(k => ['version', 'campaign', 'arrival', 'actions', 'settings'].includes(k)), 'This save has missing or unsupported fields.');
  requireThat(input.version === 1 && input.campaign === 'asterfall-brass-quarter', 'This is not a supported Brass Quarter save.');
  const arrival = parseChapterSave(JSON.stringify(input.arrival));
  requireThat(replayOpening(arrival).complete, 'Finish the opening chapter before continuing this crossing.');
  requireThat(Array.isArray(input.actions) && input.actions.length <= MAX_COUNCIL_ACTIONS, 'This chapter contains too many actions.');
  requireThat(input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings), 'Reading settings are missing.');
  requireThat(Object.keys(input.settings).length === 2 && Object.keys(input.settings).every(k => ['lessMotion', 'largeText'].includes(k)) && typeof input.settings.lessMotion === 'boolean' && typeof input.settings.largeText === 'boolean', 'Reading settings are not supported.');
  const save = { ...structuredClone(input), arrival };
  replayCouncil(save);
  return save;
}

export const councilSaveKey = (path: string): string => `se_learning_quest_brass_quarter_v1:${path.replace(/index\.html$/, '').replace(/\/+$/, '') || '/'}`;

export function councilObjective(s: CouncilState): string {
  if (s.complete) return 'The missing address is back in the plan. Sera’s trail leads to the old dispatch archive.';
  if (s.scene === 'landing') return canEnterHearing(s) ? 'Take the disputed register to the council hearing.' : 'Inspect the register and ask Orren why Lower Quay is absent.';
  if (s.scene === 'hearing') {
    if (hearingReady(s)) return 'Carry the day and night needs to Tavi’s atelier.';
    if (s.hearing?.route === 'written' && s.hearing.gaps.length === 0) return 'Send the hearing’s night-watch sketch back to its keeper for confirmation.';
    return 'Ask the people waiting, then give their accounts a place at the table.';
  }
  if (!s.discoveries.includes('demo')) return 'Inspect Tavi’s demonstration. What did it actually exercise?';
  if (!promiseReady(s)) return 'Choose a tile for each part of the warning promise, then ask Tavi to review it.';
  return s.evidenceStatus ? 'Sign the target and carry its unanswered tests forward.' : 'Stamp the field evidence: has the promised field test happened yet?';
}
