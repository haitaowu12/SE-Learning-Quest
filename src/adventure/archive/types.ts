import type { CouncilSave } from '../council/types.ts';

export type ArchiveScene = 'stacks' | 'table' | 'dispatch';
export type RecordId = 'request' | 'roll' | 'survey' | 'change' | 'tally';
export type Quay = 'lower' | 'crown' | 'east' | 'north';
export type ClaimSlot = 'population' | 'recipients' | 'receipts';
export type Address = 'omitted' | 'LQ07' | 'CS02' | 'EL03' | 'NW09' | 'NW04';
export type ProposalRoute = 'amend' | 'rebuild';
export type Finding = 'listed-only' | 'all-warned' | 'none-received';
export type ArchiveAction =
  | { type: 'inspect'; record: RecordId }
  | { type: 'travel'; scene: ArchiveScene }
  | { type: 'focus'; quay: Quay }
  | { type: 'pin'; slot: ClaimSlot; record: RecordId }
  | { type: 'review-evidence' }
  | { type: 'choose-route'; route: ProposalRoute }
  | { type: 'address'; quay: Quay; address: Address }
  | { type: 'finding'; finding: Finding }
  | { type: 'review-proposal' }
  | { type: 'label'; status: 'proposed' | 'approved' }
  | { type: 'finish' };

export interface ArchiveState {
  scene: ArchiveScene;
  discoveries: RecordId[];
  focus: Quay | null;
  pins: Partial<Record<ClaimSlot, RecordId>>;
  evidence: { gaps: string[] } | null;
  route: ProposalRoute | null;
  proposal: Partial<Record<Quay, Address>>;
  finding: Finding | null;
  review: { gaps: string[] } | null;
  status: 'proposed' | null;
  complete: boolean;
}

export interface ArchiveSave {
  version: 1;
  campaign: 'asterfall-dispatch-archive';
  arrival: CouncilSave;
  actions: ArchiveAction[];
  settings: CouncilSave['settings'];
}