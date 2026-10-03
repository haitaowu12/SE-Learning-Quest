import type { Socket, Tile } from './types.ts';
export const tile = (id: string, label: string, detail: string, symbol: string): Tile => ({ id, label, detail, symbol });
export const socket = (id: string, label: string, detail: string, options: Tile[], accepts: string[], gap: string): Socket => ({ id, label, detail, options, accepts, gap });
export const dutyRoles = [
  { id: 'watch', label: 'Watch coverage', minimum: 2, detail: 'Two rotating crews keep every watch covered.' },
  { id: 'training', label: 'Training', minimum: 1, detail: 'One practice session keeps relief keepers ready.' },
  { id: 'spares', label: 'Spares', minimum: 1, detail: 'One sealed replacement joint supports the repair plan.' },
  { id: 'review', label: 'Community review', minimum: 1, detail: 'One survey review keeps new homes in the warning boundary.' },
] as const;