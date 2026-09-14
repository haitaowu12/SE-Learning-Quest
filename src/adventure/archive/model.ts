import { parseCouncilSave, replayCouncil } from '../council/model.ts';
import type { CouncilSave } from '../council/types.ts';
import { claims, claimSlots, quays, quayIds, records } from './story.ts';
import type { ArchiveAction, ArchiveSave, ArchiveState, RecordId } from './types.ts';

export const MAX_ARCHIVE_BYTES = 600_000;
export const MAX_ARCHIVE_ACTIONS = 1000;

function requireThat(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export const freshArchive = (): ArchiveState => ({
  scene: 'stacks', discoveries: [], focus: null, pins: {}, evidence: null,
  route: null, proposal: {}, finding: null, review: null, status: null, complete: false,
});

export function freshArchiveSave(arrival: CouncilSave): ArchiveSave {
  const checked = parseCouncilSave(JSON.stringify(arrival));
  requireThat(replayCouncil(checked).complete, 'Finish the Brass Quarter target and collect Sera’s request before entering the archive.');
  return { version: 1, campaign: 'asterfall-dispatch-archive', arrival: checked, actions: [], settings: { ...checked.settings } };
}

export const canEnterTable = (state: ArchiveState): boolean => ['roll', 'survey', 'change'].every(id => state.discoveries.includes(id as RecordId));
export const evidenceReady = (state: ArchiveState): boolean => !!state.evidence && state.evidence.gaps.length === 0;
export const proposalReady = (state: ArchiveState): boolean => evidenceReady(state) && !!state.review && state.review.gaps.length === 0;
export const canFinishArchive = (state: ArchiveState): boolean => !state.complete && proposalReady(state) && state.status === 'proposed';

export function assessEvidence(state: ArchiveState): string[] {
  const gaps: string[] = [];
  if (state.focus !== 'lower') gaps.push(state.focus ? `${quays[state.focus].name} appears on issued list B. Lower Quay is inhabited in the survey and absent from that list.` : 'Choose the inhabited quay omitted from list B.');
  for (const slot of claimSlots) if (state.pins[slot] !== claims[slot].record) gaps.push(claims[slot].gap);
  return gaps;
}

export function assessProposal(state: ArchiveState): string[] {
  const gaps: string[] = [];
  if (!state.route) gaps.push('Choose whether to amend issued list B or rebuild a proposed list from the current survey.');
  for (const quay of quayIds) {
    if (state.proposal[quay] !== quays[quay].current) gaps.push(quay === 'north' && state.proposal[quay] === 'NW04'
      ? 'NW04 was superseded. Keep North Watch at the current surveyed address NW09; reinstating all of old list A would undo that change.'
      : `${quays[quay].name} is inhabited at ${quays[quay].current} in the current survey. Include that address in this proposed district list.`);
  }
  if (state.finding !== 'listed-only') gaps.push(state.finding === 'none-received'
    ? 'R-17 has three receiver acknowledgements. Lower Quay’s omission does not erase those observations.'
    : 'The tally covers three listed receivers, while the survey identifies four inhabited quays. It records neither a perceived local warning nor crew action.');
  return gaps;
}

function invalidateProposal(state: ArchiveState): void { state.review = null; state.status = null; }
function invalidateEvidence(state: ArchiveState): void { state.evidence = null; invalidateProposal(state); }

export function archiveStep(state: ArchiveState, action: ArchiveAction): ArchiveState {
  requireThat(action && typeof action === 'object' && !Array.isArray(action), 'Choose an action in the archive.');
  const fields: Record<string, string[]> = {
    inspect: ['type', 'record'], travel: ['type', 'scene'], focus: ['type', 'quay'], pin: ['type', 'slot', 'record'],
    'review-evidence': ['type'], 'choose-route': ['type', 'route'], address: ['type', 'quay', 'address'],
    finding: ['type', 'finding'], 'review-proposal': ['type'], label: ['type', 'status'], finish: ['type'],
  };
  requireThat(Object.hasOwn(fields, action.type), 'That action is not part of the archive investigation.');
  requireThat(Object.keys(action).length === fields[action.type].length && Object.keys(action).every(key => fields[action.type].includes(key)), 'The archive action has missing or unsupported fields.');
  requireThat(!state.complete, 'This packet is recorded. Start the archive chapter again to explore another proposal.');
  const next = structuredClone(state);
  if (action.type === 'travel') {
    requireThat(['stacks', 'table', 'dispatch'].includes(action.scene), 'That place is not in this archive.');
    requireThat(action.scene === 'stacks' || canEnterTable(state), 'Read list B, the current survey and the revision record in the stacks first.');
    requireThat(action.scene !== 'dispatch' || evidenceReady(state), 'Compare the quay and its source records with Neri before preparing a packet.');
    next.scene = action.scene;
    return next;
  }
  if (action.type === 'inspect') {
    const allowed: RecordId[] = state.scene === 'stacks' ? ['request', 'roll', 'survey', 'change'] : state.scene === 'table' ? ['tally'] : [];
    requireThat(allowed.includes(action.record), 'That record is in another scene. Read collected records in the journal.');
    if (!next.discoveries.includes(action.record)) next.discoveries.push(action.record);
    return next;
  }
  if (['focus', 'pin', 'review-evidence'].includes(action.type)) {
    requireThat(state.scene === 'table' && canEnterTable(state), 'Take the records to the comparison table first.');
    if (action.type === 'focus') {
      requireThat(quayIds.includes(action.quay), 'Choose a quay shown in this dispatch district.');
      if (next.focus !== action.quay) { next.focus = action.quay; invalidateEvidence(next); }
    } else if (action.type === 'pin') {
      requireThat(claimSlots.includes(action.slot) && Object.hasOwn(records, action.record), 'Choose a source record and an evidence pocket.');
      requireThat(state.discoveries.includes(action.record), 'Read the source record before attaching it to a claim.');
      if (next.pins[action.slot] !== action.record) { next.pins[action.slot] = action.record; invalidateEvidence(next); }
    } else {
      const gaps = assessEvidence(state);
      if (JSON.stringify(next.evidence?.gaps) !== JSON.stringify(gaps)) { next.evidence = { gaps }; invalidateProposal(next); }
    }
    return next;
  }
  requireThat(state.scene === 'dispatch' && evidenceReady(state), 'Review the evidence at the table before proposing a change.');
  switch (action.type) {
    case 'choose-route':
      requireThat(action.route === 'amend' || action.route === 'rebuild', 'Choose an amendment or a rebuild from the current survey.');
      if (next.route !== action.route) {
        next.route = action.route;
        next.proposal = action.route === 'amend' ? Object.fromEntries(quayIds.map(quay => [quay, quays[quay].issued])) : {};
        invalidateProposal(next);
      }
      break;
    case 'address':
      requireThat(state.route, 'Choose a starting list for the proposal first.');
      requireThat(quayIds.includes(action.quay) && quays[action.quay].options.includes(action.address), 'Choose one of the addresses shown for this quay.');
      if (next.proposal[action.quay] !== action.address) { next.proposal[action.quay] = action.address; invalidateProposal(next); }
      break;
    case 'finding':
      requireThat(['listed-only', 'all-warned', 'none-received'].includes(action.finding), 'Choose a finding supported by the source records.');
      if (next.finding !== action.finding) { next.finding = action.finding; invalidateProposal(next); }
      break;
    case 'review-proposal': {
      const gaps = assessProposal(state);
      if (JSON.stringify(next.review?.gaps) !== JSON.stringify(gaps)) { next.review = { gaps }; next.status = null; }
      break;
    }
    case 'label':
      requireThat(action.status === 'proposed' || action.status === 'approved', 'Choose a stamp on the dispatch desk.');
      requireThat(proposalReady(state), 'Ask Neri to review the proposed list and its finding first.');
      requireThat(action.status === 'proposed', 'Orren’s seal authorizes reading the archive. The proposed list still needs an authorized change decision and service checks; the all-quay field trials remain unperformed.');
      next.status = 'proposed';
      break;
    case 'finish':
      requireThat(canFinishArchive(state), 'Review the source-backed proposal and mark its authorization as still pending before sealing the packet.');
      next.complete = true;
      break;
  }
  return next;
}

export function replayArchive(save: ArchiveSave): ArchiveState {
  requireThat(replayCouncil(save.arrival).complete, 'The archive requires a completed Brass Quarter history.');
  return save.actions.reduce(archiveStep, freshArchive());
}
export function dispatchArchive(save: ArchiveSave, action: ArchiveAction): ArchiveSave {
  const before = replayArchive(save);
  const after = archiveStep(before, action);
  if (JSON.stringify(before) === JSON.stringify(after)) return save;
  requireThat(save.actions.length < MAX_ARCHIVE_ACTIONS, 'This archive chapter has reached its action limit. Export it before starting again.');
  return { ...save, actions: [...save.actions, structuredClone(action)] };
}
export function parseArchiveSave(raw: string): ArchiveSave {
  requireThat(new TextEncoder().encode(raw).length <= MAX_ARCHIVE_BYTES, 'This save exceeds the 600 KB limit.');
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your archive history has not changed.'); }
  requireThat(data && typeof data === 'object' && !Array.isArray(data), 'An archive save must be an object.');
  const input = data as ArchiveSave;
  requireThat(Object.keys(input).length === 5 && Object.keys(input).every(key => ['version', 'campaign', 'arrival', 'actions', 'settings'].includes(key)), 'The archive save has missing or unsupported fields.');
  requireThat(input.version === 1 && input.campaign === 'asterfall-dispatch-archive', 'This is not a supported dispatch-archive save.');
  const arrival = parseCouncilSave(JSON.stringify(input.arrival));
  requireThat(replayCouncil(arrival).complete, 'Finish the Brass Quarter before entering the archive.');
  requireThat(Array.isArray(input.actions) && input.actions.length <= MAX_ARCHIVE_ACTIONS, 'This archive save contains too many actions.');
  requireThat(input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings), 'Archive reading settings are missing.');
  requireThat(Object.keys(input.settings).length === 2 && Object.keys(input.settings).every(key => ['largeText', 'lessMotion'].includes(key)) && typeof input.settings.largeText === 'boolean' && typeof input.settings.lessMotion === 'boolean', 'Archive reading settings are not supported.');
  const save = { ...structuredClone(input), arrival };
  replayArchive(save);
  return save;
}
export const archiveSaveKey = (path: string): string => `se_learning_quest_dispatch_archive_v1:${path.replace(/index\.html$/, '').replace(/\/+$/, '') || '/'}`;
export function archiveObjective(state: ArchiveState): string {
  if (state.complete) return 'The packet separates the old list, observed receipts and proposed correction. Carry it toward Stormglass.';
  if (state.scene === 'stacks') return canEnterTable(state) ? 'Take the three source records to Neri’s comparison table.' : 'Open list B, the occupied-sites survey and the revision record.';
  if (state.scene === 'table') return evidenceReady(state) ? 'Prepare a proposed correction at the dispatch desk.' : 'Read the green tally, choose the omitted quay and attach each source to the question it answers.';
  if (!proposalReady(state)) return 'Build a proposed list with current addresses and a finding supported by R-17’s receipts.';
  return state.status ? 'Seal the proposal with its source records and unresolved service checks.' : 'Stamp the packet according to the authority you actually have.';
}