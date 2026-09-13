import type { CouncilScene, Discovery, Guest, PromiseSlot, PromiseToken } from './types.ts';

export const scenes: Record<CouncilScene, { title: string; subtitle: string }> = {
  landing: { title: 'The Brass Quarter', subtitle: 'Mara brings you to the council landing. Lower Quay is missing from the hearing list.' },
  hearing: { title: 'A chair for the night watch', subtitle: 'Orren has the authority to act. Whose experience will shape the repair?' },
  atelier: { title: 'A promise beyond the window', subtitle: 'Tavi’s lantern is quick. The people beyond this workshop need a promise of their own.' },
};

export const guests: Record<Guest, { name: string; role: string; short: string }> = {
  mara: { name: 'Mara', role: 'Ferry pilot · Lower Quay resident', short: 'Day work & homes' },
  tavi: { name: 'Tavi', role: 'Lantern maker', short: 'Build & test' },
  night: { name: 'Night keeper', role: 'Sheltered night-watch post', short: 'Night conditions' },
  neri: { name: 'Neri', role: 'Council archivist', short: 'Records & messages' },
};

export const discoveries: Record<Discovery, { title: string; speaker: Guest | 'orren'; text: string; source: string }> = {
  roll: { title: 'An address that disappeared', speaker: 'neri', source: 'Council register · marked by Sera', text: 'Lower Quay is filed as “seasonal berth.” Beside it, Sera wrote: “Families sleep over these workshops. Ask who the count leaves out.”' },
  orren: { title: 'Bring the missing account', speaker: 'orren', source: 'Orren · at the landing', text: '“The register gave Lower Quay no seat. I can change the repair brief. Bring me the day work, the night watch, and the maker who will use those accounts.”' },
  mara: { title: 'We need to hold departures', speaker: 'mara', source: 'Mara · day work and Lower Quay home', text: '“We rehearsed my crew’s signal. Families also live above these sheds. My account covers this quay by day; it cannot speak for every night watch.”' },
  tavi: { title: 'Show me where it must work', speaker: 'tavi', source: 'Tavi · lantern maker', text: '“I can make a lantern. I need to know where people will use it and what counts as a warning there. A workshop demonstration leaves those questions open.”' },
  night: { title: 'My post has storm shutters', speaker: 'night', source: 'Night keeper · current watch', text: '“The shutters hide the quay lantern. I can attend after the available relief takes over. Or Neri can carry my signed account and bring your sketch back for confirmation.”' },
  neri: { title: 'A record is someone’s account', speaker: 'neri', source: 'Neri · council archivist', text: '“I can carry the night keeper’s note and return your sketch. I keep records; I do not work that watch. A guess from me would not replace the keeper’s account.”' },
  demo: { title: '22 seconds, here in the workshop', speaker: 'tavi', source: 'Central-lantern demonstration · calm workshop', text: '“This central lantern lit 22 seconds after the order. No distant quay, closed shutter, squall or lost link was tested. It is a demonstration, not the field result.”' },
};

export const slotLabels: Record<PromiseSlot, { label: string; question: string }> = {
  who: { label: 'Who is covered?', question: 'Whose address belongs in the promise?' },
  what: { label: 'What is observed?', question: 'Where does the timing end?' },
  when: { label: 'How soon?', question: 'Which time did the hearing require?' },
  conditions: { label: 'Under what conditions?', question: 'What must the planned field test include?' },
};
export const tokens: Record<PromiseToken, { label: string; icon: string; detail: string }> = {
  inhabited: { label: 'Every inhabited quay', icon: 'crew', detail: 'Include homes omitted by the old register.' },
  registered: { label: 'Only registered quays', icon: 'book', detail: 'Use the old list, including its omission.' },
  perceivable: { label: 'A perceivable warning', icon: 'eye', detail: 'At the local work area, including the night post.' },
  lamp: { label: 'The tower lamp lights', icon: 'lamp', detail: 'At the transmitter, before the far-end outcome.' },
  ninety: { label: 'Within 90 seconds', icon: 'clock', detail: 'From authenticated order to local warning.' },
  twentyTwo: { label: 'The 22-second demo', icon: 'clock', detail: 'The observed central workshop time.' },
  'west40-link-out': { label: 'Squall + one lost link', icon: 'flag', detail: '40-knot west squall; one inter-island link unavailable.' },
  calm: { label: 'Calm workshop only', icon: 'lamp', detail: 'The condition already exercised by the demo.' },
};
