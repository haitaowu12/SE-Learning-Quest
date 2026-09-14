# Asterfall — complete illustrated campaign

The illustrated story contains **seven chapters and 25 scenes**, beginning at `#adventure`. The first three chapters retain their routes and separate saves. **Sail to Stormglass** in the archive opens the four-chapter continuation at `#adventure/voyage`. Classic remains a separate 24-quest campaign and the default entry.

## Journey and activities

| Chapter | Scenes | Player activity |
| --- | --- | --- |
| The Missing Keeper | 3 | Inspect the house, observe the crew, rehearse a warning and match evidence to claims. |
| The Missing Address | 3 | Bring people or their accounts to a hearing, arrange relief and agree a warning target. |
| The Green Tally | 3 | Compare inhabitants, recipients and receipt records, then propose a current address list. |
| Stormglass | 4 | Apply new change authority, compare supported routes, connect interfaces and order the build. |
| The watch returns | 4 | Test the receiver, observe local warnings, accept service and hand over Sera’s duty. |
| A changing shore | 4 | Diagnose a fault, maintain coverage, plan repair, add a shelter and exercise five-quay service. |
| The next keeper | 4 | Fund recurring duties, assign governance and support, retire the old core and record a future review. |

The continuation uses graphical choices, route cards, a connector tray and sockets, movable dependency cards, exercise controls with observation rows, and duty-token allocation. Every action has a native button. Source facts sit beside the desktop board and precede it on small screens. **Review with…** identifies an open condition from those facts. **Record & continue** commits the step and carries its evidence forward. Unrecorded choices can be revised without losing lives.

## Alternatives and evidence

Alternative relay routes have different material and crew commitments. The relay architecture and the local beacon/repeater or staffed voice-and-flag warning are separate decisions. Selected routes and arrangements affect the authored exercise timings. The operating fallback, shelter build approach, governance, support agreement and retired core’s destination retain their distinct obligations in the ending and journal.

Six recurring tokens must cover watch 2, training 1, spares 1 and community review 1. The remaining token can strengthen a role or remain in reserve. Funding another role does not excuse missing watch cover or overspending.

C-18 is a newly issued authority for build and controlled trials. The archive’s reading seal remains permission to read; Mara retains service acceptance. Receiver receipt, local perception and crew action remain distinct. Rejecting an expired order is an expected passing receiver result without a local warning. The exposed lantern can receive a packet while the night crew cannot see its warning.

Changing a tested configuration invalidates its current runs and review. Repeating an identical action preserves valid evidence. The four-address winter configuration leaves Drift visible as the missing fifth recipient, rather than excluding it from the result. The changed scope requires new observations and regression at the original quays.

Sera’s duty must transfer to the incoming keeper before she leaves the upper post. Drift appears when introduced, and its warning activates after winter acceptance. The old core has a separate isolation and disposition history while the current service remains active.

All timing, resource and exercise data are authored fictional cases, not outputs from a physical reliability or load-flow simulation. Repair and retirement teach work scope and dependencies through choices; execution of those plans and their acceptance checks are narrated story outcomes, not additional interactive test rigs.

## Saves and controls

A completed archive export or continuation save can be imported in **Save & settings**. Each continuation export embeds all three predecessor histories and subsequent actions. Parsing limits the file to 1 MB and 3,000 actions, validates nested histories and replays permitted transitions. An unfinished archive cannot bypass its remaining work. Earlier chapter and Classic storage keys are not rewritten.

Import, stored-copy loading and reset require confirmation. Corrupt originals remain available for export. An observed conflict pauses writes and preserves the tab’s history for export or reconciliation. The stored-value comparison detects observed conflicts; localStorage is not an atomic cross-tab transaction.

When storage is denied, memory retains progress through hash navigation to other chapters and Classic. Export before reloading or closing the tab: destroying the document destroys that memory. Import errors remain separate from storage warnings, so cancelling an import cannot hide paused saving.

Use Tab, Shift+Tab, Enter and Space. Sequence moves retain keyboard focus, and scene/review headings receive focus as the player advances. **Larger text** and **Reduce motion** are available; the operating system’s reduced-motion preference also disables decoration. Every challenge is untimed. The journal preserves facts and observations without requiring the artwork.

## Educational and acceptance scope

Scene topics describe introductory teaching intent across lifecycle thinking, inclusion, evidence, interfaces, configuration, trials, operations, support and retirement. They do not establish an exhaustive normative curriculum or certification readiness. Classic’s existing 30-process/18-supporting-concept map remains unchanged. No licensed passages or external runtime assets were added. See [source boundaries](RPG_SOURCES.md) and the [Classic map](RPG_CURRICULUM.md) for their scope.

Reproduce validation with the supported Node version and locked dependencies:

```sh
npm ci
npm run check
npm test
npm run curriculum -- --check
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

The baseline continuation adds sixteen unit scenarios and ten browser scenarios per engine, with additional review-driven recovery cases recorded separately. Browser coverage includes the fresh seven-chapter UI journey, alternatives, failed/corrected trials, five-quay observations, keyboard input, 390 px and 320 px/larger-text layouts, import cancellation, corruption recovery, denied storage and cross-tab reconciliation. Selected axe scans cover each workbench type and the ending. The fresh journey checks runtime errors and external requests.

Screenshots are written to `output/asterfall/voyage-<browser>-*.png`. Tall component captures use a taller viewport at the same tested width to avoid scroll-container clipping; layout assertions run at the stated viewport separately. Execution results are recorded in the release acceptance record.

Software checks and screenshot inspection do not establish novice engagement, learning transfer or full assistive-technology usability. Those outcomes require observation with learners.
