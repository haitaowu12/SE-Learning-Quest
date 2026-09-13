import type { Clue, Device, Place } from './model.ts';
export type Person = 'iona' | 'pip' | 'mara' | 'sera';
export const people: Record<Person, { name: string; role: string }> = {
  iona: { name: 'Iona', role: 'Keeper in training' }, pip: { name: 'Pip', role: 'Your clockwork companion' },
  mara: { name: 'Mara', role: 'Ferry pilot · Lower Quay' }, sera: { name: 'Sera', role: 'Your missing mentor' },
};
export const places: Record<Place, { name: string; chapter: string; intro: string }> = {
  workshop: { name: 'Sera’s lantern house', chapter: '01 · A room left behind', intro: 'Sera has vanished. Her lantern is still green. Pip is waiting beside the workbench.' },
  quay: { name: 'Lower Quay', chapter: '02 · Someone the lamp missed', intro: 'Mara’s ferry came back flooded. The tower’s log says its warning went out.' },
  bench: { name: 'The quay warning station', chapter: '03 · A promise worth keeping', intro: 'Mara lends you a lantern and a spare lookout. Help her crew hold the ferry when warned.' },
};
export const evidence: Record<Clue, { title: string; source: string; text: string; icon: string; person: Person }> = {
  lamp: { title: 'Tower log', source: 'Lantern house · transmitter', text: 'The storm order was sent. This green lamp records transmission; it does not record what the ferry crew did.', icon: 'lamp', person: 'pip' },
  crystal: { title: 'Sera’s message', source: 'Sera · voice crystal', text: '“A green lamp is a claim, Iona. Find Mara at Lower Quay. Ask who can live by it.”', icon: 'crystal', person: 'sera' },
  ledger: { title: 'A crossed-out address', source: 'Sera’s unfinished ledger', text: 'Lower Quay is marked “seasonal berth.” Sera has written: “Families live here. Who decided they do not count?”', icon: 'book', person: 'pip' },
  mara: { title: 'Mara’s account', source: 'Mara · ferry pilot', text: '“Our receiver lit up, but the crew kept loading. When a warning comes, I need them to stop loading and hold the ferry.”', icon: 'ferry', person: 'mara' },
  crew: { title: 'The crew at work', source: 'Quay visit · observed conditions', text: 'The winch is running. The crew wear hearing protection. They can see this lantern; a spare local lookout can also approach them.', icon: 'crew', person: 'pip' },
  receiver: { title: 'Quay receiver', source: 'Lower Quay · receiver indicator', text: 'A local indicator and bell are connected to the warning receiver. The indicator records message arrival, not what the crew do next.', icon: 'bell', person: 'pip' },
  trial: { title: 'Quay rehearsal', source: 'Mara’s crew · current setup', text: 'A record of this crew’s response with the selected tool and agreed meaning. It covers this rehearsal, not every quay or storm.', icon: 'flag', person: 'mara' },
};
export const equipment: Record<Device, { name: string; icon: string; detail: string }> = {
  bell: { name: 'Keep the bell', icon: 'bell', detail: 'No extra equipment. The crew are wearing hearing protection.' },
  beacon: { name: 'Fit the lantern', icon: 'lamp', detail: 'Use Mara’s spare lantern. The crew can see it from this work area.' },
  messenger: { name: 'Post the lookout', icon: 'crew', detail: 'Use the spare local lookout. One person must stay on warning duty.' },
};
