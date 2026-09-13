# The Missing Address — Brass Quarter continuation

This is chapter two of the illustrated RPG. It follows the completed Lower Quay watch handover into the Brass Quarter. The player continues as Iona with Pip and Mara; the Signal Lab network-builder experiment is not used.

## Playing and continuing an existing save

Start at `#adventure`. After handing the watch to Mara, choose **Take Mara’s ferry**. The continuation is at `#adventure/council`; a direct visit resumes an existing crossing or uses a completed chapter-one save from the same site. Without either, it offers the opening and import controls instead of inventing completed progress.

An exported, completed chapter-one version-1 save can be imported into the Brass Quarter. It starts a new crossing with that exact validated action history. A Brass Quarter export contains both the opening record and the new chapter’s actions. Importing or resetting the crossing does not overwrite the opening’s own save or Classic.

This chapter's original release completed the first **two illustrated chapters and six scenes**. Its ending now offers **Enter the dispatch archive**, continuing into [The Green Tally](DISPATCH_ARCHIVE.md) at `#adventure/archive`. The third chapter carries the exact completed crossing into a separate save. Classic remains the complete 24-quest campaign, available by default or at `#classic`, with its `v1.1.0` baseline preserved. The acceptance results below describe the original Brass Quarter release; additional continuation evidence belongs in the archive chapter's documentation.

## The three new scenes

| Scene | Player input | Observable consequence |
| --- | --- | --- |
| Council landing | Inspect Sera’s marked register and speak to Orren. | Contrast a “seasonal berth” classification with Mara’s home and identify whose account the hearing needs. |
| Council hearing | Ask four people for their accounts, then place their portraits in three chairs beside Orren. Arrange duty cover or carry a signed account and confirm the returned sketch. | Characters occupy the chosen seats. A reserved night-keeper chair stays empty until relief arrives; missing accounts block the handoff to the maker. |
| Tavi’s atelier | Inspect the central demonstration, assemble a promise from four pairs of tiles, review it, then stamp the field-evidence page. | The parchment changes with the selected population, outcome, time and conditions. Review identifies omissions. A “proven” stamp is rejected because the required field trials have not happened. |

Mara and Tavi are needed in this authored hearing: one brings the day-use and resident account, the other will build from the agreed needs. The night perspective can enter through either route:

- The night keeper attends after an available relief keeper takes the post. Waiting for that handover delays the ferry.
- Neri carries the keeper’s signed account and returns the hearing’s sketch for confirmation. The keeper remains at the post when relief has not been arranged.

Any ordering of the three chairs works. An occupied chair can be reassigned and a guest can move without duplication. Players may try both arrangements; already incurred relief and note-collection consequences remain in the final record and journal even after the seating changes.

The promise workbench displays the hearing’s case facts before its choices: every inhabited quay, a perceivable local warning, no more than 90 seconds from authenticated order, during a 40-knot west squall with one inter-island link unavailable. These are fictional case inputs. The separate central-lantern demonstration observed 22 seconds in calm workshop conditions. It does not establish the wider target.

## Evidence and state rules

`src/adventure/council/model.ts` holds deterministic actions and replay. Seats, heard accounts, readback, promise choices, review gaps and the planned-evidence stamp are derived from the accepted history. Completion means an agreed target and identified future evidence work, not performed field tests, professional proficiency or Sera’s rescue.

Changing a seat invalidates the current hearing, readback, promise review and evidence stamp. It retains tentative promise tiles for reconsideration. Changing a promise tile invalidates its review and stamp. Repeating an unchanged selection or review does not erase an already confirmed account. Unsupported actions, forged histories and all post-completion gameplay changes are rejected before storage.

The `proven` stamp is a deliberate learner attempt, not an accepted state: the model rejects it with an explanation, leaving history unchanged. Accepted field-evidence state is only `planned` or unset.

## Persistence and navigation

The crossing uses `campaign: asterfall-brass-quarter`, version 1, under the path-scoped `se_learning_quest_brass_quarter_v1:` key. Creation and import validate the embedded opening with the existing chapter-one parser and replay, requiring its actual final handover. The opening snapshot is immutable during chapter-two actions.

