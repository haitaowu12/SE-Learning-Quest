import type { Skill } from './types.ts';

export const skillNames: Record<Skill, string> = {
  empathy: 'Listening', analysis: 'Insight', craft: 'Making', assurance: 'Proof', stewardship: 'Stewardship',
};
export const origins: Record<Skill, { title: string; description: string }> = {
  empathy: { title: 'Quay Listener', description: 'You know whose stories are missing from the official maps.' },
  analysis: { title: 'Star Cartographer', description: 'You find patterns in the spaces between islands.' },
  craft: { title: 'Clockwork Tinker', description: 'Your pockets hold more spare parts than coins.' },
  assurance: { title: 'Lantern Inspector', description: 'You ask what would convince someone who was not there.' },
  stewardship: { title: 'Garden Keeper', description: 'You plan for the people who will inherit your work.' },
};
export const acts = [
  { id: 1, name: 'A signal in the silence', region: 'The Drifting Quays', glyph: '✧', subtitle: 'Find the people behind the missing lights.' },
  { id: 2, name: 'The shape of a promise', region: 'The Brass Quarter', glyph: '⬡', subtitle: 'Build a pact, then a system that can keep it.' },
  { id: 3, name: 'What the storm remembers', region: 'Stormglass Reach', glyph: 'ϟ', subtitle: 'Join the pieces. Discover what fell between them.' },
  { id: 4, name: 'A light for everyone', region: 'The Lantern Citadel', glyph: '◈', subtitle: 'Prove the relay works. Ask whether it helps.' },
  { id: 5, name: 'The living network', region: 'The Verdant Isles', glyph: '❧', subtitle: 'Keep the promise when the world changes.' },
  { id: 6, name: 'Beyond the last beacon', region: 'The Old Observatory', glyph: '☼', subtitle: 'Leave something worth inheriting.' },
];
export const cast: Record<string, { name: string; role: string; initial: string; color: string }> = {
  mara: { name: 'Mara', role: 'Ferry pilot · Lower Quay', initial: 'M', color: '#cb9a75' },
  pip: { name: 'Pip', role: 'Repair automaton · mostly working', initial: 'P', color: '#dbc17c' },
  tavi: { name: 'Tavi', role: 'Maker · Brass Quarter', initial: 'T', color: '#7abbaa' },
  neri: { name: 'Neri', role: 'Archivist · keeper of inconvenient facts', initial: 'N', color: '#aea5d2' },
  orren: { name: 'Orren', role: 'Regent · a city on his shoulders', initial: 'O', color: '#9baec8' },
  sera: { name: 'Sera', role: 'Relay keeper · your missing mentor', initial: 'S', color: '#dfabbd' },
};
export const badgeNames = ['First Light', 'Routefinder', 'Promise Maker', 'Stormglass Smith', 'Proofkeeper', 'Living Network', 'Keeper of Tomorrow', 'Learned Through Repair'];
