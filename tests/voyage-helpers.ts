import { completedArchive } from './archive-helpers.ts';
import { scenes } from '../src/adventure/voyage/content.ts';
import { currentRecord, dispatchVoyage, freshVoyageSave, replayVoyage } from '../src/adventure/voyage/model.ts';
import type { VoyageAction, VoyageSave } from '../src/adventure/voyage/types.ts';
export interface RouteOptions { route?: 'diverse' | 'lookouts'; warning?: 'beacon' | 'lookout'; fallback?: 'east' | 'posts'; change?: 'extend' | 'parallel'; governance?: 'council' | 'office'; support?: 'maker' | 'local'; legacy?: 'exhibit' | 'recover' }
export const freshTestVoyage = () => freshVoyageSave(completedArchive());
export function solutionActions(save: VoyageSave, options: RouteOptions = {}): VoyageAction[] {
  const state = replayVoyage(save), scene = scenes[state.index], actions: VoyageAction[] = [];
  for (const socket of scene.sockets) {
    let id = socket.accepts[0];
    if (scene.id === 'routes' && socket.id === 'route') id = options.route ?? 'diverse';
    if (scene.id === 'routes' && socket.id === 'support') id = options.route === 'lookouts' ? 'crews' : 'joint';
    if (scene.id === 'warning') id = options.warning ?? 'beacon';
    if (scene.id === 'outage' && socket.id === 'route') id = options.fallback ?? 'east';
    if (scene.id === 'shelter' && socket.id === 'approach') id = options.change ?? 'extend';
    if (scene.id === 'stewardship') id = options.governance ?? 'council';
    if (scene.id === 'support' && socket.id === 'support') id = options.support ?? 'maker';
    if (scene.id === 'inheritance' && socket.id === 'legacy') id = options.legacy ?? 'exhibit';
    actions.push({ type: 'choose', socket: socket.id, tile: id });
  }
  const order = [...currentRecord(state).order];
  for (const [position, item] of (scene.sequence ?? []).entries()) {
    let index = order.indexOf(item.id);
    while (index > position) { actions.push({ type: 'move', tile: item.id, direction: 'up' }); [order[index], order[index - 1]] = [order[index - 1], order[index]]; index--; }
  }
  if (scene.kind === 'allocation') for (const [role, amount] of Object.entries({ watch: 2, training: 1, spares: 1, review: 1 })) actions.push({ type: 'allocate', role, amount });
  for (const exercise of scene.cases ?? []) actions.push({ type: 'run', caseId: exercise.id });
  return [...actions, { type: 'review' }];
}
export function readyScene(save: VoyageSave, options: RouteOptions = {}): VoyageSave { return solutionActions(save, options).reduce(dispatchVoyage, save); }
export function atScene(id: string, options: RouteOptions = {}): VoyageSave {
  let save = freshTestVoyage();
  while (scenes[replayVoyage(save).index].id !== id) save = dispatchVoyage(readyScene(save, options), { type: 'seal' });
  return save;
}
export function completedVoyage(options: RouteOptions = {}): VoyageSave {
  let save = freshTestVoyage();
  while (!replayVoyage(save).complete) save = dispatchVoyage(readyScene(save, options), { type: 'seal' });
  return save;
}