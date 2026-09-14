# The Green Tally — dispatch archive continuation

Chapter three follows the completed Brass Quarter target and Sera's request to carry the old recipient list to Stormglass. Choose **Enter the dispatch archive** at the end of chapter two, or visit `#adventure/archive` with a completed crossing saved on the same site. A completed Brass Quarter version-1 export can also be imported. An unfinished earlier history does not unlock the archive.

The illustrated path contains three chapters and nine scenes. The archive ends with a proposed correction and its source records ready for a crossing. Stormglass is the next story destination; a fourth illustrated chapter is not implemented. Classic remains the separate complete 24-quest campaign.

## The investigation

| Scene | Player input | Observable result |
| --- | --- | --- |
| Archive stacks | Open Sera's ribbon, issued list B, the current occupied-sites survey and superseded list A with its revision record. | Read source-labelled accounts and collect the records. The three comparison sources unlock Neri's table. |
| Comparison table | Switch between surveyed inhabitants and issued recipients, select the omitted quay, and place records into three evidence pockets. | The district changes appearance with the selected view. The reviewed record distinguishes who lives here, who was addressed and what the receipt log observed. |
| Dispatch desk | Amend issued B or rebuild from the current survey; select addresses and a finding; ask Neri to review and choose a stamp. | The proposed sheet reflects the current entries. Old addresses and unsupported findings need correction. A service-approval stamp is rejected; a proposal may be sealed with authorization still pending. |

The fictional dispatch district has four inhabited quays: Lower Quay LQ07, Crown Steps CS02, East Landing EL03 and North Watch NW09. Issued list B omits Lower Quay after a seasonal-berth classification. Its other three recipients acknowledged order R-17. That **3/3** observation is bounded by the recipient list and does not record perceived local warning or crew action. The survey covers this district, not every island in Asterfall.

Old list A explains the omission but is not safe to reinstate unchanged: its North Watch address NW04 was superseded by NW09. Both amendment and rebuild are valid routes in the supplied case. Amendment retains B's existing three recipients as a starting point; rebuild starts with four empty entries. Switching routes resets the draft list as the UI explains. Neither route supplies authority to deploy it.

Sera's signed request is evidence of a request, not proof she reached Stormglass. The ending retains Tavi's unperformed field trials and the distinction between a proposed configuration and an authorized change. No rescue, measured learner competence, or field result is inferred from finishing this exercise.

## State and recovery

`src/adventure/archive/model.ts` derives state by replaying accepted actions. The player may place evidence in any order and enter the rebuilt addresses in any order. Repeating an unchanged selection or review retains an accepted stamp and adds no history. Changing the selected quay or a pinned source invalidates the evidence review, proposal review and stamp; tentative addresses remain available for reconsideration. Address, route or finding changes invalidate the proposal review and stamp. Completion freezes gameplay history.

The archive save uses `campaign: asterfall-dispatch-archive`, version 1, and `se_learning_quest_dispatch_archive_v1:` with the hosting path. It embeds the exact validated completed Brass Quarter save, which embeds the opening. Import validates both predecessors before replaying new actions. Its limit is 600 KB and 1,000 archive actions; earlier chapters retain their own nested limits. Unknown fields, unsupported versions, malformed action shapes and forged completion histories are rejected.

Loading and automatic saving do not modify either earlier storage namespace or Classic. Import, loading a stored copy, and reset require explicit replacement confirmation. Corrupt originals remain available to export. Another tab's changed stored bytes pause automatic saving and keep the current tab's work for reconciliation. As with the earlier chapters, this is conflict detection around local storage, not an atomic distributed transaction.

The chapter uses the existing tab-memory mechanism and a validated continuation snapshot. Unsaved work survives hash navigation among the illustrated routes and Classic in the same tab. Full reload or closure still requires browser storage or an exported JSON copy. The import dialog reports rejection inside the active dialog, ignores a late file read after dismissal, and clears an earlier error when a valid candidate is read.

## Presentation and source scope

`Art.tsx` contains three original SVG environments, quay illustrations and paper states. Existing Iona, Pip and Neri portraits are reused. Native HTML buttons, labelled groups and radio controls handle every interaction; no essential action depends on clicking an unlabelled SVG area. Selecting a source focuses the first evidence pocket for keyboard placement. A scene transition focuses its heading. The current survey precedes the dispatch choices even after reload or import.

The chapter inherits larger text and reduced-motion settings while storing subsequent changes separately. Source cards remain readable in the journal. Artwork and controls are local; no dependency, backend, font service or external runtime request is added. Classic's shipped content, engine and tests remain unchanged.

The educational content is an original fictional case about inclusion boundaries, evidence scope, traceability and configuration/change decisions. It adds no licensed source text and makes no new normative-coverage claim. The existing [source boundaries](RPG_SOURCES.md) and [Classic curriculum map](RPG_CURRICULUM.md) remain applicable to their stated scope. Automated interaction tests do not establish novice engagement, learning transfer or human assistive-technology performance.

## Acceptance

Reproduce the checks with the supported Node version and installed dependencies:

```sh
npm run check
npm test
npm run curriculum -- --check
npm run build
npm run test:e2e
```

Focused checks are `node --experimental-strip-types --test tests/archive.test.ts` and `npx playwright test archive`. Fourteen new unit tests cover both proposal routes, either hearing, both opening arrangements, every accepted save prefix, evidence/address ordering permutations, incorrect evidence and recovery, stamp authority, invalidation, strict parsing, limits, predecessor preservation and storage failure/conflict.

Five browser scenarios cover a fresh three-chapter UI journey, amendment and rebuild, old crossing import, wrong choices and correction, current-survey visibility after reload, keyboard placement, 390/320 px layouts, larger text, selected axe scans, source-boundary and stamp behavior, export, corruption, replacement confirmation, stale tabs, reset and denied-storage navigation through earlier chapters and Classic.

Local deterministic validation passed 123/123 unit/content tests, TypeScript, the unchanged Classic curriculum check and a production build. The legacy chunk still emits its existing size warning. Local browser execution was blocked by the environment's localhost navigation policy before gameplay began; it is not counted as a gameplay pass. Browser acceptance and screenshot inspection are recorded separately against the pushed commit through the repository's three-engine CI.