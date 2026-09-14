import type { Address, ArchiveScene, ClaimSlot, Finding, Quay, RecordId } from './types.ts';

export const scenes: Record<ArchiveScene, { title: string; subtitle: string }> = {
  stacks: { title: 'The old dispatch archive', subtitle: 'Neri opens the stacks with Orren’s reading seal. Sera asked for a list the council stopped using.' },
  table: { title: 'Three green marks, four lived addresses', subtitle: 'Lay the dispatch district’s records beside one another. Which home has fallen outside the count?' },
  dispatch: { title: 'A packet for Stormglass', subtitle: 'Carry the evidence and a proposed correction. A reading seal gives access to records; it does not authorize a change in service.' },
};

export const records: Record<RecordId, { title: string; source: string; text: string; icon: string }> = {
  request: { title: 'Sera’s ribbon', source: 'Sera’s signed archive request', icon: 'flag', text: '“Bring the old recipient list to Stormglass. The green tally counts only the names we kept.” Her signature records a request, not proof that she reached Stormglass.' },
  roll: { title: 'Issued list B', source: 'Current dispatch list · revision B', icon: 'book', text: 'Crown Steps CS02, East Landing EL03, North Watch NW09. Lower Quay is marked “seasonal berth — excluded.” These are the three destinations used for order R-17.' },
  survey: { title: 'Four inhabited quays', source: 'Current occupied-sites survey · this dispatch district', icon: 'crew', text: 'Lower Quay LQ07, Crown Steps CS02, East Landing EL03 and North Watch NW09 are inhabited. This survey covers these four quays; it does not count every island in Asterfall.' },
  change: { title: 'The older list and its changes', source: 'Superseded list A + the revision record', icon: 'eye', text: 'List A included Lower Quay LQ07. It also used North Watch NW04, an address since replaced by NW09. List B removed Lower Quay after its “seasonal berth” classification. The file contains no resident check supporting that removal. Copying all of A would restore an obsolete North Watch address.' },
  tally: { title: 'The green tally', source: 'Dispatch receipt log · order R-17 · list B', icon: 'check', text: '3 of 3 listed receivers acknowledged R-17. These marks record receipt at the addressed receivers. They contain no observation of a local warning being perceived or a crew acting. Lower Quay was not addressed.' },
};

export const quayIds: Quay[] = ['lower', 'crown', 'east', 'north'];
export const quays: Record<Quay, { name: string; current: Address; issued: Address; people: string; options: Address[] }> = {
  lower: { name: 'Lower Quay', current: 'LQ07', issued: 'omitted', people: 'Homes above the ferry workshops', options: ['omitted', 'LQ07'] },
  crown: { name: 'Crown Steps', current: 'CS02', issued: 'CS02', people: 'Houses beside the stepped landing', options: ['CS02', 'omitted'] },
  east: { name: 'East Landing', current: 'EL03', issued: 'EL03', people: 'Dock workers and their households', options: ['omitted', 'EL03'] },
  north: { name: 'North Watch', current: 'NW09', issued: 'NW09', people: 'The inhabited watch quay', options: ['NW04', 'NW09', 'omitted'] },
};
export const addressLabel = (address: Address): string => address === 'omitted' ? 'Leave off the list' : address === 'NW04' ? 'NW04 · superseded' : address;

export const claimSlots: ClaimSlot[] = ['population', 'recipients', 'receipts'];
export const claims: Record<ClaimSlot, { title: string; question: string; record: RecordId; gap: string }> = {
  population: { title: 'Who lives here?', question: 'Find the current occupied-sites evidence.', record: 'survey', gap: 'The current survey identifies four inhabited quays. A dispatch list tells us whom the sender addressed, not everyone who lives here.' },
  recipients: { title: 'Who was addressed?', question: 'Find the list actually used for R-17.', record: 'roll', gap: 'R-17 used issued list B. The older list explains the change, but it is not the recipient list used for this order.' },
  receipts: { title: 'What was observed?', question: 'Find the observation tied to R-17.', record: 'tally', gap: 'Use R-17’s receipt log for the 3/3 observation. A survey or a proposed list cannot supply a receipt observation.' },
};

export const findings: Record<Finding, { title: string; text: string }> = {
  'all-warned': { title: 'Everyone was warned', text: 'Treat the three green marks as a result for all inhabitants.' },
  'listed-only': { title: 'Listed receivers acknowledged; Lower Quay was omitted', text: 'Keep receipt, inhabited coverage and unobserved local responses separate.' },
  'none-received': { title: 'No receiver got the order', text: 'Treat the omitted quay as evidence that no addressed receiver acknowledged.' },
};

export const hints: Record<ArchiveScene, string> = {
  stacks: 'Read the current list, the occupied-sites survey and the revision record. Sera’s older list can explain an omission without being safe to reinstate unchanged.',
  table: 'Compare all four inhabited quays with list B. Choose the omitted quay, then place the survey, the issued list and the receipt log beside the questions each one answers.',
  dispatch: 'Keep every surveyed quay and its current address. North Watch moved to NW09. The 3/3 tally covers listed receivers only. Your packet is a proposal; authorization and field trials remain ahead.',
};