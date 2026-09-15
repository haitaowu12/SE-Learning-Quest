import { socket, tile } from './content-helpers.ts';
import type { Scene } from './types.ts';
export const service: Scene[] = [
  {
    id: 'outage', chapter: 6, region: 'service', title: 'A dark line on the watch board', subtitle: 'Keep the mission covered while finding the fault.', speaker: 'sera', kind: 'network',
    brief: 'A month into service, the west line drops out. Sera lays the watch log beside the route map. The local warning posts remain staffed; the crew needs a bounded response.',
    objective: 'Identify the failed element and choose a covered temporary route.',
    sources: [{ title: 'Watch log · three observations', text: 'Station power remains present. The east route passes its test. Continuity is lost at the west weather joint, where inspection finds water inside the seal. No other link has failed.' }, { title: 'Available fallback', text: 'The east detour has been exercised. The staffed local posts also cover all four quays. Either can maintain the current mission while the west joint is isolated for repair.' }],
    sockets: [
      socket('fault', 'Fault boundary', 'Which element do the observations implicate?', [tile('power', 'Station power', 'Replace the whole power unit.', 'relay'), tile('west-joint', 'West weather joint', 'Lost continuity and water at one joint.', 'tool')], ['west-joint'], 'Power is present and the east route works. The observed fault is at the west weather joint.'),
      socket('route', 'Temporary warning route', 'Show the covered route on the map.', [tile('east', 'Use the east detour', 'Keep local repeaters and the trained watch active.', 'link'), tile('posts', 'Use staffed local posts', 'Record the additional handovers until repair.', 'crew'), tile('stop', 'Stop every warning', 'Remove coverage while investigating one link.', 'shield')], ['east', 'posts'], 'Two exercised fallbacks remain available. Choose one and keep its crews and local warning provision active.'),
    ],
    artifact: 'Bounded incident and fallback record', result: 'The watch continues on the selected fallback. The west joint is isolated for investigation; the crew does not replace unrelated working equipment.',
    lesson: 'Operating evidence narrows an incident boundary. Recovery protects the mission while diagnosis distinguishes the observed defect from a broader unsupported explanation.',
    topics: ['Operations', 'System analysis', 'Risk response', 'Resilience'],
  },
  {
    id: 'repair', chapter: 6, region: 'service', title: 'Fix the joint, keep the contract', subtitle: 'A repair needs evidence before returning to duty.', speaker: 'tavi', kind: 'connect',
    brief: 'Tavi has the replacement joint. The old controller is still on a shelf, but changing it would reintroduce the I-2 mismatch. Assemble a repair packet from the observed cause.',
    objective: 'Connect the repair, regression checks and return authority.',
    sources: [{ title: 'Repair instruction M-4', text: 'With the west joint isolated and fallback active, replace the failed weather seal and joint. Retain V2 and the four-address baseline. Check continuity, valid/expired orders and both route paths, then obtain Mara’s return-to-duty acceptance.' }],
    sockets: [
      socket('work', 'Repair scope', 'Remove the observed defect.', [tile('v1', 'Fit the old V1 controller', 'Changes a working interface without fixing the seal.', 'relay'), tile('joint', 'Replace seal + joint', 'Use the stocked part within M-4.', 'tool')], ['joint'], 'The observed defect is the wet joint. Replacing V2 with V1 does not fix the seal and breaks the agreed interface.'),
      socket('checks', 'Regression record', 'What must be exercised?', [tile('full', 'Joint, I-2 and both routes', 'Continuity + valid/expired orders + normal/fallback paths.', 'eye'), tile('lamp', 'Power lamp only', 'Shows power, not restored warning performance.', 'relay')], ['full'], 'A lit power lamp does not check the repaired path or retained interface. M-4 requires the joint, I-2 and both routes.'),
      socket('return', 'Return to duty', 'Who accepts the record?', [tile('mara', 'Mara accepts M-4', 'Return after the specified checks are recorded.', 'seal'), tile('part', 'The new part label', 'Treat a part identity as service acceptance.', 'book')], ['mara'], 'A part label identifies an item. Mara owns return-to-duty acceptance after the checks.'),
    ],
    artifact: 'Accepted M-4 repair packet', result: 'In the story, Tavi performs the specified repair and checks; Neri records their results. Mara accepts the repaired west path. V2 and the current list are retained.',
    lesson: 'Maintenance changes an item in an operating system. Bound the work, preserve configuration, check affected and retained behavior, and assign the return-to-duty decision.',
    topics: ['Maintenance', 'Configuration control', 'Regression verification', 'Supportability'],
  },
  {
    id: 'shelter', chapter: 6, region: 'service', title: 'A fifth light in winter', subtitle: 'A changed population changes the warning boundary.', speaker: 'sera', kind: 'choice',
    brief: 'A new winter shelter opens on Drift Quay. Its residents are outside the four-address baseline. Sera asks Iona to carry the mission forward without treating last season’s evidence as proof of the new one.',
    objective: 'Update the scope, implementation approach and evidence obligation.',
    sources: [{ title: 'Winter survey W-2', text: 'Drift Quay is now inhabited at DQ11. The other four addresses remain current. The community retains the 90-second warning target and the west-squall/link-out condition.' }, { title: 'Change hearing C-22', text: 'The hearing authorizes either extending the current installation or adding a parallel shelter module. Both require controlled drawings, I-2 interfaces, trained cover and new observations at Drift plus regression at the original quays.' }],
    sockets: [
      socket('scope', 'Mission boundary', 'Which inhabitants count now?', [tile('four', 'The original four', 'Reuse the previous population boundary.', 'map'), tile('five', 'Five current quays', 'Add DQ11; retain the four current addresses.', 'crew')], ['five'], 'W-2 adds an inhabited shelter. The original four-quay boundary now omits people.'),
      socket('approach', 'Build approach', 'Both routes have C-22 authorization.', [tile('extend', 'Extend the current installation', 'Reuse its controlled interface; plan a cutover window.', 'link'), tile('parallel', 'Parallel shelter module', 'Additional hardware and support; retain I-2 at its boundary.', 'relay')], ['extend', 'parallel'], 'Choose a controlled implementation approach for the authorized shelter change.'),
      socket('evidence', 'Evidence obligation', 'Which observations must be renewed?', [tile('repeat', 'Drift + original-quay regression', 'Exercise the changed scope and retained behavior.', 'eye'), tile('reuse', 'Reuse last season’s pass', 'No Drift observation; changed configuration untested.', 'book')], ['repeat'], 'Last season’s record includes neither Drift nor this changed installation. New and retained behavior need checks.'),
    ],
    artifact: 'C-22 five-quay change packet', result: 'The five-quay scope, selected build approach and renewed evidence obligation are recorded. Tavi implements the controlled change before the next exercise.',
    lesson: 'A changed mission can invalidate a former success claim without invalidating the historical observation. Reassess the boundary, alternatives, risks and evidence affected by the change.',
    topics: ['Business and mission analysis', 'Stakeholder needs', 'Requirements change', 'Lifecycle models', 'Adaptability'],
  },
  {
    id: 'winter', chapter: 6, region: 'service', title: 'The shelter joins the watch', subtitle: 'Observe the new boundary and check what was retained.', speaker: 'mara', kind: 'trial',
    brief: 'The shelter’s keeper stands at DQ11. The old four-quay configuration remains available for comparison. Test the changed installation before Mara accepts the winter service.',
    objective: 'Load the five-quay configuration and run all three winter exercises.',
    sources: [{ title: 'C-22 acceptance plan', text: 'Observe Drift’s local warning, regress the original four quays, and exercise all five at night in a 40-knot west squall with the west link out. Each local warning must be perceived within 90 seconds. Mara accepts C-22 after these records pass.' }],
    sockets: [socket('scope', 'Configuration under test', 'A change clears the current run evidence.', [tile('four', 'Previous four-quay version', 'No DQ11 address in its dispatch set.', 'book'), tile('five', 'C-22 five-quay version', 'DQ11 plus the four retained current addresses.', 'map')], ['five'], 'The four-quay version omits Drift. Fit the C-22 configuration and repeat the exercises.')],
    cases: [{ id: 'shelter', label: 'Drift shelter', condition: 'New keeper at DQ11 · local perception' }, { id: 'regression', label: 'Original quays', condition: 'Retained four addresses · current local arrangements' }, { id: 'winter', label: 'Winter squall', condition: 'All five · 40 knots · west link out · night positions' }],
    artifact: 'Accepted five-quay winter service', result: 'The recorded exercises cover Drift and the original quays. All five meet the scenario’s 90-second target under the exercised conditions, and Mara accepts C-22 into service.',
    lesson: 'A changed baseline requires evidence tied to the new configuration and scope. Regression checks ask whether retained needs still hold, alongside evidence for the new need.',
    topics: ['Validation', 'Verification', 'Regression', 'Acceptance', 'Measurement'],
  },
];