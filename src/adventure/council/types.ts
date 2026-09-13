import type { ChapterSave } from '../model.ts';

export type CouncilScene = 'landing' | 'hearing' | 'atelier';
export type Guest = 'mara' | 'tavi' | 'night' | 'neri';
export type Discovery = 'roll' | 'orren' | Guest | 'demo';
export type Seat = 'left' | 'middle' | 'right';
export type PromiseSlot = 'who' | 'what' | 'when' | 'conditions';
export type PromiseToken = 'inhabited' | 'registered' | 'perceivable' | 'lamp' | 'ninety' | 'twentyTwo' | 'west40-link-out' | 'calm';
export type HearingRoute = 'in-person' | 'written';
export type CouncilAction =
  | { type: 'inspect'; discovery: Discovery }
  | { type: 'travel'; scene: CouncilScene }
  | { type: 'seat'; guest: Guest; seat: Seat }
  | { type: 'unseat'; seat: Seat }
  | { type: 'relief' }
  | { type: 'collect-note' }
  | { type: 'hear' }
  | { type: 'readback' }
  | { type: 'place'; slot: PromiseSlot; token: PromiseToken }
  | { type: 'review' }
  | { type: 'label'; status: 'planned' | 'proven' }
  | { type: 'finish' };

export interface HearingResult {
  route: HearingRoute | null;
  gaps: string[];
}

export interface CouncilState {
  scene: CouncilScene;
  discoveries: Discovery[];
  seats: Partial<Record<Seat, Guest>>;
  relief: boolean;
  note: boolean;
  hearing: HearingResult | null;
  readback: boolean;
  promise: Partial<Record<PromiseSlot, PromiseToken>>;
  review: { gaps: string[] } | null;
  evidenceStatus: 'planned' | null;
  complete: boolean;
}

/** Chapter one is retained as verified history, never inferred from a completion flag. */
export interface CouncilSave {
  version: 1;
  campaign: 'asterfall-brass-quarter';
  arrival: ChapterSave;
  actions: CouncilAction[];
  settings: ChapterSave['settings'];
}
