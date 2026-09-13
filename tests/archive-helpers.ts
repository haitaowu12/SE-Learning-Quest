import { dispatchArchive, freshArchiveSave } from '../src/adventure/archive/model.ts';
import type { ArchiveAction, ArchiveSave, ProposalRoute } from '../src/adventure/archive/types.ts';
import { completedCouncil } from './council-helpers.ts';

export const archiveActions = (actions: ArchiveAction[], save = freshArchiveSave(completedCouncil())) => actions.reduce(dispatchArchive, save);
export const toTable: ArchiveAction[] = [
  { type: 'inspect', record: 'request' }, { type: 'inspect', record: 'roll' }, { type: 'inspect', record: 'survey' },
  { type: 'inspect', record: 'change' }, { type: 'travel', scene: 'table' }, { type: 'inspect', record: 'tally' },
];
export const evidence: ArchiveAction[] = [
  { type: 'focus', quay: 'lower' }, { type: 'pin', slot: 'population', record: 'survey' },
  { type: 'pin', slot: 'recipients', record: 'roll' }, { type: 'pin', slot: 'receipts', record: 'tally' },
  { type: 'review-evidence' }, { type: 'travel', scene: 'dispatch' },
];
export const addresses: ArchiveAction[] = [
  { type: 'address', quay: 'lower', address: 'LQ07' }, { type: 'address', quay: 'crown', address: 'CS02' },
  { type: 'address', quay: 'east', address: 'EL03' }, { type: 'address', quay: 'north', address: 'NW09' },
];
export function proposedArchive(route: ProposalRoute = 'amend', save?: ArchiveSave): ArchiveSave {
  return archiveActions([...toTable, ...evidence, { type: 'choose-route', route }, ...addresses,
    { type: 'finding', finding: 'listed-only' }, { type: 'review-proposal' }, { type: 'label', status: 'proposed' }], save);
}
export const completedArchive = (route: ProposalRoute = 'amend') => dispatchArchive(proposedArchive(route), { type: 'finish' });