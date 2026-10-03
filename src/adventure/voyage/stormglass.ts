import { socket, tile } from './content-helpers.ts';
import type { Scene } from './types.ts';
export const stormglass: Scene[] = [
  {
    id: 'authority', chapter: 4, region: 'stormglass', title: 'The seal at Stormglass', subtitle: 'A proposal reaches the people who can act on it.', speaker: 'tavi', kind: 'choice',
    brief: 'Tavi meets the ferry with a new order from the change hearing. Your archive packet explains the omission. The order authorizes a correction, subject to conditions.',
    objective: 'Place the authority, recipient list and release boundary on the dispatch board.',
    sources: [
      { title: 'Order C-18 · newly issued', text: 'Orren and the quay representatives authorize Tavi to build and trial the corrected four-quay list. Mara may accept it into service after receiver checks, local-warning trials and a staffed rollback review.' },
      { title: 'Your archive packet', text: 'The current addresses are LQ07, CS02, EL03 and NW09. List B omitted Lower Quay. The reading seal only authorizes access to records.' },
    ],
    sockets: [
      socket('authority', 'Authority', 'What authorizes this work?', [tile('reading', 'Reading seal', 'Permission to inspect the originals.', 'book'), tile('c18', 'Order C-18', 'Permission to build and trial the correction.', 'seal')], ['c18'], 'The reading seal does not authorize a change. Order C-18 does, subject to its release conditions.'),
      socket('list', 'Controlled list', 'Which version goes to Tavi?', [tile('current', 'Four current addresses', 'LQ07 · CS02 · EL03 · NW09; keep the old list as history.', 'map'), tile('old', 'Restore list A', 'Includes Lower Quay but restores superseded NW04.', 'book')], ['current'], 'List A restores an obsolete address. Carry the four current surveyed addresses.'),
      socket('release', 'Release boundary', 'What may happen before acceptance?', [tile('service', 'Enter service', 'Treat correction approval as permission to operate.', 'flag'), tile('trial', 'Build and trial', 'Mara retains service acceptance after the evidence.', 'shield')], ['trial'], 'C-18 authorizes build and trials. Service acceptance still requires the named evidence and owner.'),
    ],
    artifact: 'C-18 controlled work packet', result: 'Tavi accepts the four-address baseline and its conditions. Mara keeps the service decision; Neri keeps the old list.',
    lesson: 'Evidence, permission to change and permission to operate are separate. An agreement names the scope, deliverable, acceptance evidence and accountable people.',
    topics: ['Acquisition and supply', 'Configuration management', 'Decision management', 'Stakeholder agreement'],
  },
  {
    id: 'routes', chapter: 4, region: 'stormglass', title: 'Two ways around the squall', subtitle: 'Move a warning through a network that can lose a link.', speaker: 'tavi', kind: 'network',
    brief: 'A west squall can cut one inter-island link. Two of Tavi’s designs can meet the proposed target. Their material and staffing costs differ.',
    objective: 'Choose a route and fund the support that makes it usable.',
    sources: [
      { title: 'Design study · fictional estimates', text: 'West-only costs 3 crates but loses service when that link fails. Diverse east/west relays cost 6 crates plus a spare joint. Local lookouts cost 4 crates plus two rotating crews. The budget is 6 crates; crew cover is available.' },
      { title: 'Target from the hearing', text: 'Perceivable warning at every inhabited quay within 90 seconds of an authenticated order, in a 40-knot west squall with one link unavailable. Design estimates are not field observations.' },
    ],
    sockets: [
      socket('route', 'Warning route', 'Your path appears on the map.', [tile('single', 'West line only', '3 crates · no alternative when the west link fails.', 'link'), tile('diverse', 'East + west relays', '6 crates · alternate route and spare joint.', 'relay'), tile('lookouts', 'Local lookout chain', '4 crates · staffed posts with rotating cover.', 'crew')], ['diverse', 'lookouts'], 'A single west line cannot serve the stated link-out condition. Choose a diverse route or staffed lookout chain.'),
      socket('support', 'Support commitment', 'Match support to your design.', [tile('crews', 'Two rotating crews', 'Fund posts and relief handovers.', 'crew'), tile('joint', 'A spare relay joint', 'Store the diverse route’s replacement part.', 'tool')], ['crews', 'joint'], 'Choose support for the selected route.'),
    ],
    artifact: 'Route and resource decision', result: 'The chosen route and its support cost travel together. Tavi will test that design with the west link unavailable.',
    lesson: 'Compare alternatives against the same mission, constraint and failure condition. Include operating burden alongside build cost.',
    topics: ['Architecture definition', 'System analysis', 'Risk management', 'Project planning', 'Infrastructure and resources'],
  },
  {
    id: 'interfaces', chapter: 4, region: 'stormglass', title: 'The sockets disagree', subtitle: 'Both ends must agree on what a signal means.', speaker: 'tavi', kind: 'connect',
    brief: 'The transmitter and local unit fit the same brass socket. Their labels disagree. Connect each end to I-2 before Tavi builds a batch.',
    objective: 'Select a signal tile, then place it in its matching socket.',
    sources: [{ title: 'Interface card I-2', text: 'ORDER requires signed V2 packets with ID and expiry. LOCAL uses two pulses for HOLD: wait for the keeper. RECEIPT confirms packet acceptance, not human perception or action.' }, { title: 'Old module', text: 'V1 accepts unsigned pulses. Its two pulses mean DEPART. Its green lamp confirms power. Physical fit does not establish common meaning.' }],
    sockets: [
      socket('order', 'ORDER input', 'Use the agreed packet contract.', [tile('unsigned', 'Unsigned V1', 'Accept any shaped pulse.', 'link'), tile('signed', 'Signed V2', 'ID + expiry + signature.', 'seal')], ['signed'], 'I-2 requires signed V2, an ID and expiry.'),
      socket('meaning', 'LOCAL output', 'What do two pulses mean?', [tile('hold', 'Two pulses · HOLD', 'Wait for the keeper.', 'flag'), tile('depart', 'Two pulses · DEPART', 'The incompatible old meaning.', 'map')], ['hold'], 'I-2 defines HOLD at both ends. The old module uses DEPART.'),
      socket('ack', 'RECEIPT return', 'What does it establish?', [tile('people', 'Everyone acted', 'Infer a human response.', 'crew'), tile('received', 'Packet accepted', 'Receiver evidence only.', 'relay')], ['received'], 'Packet receipt does not establish what anyone perceived or did.'),
    ],
    artifact: 'Agreed I-2 interface card', result: 'Both ends share the packet, meaning and acknowledgement scope. The incompatible module stays off the bench.',
    lesson: 'An interface includes structure, timing, meaning and responsibility. A connection can fit mechanically while carrying an incompatible instruction.',
    topics: ['Design definition', 'Interface management', 'Security', 'Information and semantics'],
  },
  {
    id: 'build', chapter: 4, region: 'stormglass', title: 'A build that can be repeated', subtitle: 'Turn an agreed design into an inspectable assembly.', speaker: 'tavi', kind: 'sequence',
    brief: 'The maker’s team is ready. Neri has an independent inspection slot. Arrange the work around the workshop dependencies.',
    objective: 'Move the four work cards into dependency order.',
    sources: [{ title: 'Workshop rule', text: 'Release drawings before assembly. Inspect the assembled interfaces before power. Neri then accepts the build record for receiver testing. This accepts the assembly, not field service.' }],
    sockets: [], sequence: [tile('drawings', 'Release drawings + I-2', 'Controlled design before assembly.', 'book'), tile('assemble', 'Assemble the relay', 'Use the released parts and revision.', 'tool'), tile('inspect', 'Inspect the interfaces', 'Check the assembly before power.', 'eye'), tile('accept', 'Neri accepts the record', 'Independent review enables testing.', 'seal')],
    artifact: 'Inspected assembly record', result: 'The assembly matches one controlled revision. Neri records inspection and the crew moves it to the test bench.',
    lesson: 'Implementation creates an item; integration joins interfaces; inspection supplies evidence about the assembly. Recorded revisions make defects traceable.',
    topics: ['Implementation', 'Integration', 'Quality assurance', 'Project assessment and control', 'Information management'],
  },
];