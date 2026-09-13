import { dispatch, freshSave } from '../src/adventure/model.ts';
import type { Action, Device } from '../src/adventure/model.ts';
import { dispatchCouncil, freshCouncilSave } from '../src/adventure/council/model.ts';
import type { CouncilAction, CouncilSave } from '../src/adventure/council/types.ts';

export function recordedOpening(device: Device = 'beacon') {
  const actions: Action[] = [
    { type: 'inspect', clue: 'lamp' }, { type: 'inspect', clue: 'crystal' }, { type: 'travel', place: 'quay' },
    { type: 'inspect', clue: 'mara' }, { type: 'inspect', clue: 'crew' }, { type: 'observe' }, { type: 'travel', place: 'bench' },
    { type: 'equip', device }, { type: 'brief', meaning: 'hold' }, { type: 'test' },
    { type: 'pin', claim: 'sent', clue: 'lamp' }, { type: 'pin', claim: 'acted', clue: 'trial' }, { type: 'finish' },
  ];
  return actions.reduce(dispatch, freshSave());
}
export const councilActions = (actions: CouncilAction[], save = freshCouncilSave(recordedOpening())) => actions.reduce(dispatchCouncil, save);
export const toHearing: CouncilAction[] = [{ type: 'inspect', discovery: 'roll' }, { type: 'inspect', discovery: 'orren' }, { type: 'travel', scene: 'hearing' }];
export const directHearing: CouncilAction[] = [
  ...toHearing,
  { type: 'inspect', discovery: 'mara' }, { type: 'inspect', discovery: 'tavi' }, { type: 'inspect', discovery: 'night' },
  { type: 'seat', guest: 'mara', seat: 'left' }, { type: 'seat', guest: 'tavi', seat: 'middle' }, { type: 'seat', guest: 'night', seat: 'right' },
  { type: 'relief' }, { type: 'hear' },
];
export const writtenHearing: CouncilAction[] = [
  ...toHearing,
  { type: 'inspect', discovery: 'mara' }, { type: 'inspect', discovery: 'tavi' }, { type: 'inspect', discovery: 'night' }, { type: 'inspect', discovery: 'neri' },
  { type: 'seat', guest: 'mara', seat: 'left' }, { type: 'seat', guest: 'tavi', seat: 'middle' }, { type: 'seat', guest: 'neri', seat: 'right' },
  { type: 'collect-note' }, { type: 'hear' }, { type: 'readback' },
];
export const targetActions: CouncilAction[] = [
  { type: 'travel', scene: 'atelier' }, { type: 'inspect', discovery: 'demo' },
  { type: 'place', slot: 'who', token: 'inhabited' }, { type: 'place', slot: 'what', token: 'perceivable' },
  { type: 'place', slot: 'when', token: 'ninety' }, { type: 'place', slot: 'conditions', token: 'west40-link-out' },
  { type: 'review' }, { type: 'label', status: 'planned' },
];
export function completedCouncil(route: 'direct' | 'written' = 'direct'): CouncilSave {
  return councilActions([...(route === 'direct' ? directHearing : writtenHearing), ...targetActions, { type: 'finish' }]);
}
