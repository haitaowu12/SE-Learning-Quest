import { socket, tile } from './content-helpers.ts';
import type { Scene } from './types.ts';
export const inheritance: Scene[] = [
  {
    id: 'stewardship', chapter: 7, region: 'inheritance', title: 'Who keeps the promise?', subtitle: 'An operating service needs people, learning and resources.', speaker: 'sera', kind: 'allocation',
    brief: 'The winter service works in its recorded exercises. Now assign the six recurring duty tokens that keep it staffed, repairable and open to new needs.',
    objective: 'Choose accountable governance and allocate the six duty tokens.',
    sources: [{ title: 'Recurring service budget', text: 'Six tokens are available each cycle. Watch coverage needs at least two, training one, spares one and community review one. The remaining token may strengthen a role or remain reserve. These are fictional planning units.' }, { title: 'Two governance agreements', text: 'A quay council shares decisions and rotates the chair; it needs a recorded tie-break procedure. A harbour office offers one accountable service lead; it needs scheduled quay representation. Both agreements include those provisions here.' }],
    sockets: [socket('governance', 'Service governance', 'Choose the arrangement your crew will inherit.', [tile('council', 'Quay council', 'Rotating chair, public decisions and recorded tie-break.', 'crew'), tile('office', 'Harbour service office', 'One service lead with scheduled quay representation.', 'seal')], ['council', 'office'], 'Choose an accountable governance arrangement before sealing the recurring plan.')],
    artifact: 'Recurring stewardship plan', result: 'Watch coverage, training, spares and community review have recurring resources. The chosen governance arrangement owns the next decision.',
    lesson: 'An organization enables a system through infrastructure, people, knowledge, oversight and resources. A build budget alone does not sustain an operating capability.',
    topics: ['Portfolio management', 'Human resource management', 'Knowledge management', 'Infrastructure management', 'Quality management', 'Lifecycle process management'],
  },
  {
    id: 'support', chapter: 7, region: 'inheritance', title: 'A promise after the maker leaves', subtitle: 'Make the next repair somebody’s funded responsibility.', speaker: 'tavi', kind: 'choice',
    brief: 'Tavi is leaving for another island. Two support agreements are available. One pays the maker to return; the other transfers tooling and repair competence to the quay crews.',
    objective: 'Choose support and preserve an actionable service record.',
    sources: [{ title: 'Support offers', text: 'Maker cover has a recurring retainer and a two-watch response commitment, with local fallback meanwhile. Local cover needs initial training and tooling; named crews then own the same two-watch commitment. Both include parts, I-2 records, incident escalation and periodic practice.' }, { title: 'Service record requirement', text: 'The next maintainer needs the current configuration, its change history, checks, known limits and role contacts. A celebration poster cannot supply those records.' }],
    sockets: [
      socket('support', 'Support agreement', 'Both offers are feasible; their obligations differ.', [tile('maker', 'Maker retainer', 'Recurring cost; local fallback until the maker returns.', 'tool'), tile('local', 'Trained local maintainers', 'Initial tooling and training; retained local competence.', 'crew')], ['maker', 'local'], 'Select a funded support agreement with an owner and response commitment.'),
      socket('record', 'Information handover', 'What can the next maintainer act on?', [tile('poster', 'The celebration poster', 'A story of success without controlled records.', 'flag'), tile('record', 'Configuration + evidence + contacts', 'Current baseline, history, limits and named responsibilities.', 'book')], ['record'], 'A poster does not identify the current configuration, limits, evidence or responsible people.'),
    ],
    artifact: 'Funded support and knowledge handover', result: 'The selected support obligations and the controlled service record go to the incoming watch. Tavi’s departure leaves a named repair path.',
    lesson: 'Supply and support agreements need scope, responsibilities, evidence and response conditions. Knowledge handover preserves the ability to act, not just the memory of success.',
    topics: ['Supply', 'Acquisition', 'Knowledge management', 'Supportability', 'Competence'],
  },
  {
    id: 'retirement', chapter: 7, region: 'inheritance', title: 'The old core goes quiet', subtitle: 'Retire the item without retiring its remaining obligations.', speaker: 'sera', kind: 'sequence',
    brief: 'The old core can now leave active duty. The winter service still relies on records and local warning cover. Arrange the retirement steps around those dependencies.',
    objective: 'Order the substitute check, isolation, record transfer and move to controlled holding.',
    sources: [{ title: 'Retirement instruction R-3', text: 'First exercise the five-quay substitute and accept the coverage. Then isolate the old core and verify the isolation. After isolation, transfer its retained records and remove live credentials. Finally move the isolated intact core into controlled holding. Its exhibit or parts-recovery disposition requires the next recorded decision.' }],
    sockets: [], sequence: [tile('substitute', 'Exercise and accept the substitute', 'Keep five-quay warning coverage before isolation.', 'relay'), tile('isolate', 'Isolate and verify the old core', 'Confirm separation before handling or transfer.', 'shield'), tile('records', 'Transfer records; remove credentials', 'Retain useful history without live access.', 'book'), tile('remove', 'Transfer intact core to controlled holding', 'Keep it isolated and intact until its disposition is recorded.', 'tool')],
    artifact: 'R-3 retired-core holding record', result: 'In the story, the crew exercises and accepts the substitute, verifies isolation, transfers the records, removes live credentials and places the intact old core in controlled holding pending disposition.',
    lesson: 'Retirement includes service continuity, information, access, material and ownership obligations. Isolation and controlled holding can prepare an item for disposition without deciding that disposition in advance.',
    topics: ['Disposal', 'Lifecycle thinking', 'Security', 'Sustainability', 'Transition'],
  },
  {
    id: 'inheritance', chapter: 7, region: 'inheritance', title: 'The next keeper', subtitle: 'Leave a working service and a way to question it.', speaker: 'sera', kind: 'choice',
    brief: 'At Lower Quay, the night keeper brings the log to Iona. Sera stands beside the new watch. The final record should leave room for a future crew to find what this one missed.',
    objective: 'Choose the retired core’s destination and the next review commitment.',
    sources: [{ title: 'Two final disposition options', text: 'R-3 has isolated the intact core, removed live credentials and placed it in controlled holding. A disconnected exhibit keeps the teaching object with a named custodian. Parts recovery reuses suitable material through the maker’s recorded handling process. Both retain the service history.' }, { title: 'Next-cycle review', text: 'The new crew must review population changes, incidents and warning exercises each cycle. Today’s five-quay evidence is not a promise about every future population or condition.' }],
    sockets: [
      socket('legacy', 'The retired core', 'Choose what is left for the next generation.', [tile('exhibit', 'Disconnected teaching exhibit', 'A named custodian keeps the object and its history.', 'book'), tile('recover', 'Recorded parts recovery', 'Reuse suitable material and preserve the archive.', 'tool')], ['exhibit', 'recover'], 'Choose the retired item’s destination with its remaining obligations accounted for.'),
      socket('review', 'The next question', 'What responsibility remains?', [tile('forever', 'Declare the system finished', 'No review of new people, conditions or incidents.', 'seal'), tile('cycle', 'A review each service cycle', 'Population, incidents and exercises have named owners.', 'crew')], ['cycle'], 'The scope and conditions can change. The incoming crew needs an owned recurring review, not an unlimited success claim.'),
    ],
    artifact: 'The next keeper’s charter', result: 'The recorded retired-core disposition is carried out from controlled holding. Iona hands the service record to the next watch. Sera stays for the evening meal, without a post left unattended.',
    lesson: 'A lifecycle does not end in certainty. Carry out remaining disposition obligations, then leave a current baseline, evidence with limits, accountable support and a way for future needs to change the system.',
    topics: ['Systems thinking', 'Lifecycle thinking', 'Organizational learning', 'Governance', 'Ethics and inclusion'],
  },
];
