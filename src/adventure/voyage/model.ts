import { parseArchiveSave, replayArchive } from '../archive/model.ts';
import type { ArchiveSave } from '../archive/types.ts';
import { scenes } from './content.ts';
import { dutyRoles } from './content-helpers.ts';
import type { Observation, RecordState, Scene, TrialRun, VoyageAction, VoyageSave, VoyageState } from './types.ts';

export const MAX_VOYAGE_BYTES = 1_000_000;
export const MAX_VOYAGE_ACTIONS = 3000;
function requireThat(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
export const voyageSaveKey = (path: string): string => 'se_learning_quest_last_relay_v1:' + (path.replace(/index\.html$/, '').replace(/\/+$/, '') || '/');
export function newRecord(scene: Scene): RecordState {
  const order = scene.sequence?.map(item => item.id) ?? [];
  return { scene: scene.id, choices: {}, order: order.length === 4 ? [order[2], order[0], order[3], order[1]] : order, runs: [], allocations: {}, review: null, sealed: false };
}
export const freshVoyage = (): VoyageState => ({ index: 0, records: [newRecord(scenes[0])], complete: false });
export function freshVoyageSave(arrival: ArchiveSave): VoyageSave {
  const checked = parseArchiveSave(JSON.stringify(arrival));
  requireThat(replayArchive(checked).complete, 'Seal the archive packet before travelling to Stormglass.');
  return { version: 1, campaign: 'asterfall-last-relay', arrival: checked, actions: [], settings: { ...checked.settings } };
}
export const currentRecord = (state: VoyageState): RecordState => state.records[state.index];
export const priorChoice = (state: VoyageState, scene: string, socket: string): string | undefined => state.records.find(record => record.scene === scene)?.choices[socket];

// The traces are authored fictional exercises. No result is inferred from a real
// physical model or claimed as real-world reliability/learning evidence.
export function simulateTrial(state: VoyageState, caseId: string): TrialRun {
  const scene = scenes[state.index], record = currentRecord(state);
  requireThat(scene.kind === 'trial' && scene.cases?.some(item => item.id === caseId), 'Choose an exercise available at this station.');
  requireThat(scene.sockets.every(socket => !!record.choices[socket.id]), 'Fit a configuration before running the exercise.');
  const lookoutRoute = priorChoice(state, 'routes', 'route') === 'lookouts';
  const warning = scene.id === 'warning' ? record.choices.warning : priorChoice(state, 'warning', 'warning');
  const sites = ['Lower Quay', 'Crown Steps', 'East Landing', 'North Watch', 'Drift Quay'];
  let indices = scene.id === 'winter' ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  if (scene.id === 'winter' && caseId === 'shelter') indices = [4];
  if (scene.id === 'winter' && caseId === 'regression') indices = [0, 1, 2, 3];
  const receiver = scene.id === 'receiver';
  const replay = receiver && caseId === 'replay';
  const rejectsReplay = record.choices.controller === 'v2';
  const rough = ['squall', 'winter', 'outage'].includes(caseId);
  const night = caseId === 'night' || caseId === 'squall' || caseId === 'winter';
  const observations: Observation[] = indices.map(index => {
    const missing = scene.id === 'winter' && record.choices.scope !== 'five' && index === 4;
    const received = !missing && !(replay && rejectsReplay);
    const obscured = scene.id === 'warning' && warning === 'exposed' && night && index === 0;
    const seconds = received ? [44, 32, 40, 48, 58][index] + (lookoutRoute ? 8 : 0) + (rough ? 18 : night ? 12 : 0) + (!receiver && warning === 'lookout' ? 2 : 0) + (scene.id === 'winter' && priorChoice(state, 'shelter', 'approach') === 'parallel' ? 2 : 0) : null;
    return {
      site: sites[index], received, seconds,
      perceived: receiver ? null : received && !obscured,
      action: receiver ? replay ? rejectsReplay ? 'Expired order rejected' : 'Expired order accepted again' : 'Packet accepted; people not observed' : missing ? 'No addressed warning' : obscured ? 'Crew did not see the warning' : 'Crew holds for keeper instruction',
    };
  });
  const passed = replay ? rejectsReplay : observations.every(item => item.received && item.seconds !== null && item.seconds <= 90 && (receiver || item.perceived));
  return { caseId, observations, passed, note: receiver
    ? replay ? 'Expected result: reject the expired replay. No local warning should be issued.' : 'Receiver observations only. Perception and action have not been exercised here.'
    : 'Local warning and crew action observed at the listed positions in this authored exercise.' };
}

export function assessRecord(state: VoyageState): string[] {
  const scene = scenes[state.index], record = currentRecord(state), gaps: string[] = [];
  for (const socket of scene.sockets) if (!socket.accepts.includes(record.choices[socket.id])) gaps.push(socket.gap);
  if (scene.id === 'routes') {
    const expected = record.choices.route === 'diverse' ? 'joint' : record.choices.route === 'lookouts' ? 'crews' : null;
    if (expected && record.choices.support !== expected) gaps.push(expected === 'joint' ? 'The diverse relays need the spare joint specified in the design study.' : 'The lookout route needs two rotating crews; a spare relay joint does not provide duty cover.');
  }
  if (scene.sequence && scene.sequence.some((item, index) => record.order[index] !== item.id)) gaps.push('Follow the dependencies on the source card. ' + scene.sequence.map(item => item.label).join(' → ') + '.');
  for (const exercise of scene.cases ?? []) {
    const run = record.runs.find(item => item.caseId === exercise.id);
    if (!run) gaps.push('Run the ' + exercise.label.toLowerCase() + ' exercise with this configuration.');
    else if (!run.passed) gaps.push(exercise.label + ' has an unmet condition. Read the observation rows, change the configuration if needed, and repeat the exercises.');
  }
  if (scene.kind === 'allocation') {
    for (const role of dutyRoles) if ((record.allocations[role.id] ?? 0) < role.minimum) gaps.push(role.label + ' needs at least ' + role.minimum + ' duty token' + (role.minimum === 1 ? '.' : 's.'));
    if (Object.values(record.allocations).reduce((sum, amount) => sum + amount, 0) > 6) gaps.push('The recurring budget has six tokens. Rebalance the plan within that budget.');
  }
  return gaps;
}
export const canSeal = (state: VoyageState): boolean => !state.complete && currentRecord(state).review?.gaps.length === 0 && assessRecord(state).length === 0;
const actionFields: Record<string, string[]> = {
  choose: ['type', 'socket', 'tile'], move: ['type', 'tile', 'direction'], allocate: ['type', 'role', 'amount'], run: ['type', 'caseId'], review: ['type'], seal: ['type'],
};
function invalidate(record: RecordState, trials = false): void { record.review = null; if (trials) record.runs = []; }
export function voyageStep(state: VoyageState, action: VoyageAction): VoyageState {
  requireThat(action && typeof action === 'object' && !Array.isArray(action) && Object.hasOwn(actionFields, action.type), 'That action is not part of this journey.');
  const fields = actionFields[action.type];
  requireThat(Object.keys(action).length === fields.length && Object.keys(action).every(key => fields.includes(key)), 'The journey action has missing or unsupported fields.');
  requireThat(!state.complete, 'This journey is recorded. Start a new continuation to explore another future.');
  const next = structuredClone(state), record = currentRecord(next), scene = scenes[next.index];
  switch (action.type) {
    case 'choose': {
      const socket = scene.sockets.find(item => item.id === action.socket);
      requireThat(socket, 'Choose a socket on the current board.');
      const options = scene.kind === 'connect' ? scene.sockets.flatMap(item => item.options) : socket.options;
      requireThat(options.some(item => item.id === action.tile), 'Choose a tile available at this station.');
      if (record.choices[action.socket] !== action.tile) { record.choices[action.socket] = action.tile; invalidate(record, true); }
      break;
    }
    case 'move': {
      requireThat(scene.kind === 'sequence' && (action.direction === 'up' || action.direction === 'down'), 'Choose a sequence card and a move direction.');
      const index = record.order.indexOf(action.tile), target = index + (action.direction === 'up' ? -1 : 1);
      requireThat(index >= 0 && target >= 0 && target < record.order.length, 'That card cannot move beyond the end of the sequence.');
      [record.order[index], record.order[target]] = [record.order[target], record.order[index]];
      invalidate(record); break;
    }
    case 'allocate':
      requireThat(scene.kind === 'allocation' && dutyRoles.some(role => role.id === action.role) && Number.isInteger(action.amount) && action.amount >= 0 && action.amount <= 6, 'Assign between zero and six tokens to a role on this board.');
      if ((record.allocations[action.role] ?? 0) !== action.amount) { record.allocations[action.role] = action.amount; invalidate(record); }
      break;
    case 'run': {
      const result = simulateTrial(next, action.caseId);
      const old = record.runs.findIndex(item => item.caseId === action.caseId);
      if (old < 0) record.runs.push(result); else record.runs[old] = result;
      // A repeat of an identical exercise does not erase a valid review.
      if (JSON.stringify(currentRecord(state).runs) !== JSON.stringify(record.runs)) invalidate(record);
      break;
    }
    case 'review': record.review = { gaps: assessRecord(next) }; break;
    case 'seal':
      requireThat(canSeal(state), 'Review the current board and resolve its open conditions before recording the next step.');
      record.sealed = true;
      if (next.index === scenes.length - 1) next.complete = true;
      else { next.index++; next.records.push(newRecord(scenes[next.index])); }
      break;
  }
  return next;
}
export function replayVoyage(save: VoyageSave): VoyageState {
  requireThat(replayArchive(save.arrival).complete, 'The continuation requires a completed archive packet.');
  return save.actions.reduce(voyageStep, freshVoyage());
}
export function dispatchVoyage(save: VoyageSave, action: VoyageAction): VoyageSave {
  const before = replayVoyage(save), after = voyageStep(before, action);
  if (JSON.stringify(before) === JSON.stringify(after)) return save;
  requireThat(save.actions.length < MAX_VOYAGE_ACTIONS, 'This journey has reached its action limit. Export it before starting another continuation.');
  return { ...save, actions: [...save.actions, structuredClone(action)] };
}
export function parseVoyageSave(raw: string): VoyageSave {
  requireThat(new TextEncoder().encode(raw).length <= MAX_VOYAGE_BYTES, 'This journey exceeds the 1 MB limit.');
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Your journey has not changed.'); }
  requireThat(data && typeof data === 'object' && !Array.isArray(data), 'A journey save must be an object.');
  const input = data as VoyageSave;
  const fields = ['version', 'campaign', 'arrival', 'actions', 'settings'];
  requireThat(Object.keys(input).length === fields.length && Object.keys(input).every(key => fields.includes(key)), 'The journey has missing or unsupported fields.');
  requireThat(input.version === 1 && input.campaign === 'asterfall-last-relay', 'This is not a supported Last Relay continuation save.');
  const arrival = parseArchiveSave(JSON.stringify(input.arrival));
  requireThat(replayArchive(arrival).complete, 'Seal the archive packet before continuing to Stormglass.');
  requireThat(Array.isArray(input.actions) && input.actions.length <= MAX_VOYAGE_ACTIONS, 'The journey contains too many actions.');
  requireThat(input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings), 'Journey reading settings are missing.');
  requireThat(Object.keys(input.settings).length === 2 && Object.keys(input.settings).every(key => ['largeText', 'lessMotion'].includes(key)) && typeof input.settings.largeText === 'boolean' && typeof input.settings.lessMotion === 'boolean', 'Journey reading settings are not supported.');
  const save = { ...structuredClone(input), arrival };
  replayVoyage(save);
  return save;
}
export function voyageObjective(state: VoyageState): string {
  if (state.complete) return 'Your seven-chapter journey is recorded. Read the charter or export the complete history.';
  return canSeal(state) ? 'Record this step and carry its evidence to the next watch.' : scenes[state.index].objective;
}
export function endingLines(state: VoyageState): string[] {
  requireThat(state.complete, 'Finish the handover before reading the completed charter.');
  const budget = state.records.find(record => record.scene === 'stewardship')!.allocations;
  const reserve = 6 - Object.values(budget).reduce((sum, amount) => sum + amount, 0);
  return [
    priorChoice(state, 'routes', 'route') === 'diverse' ? 'You built east/west relays: six material crates and a spare joint supported the alternate path.' : 'You built a local lookout chain: four material crates and two rotating crews supported its duty cover.',
    priorChoice(state, 'warning', 'warning') === 'beacon' ? 'A shielded beacon and local repeater made the HOLD warning visible at the tested working positions.' : 'Staffed voice-and-flag posts carried the HOLD warning, with relief as part of the arrangement.',
    priorChoice(state, 'outage', 'route') === 'east' ? 'During the west-joint incident, the exercised east detour kept the watch covered.' : 'During the west-joint incident, staffed local posts kept coverage with additional handovers.',
    priorChoice(state, 'shelter', 'approach') === 'extend' ? 'The winter shelter joined through an extension and planned cutover of the existing installation.' : 'The winter shelter joined through a parallel module, with additional hardware and support.',
    'The current service covers five inhabited quays. Its recorded exercises support the 90-second target under the exercised conditions; future changes still require review.',
    priorChoice(state, 'stewardship', 'governance') === 'council' ? 'A quay council owns decisions through a rotating chair, public records and its tie-break procedure.' : 'A harbour service lead owns decisions, with scheduled quay representation.',
    'Each cycle funds watch ' + (budget.watch ?? 0) + ', training ' + (budget.training ?? 0) + ', spares ' + (budget.spares ?? 0) + ' and community review ' + (budget.review ?? 0) + '. ' + reserve + ' token' + (reserve === 1 ? ' remains' : 's remain') + ' in reserve.',
    priorChoice(state, 'support', 'support') === 'maker' ? 'A recurring maker retainer funds the two-watch repair response; local fallback covers the interval.' : 'Training and tooling equip named local maintainers for the two-watch response, with periodic practice.',
    priorChoice(state, 'inheritance', 'legacy') === 'exhibit' ? 'The isolated old core becomes a disconnected teaching exhibit under a named custodian.' : 'Suitable parts from the isolated old core are recovered through the recorded handling process.',
    'Sera’s relief accepted the upper post before she joined the ferry. The next keeper inherits the history, the known limits and a review each service cycle.',
  ];
}