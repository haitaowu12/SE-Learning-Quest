import type { ArchiveSave } from '../archive/types.ts';
export type BoardKind = 'choice' | 'network' | 'connect' | 'sequence' | 'trial' | 'allocation';
export type Region = 'stormglass' | 'field' | 'service' | 'inheritance';
export interface Tile { id: string; label: string; detail: string; symbol: string }
export interface Socket { id: string; label: string; detail: string; accepts: string[]; gap: string; options: Tile[] }
export interface Source { title: string; text: string }
export interface TrialCase { id: string; label: string; condition: string }
export interface Scene {
  id: string; chapter: number; region: Region; title: string; subtitle: string;
  speaker: 'tavi' | 'mara' | 'neri' | 'sera'; brief: string; objective: string;
  kind: BoardKind; sources: Source[]; sockets: Socket[]; sequence?: Tile[]; cases?: TrialCase[];
  artifact: string; result: string; lesson: string; topics: string[];
}
export interface Observation { site: string; seconds: number | null; received: boolean; perceived: boolean | null; action: string }
export interface TrialRun { caseId: string; observations: Observation[]; passed: boolean; note: string }
export interface RecordState {
  scene: string; choices: Record<string, string>; order: string[]; runs: TrialRun[];
  allocations: Record<string, number>; review: { gaps: string[] } | null; sealed: boolean;
}
export interface VoyageState { index: number; records: RecordState[]; complete: boolean }
export type VoyageAction =
  | { type: 'choose'; socket: string; tile: string }
  | { type: 'move'; tile: string; direction: 'up' | 'down' }
  | { type: 'allocate'; role: string; amount: number }
  | { type: 'run'; caseId: string }
  | { type: 'review' }
  | { type: 'seal' };
export interface VoyageSave {
  version: 1; campaign: 'asterfall-last-relay'; arrival: ArchiveSave;
  actions: VoyageAction[]; settings: ArchiveSave['settings'];
}