The import limits are 400 KB and 1,000 chapter-two actions, in addition to the opening’s own limits. Invalid or unsupported originals are preserved; import, load and reset require explicit confirmation. Writes compare the last observed stored bytes so another tab’s update pauses automatic saving. This is stale-snapshot detection, not an atomic multi-tab transaction.

`tab-memory.ts` retains both illustrated chapters’ in-memory snapshots across hash-route navigation, including a visit to Classic, when storage is denied or writes are blocked. It also detects changed stored bytes on return. Full page reloads and browser closure still require a stored or exported copy; tab memory is not durable storage. Tests cover the opening → crossing → opening → crossing → Classic → crossing path with denied storage.

## Art and access

The landing, chamber, atelier and new character portraits are local, original SVG source in `council/Art.tsx`. Native HTML controls handle all interactions. No new package, font service, image host or backend is required. The artwork changes with actual seats, presence, note collection, relief, promise tiles and record status; it does not simulate an unperformed storm test.

Marked objects and portrait/seat controls avoid a pixel hunt. On narrow screens, the chair controls move into a labelled row below the scene. Selecting a guest focuses the first chair for keyboard placement; source accounts remain available in the dialogue and journal. Required case facts appear before the promise controls in both desktop and mobile layouts. Larger-text and reduced-motion settings carry forward from the opening and are stored separately thereafter.

## Review and acceptance

The independent review identified pre-relief attendance labels, omitted costs after trying both hearing routes, case facts appearing after the puzzle, and loss of unsaved progress on route changes. Corrections are accompanied by focused model/persistence tests and rendered browser scenarios. The scene-art author separately checked the night keeper’s physical presence against relief state.

Reproduce with:

```sh
npm run check
npm test
npm run curriculum -- --check
npm run build
npm run test:e2e
```

Focused chapter checks are `node --experimental-strip-types --test tests/council.test.ts` and `npx playwright test council`. Production-browser scenarios cover a fresh two-chapter UI journey, the alternate signed-account route, old version-1 imports, incorrect choices and stamps, changed-evidence invalidation, keyboard placement, 390/320 px layouts, larger text, accessibility scans, denied-storage route navigation, export, corruption preservation, stale tabs, confirmation and reset.

Browser reports are generated at `test-results/acceptance.json`; scene screenshots are under `output/asterfall/council-*`. Results do not establish human screen-reader usability, real-device coverage, novice engagement or measured learning transfer. Publication is evidenced separately by the merged change’s successful main workflow and a live-site check.

Local release acceptance on 13 September 2026 passed **109/109 unit/content tests** and **45/45 production-browser scenarios**, with zero unexpected, skipped or flaky results. The browser matrix comprises four new Brass Quarter scenarios, five existing opening scenarios and six Classic scenarios on each of Chromium, Firefox and WebKit. TypeScript, the Classic curriculum-map consistency check and production build passed. The retained lazy-loaded legacy bundle still emits its documented size warning.

The bounded reviewer rechecked attendance, incurred costs, case-fact order and memory preservation. The final wording correction changes “need cards below” to “need cards above” to match their revised position before the workbench. Classic runtime, content and its existing acceptance tests remain unchanged from the tagged baseline.

A subsequent recovery check reproduced an invalid-import message being hidden behind the modal dialog. The message now appears inside the active dialog, and a valid import clears the earlier error. The browser regression asserts the visible rejection as well as preservation of the current save.

The follow-up browser run also exposed a keyboard-test race in WebKit: new keyboard input was issued before the scene-navigation focus handoff. The test now waits for the actual scene heading to receive focus before exercising portrait-to-chair keyboard selection; no timed delay or retry was added.

After the import-message and test-synchronization corrections, the targeted continuation suite passed **12/12 scenarios across all three engines**, with no retries. The earlier complete 45-scenario run and the later targeted run are separate observations; the repository workflow reruns the entire suite for the final pushed commit.
