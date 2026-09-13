# The Missing Keeper — illustrated RPG opening

This is the replacement direction after the owner found Signal Lab confusing and asked to retain Asterfall's RPG story, with more graphical inputs and interaction. The network-builder experiment is set aside. Classic remains the complete 24-quest campaign and is preserved at the `v1.1.0` tag and release.

## Play

Open the site's `#adventure` route. Locally, run `npm run build` and `npm run preview:pages`, then open `http://127.0.0.1:4173/SE-Learning-Quest/#adventure`. The default route and `#classic` still open Classic; `#episodes` opens Coffee Lab and Harbour Line.

This document describes the completed opening chapter. Its **Take Mara’s ferry** action now continues into [The Missing Address](BRASS_QUARTER.md), a second complete illustrated chapter at `#adventure/council`. The two chapters are not a conversion of all 24 Classic quests. Classic keeps its separate progression and saves.

## The playable chapter

| Scene | What the player does | What changes in the story |
| --- | --- | --- |
| Sera's lantern house | Inspect the green transmitter lamp and play the voice crystal. Read the unfinished ledger optionally. | Collect two source-labelled clues and discover that Mara can explain the other end of the warning. |
| Lower Quay | Talk to Mara, try the old bell, and observe the working crew. | See a receiving indicator alongside people who keep loading. Crew observation supplies the noise, hearing-protection, sightline and spare-lookout conditions. |
| Quay warning station | Equip a bell, lantern or local lookout; agree what the signal means; rehearse with the crew. Match two evidence cards to their claims and hand over the watch. | Equipment and agreed action change the observed response. Mara accepts the selected arrangement and offers the next ferry lead in Sera's story. |

The chapter retains Iona, Pip, Sera's disappearance, Mara, the ferry and the evidence distinction behind the original opening. It varies the player's input: inspect a scene object, hear a short character response, use a satchel, equip a tool, demonstrate an action and place a record in the ledger. It does not ask the player to construct a network graph.

Marked native buttons identify interactive objects; there is no required pixel hunt. On narrow screens those same controls become a labelled icon strip directly below the scene. Warning tools sit beside the scene on desktop. The current objective is visible above the play area. Optional detail lives in the journal rather than in required dialogue sequences.

## Model and evidence boundaries

The fictional case supplies a running winch, hearing protection, a clear sightline and a spare local lookout. In that case, either the lantern or the lookout can get attention; a clear agreement to stop loading and hold departures is additionally needed. The bell alone does not get this crew's attention. These are authored scenario rules, not acoustics, human-behavior or safety predictions.

The rehearsal distinguishes a received message, a noticed cue and an acted-on instruction. A tool or meaning change invalidates the current trial, its satchel card and both evidence placements. The tower log supports transmission; the quay rehearsal supports the observed crew response. An old result cannot support a revised setup merely because the player already saw success.

The source warning requirement in Classic includes all inhabited quays, 90 seconds, a 40-knot squall and a failed inter-island link. This introductory chapter does **not** demonstrate that requirement. Its journal and result panel identify the narrower crew/setup/rehearsal scope. It makes no mastery, certification or demonstrated engagement claim.

## Art and interaction implementation

`src/adventure/Art.tsx` supplies original SVG environments, character portraits, objects, equipment and response states. The rendered lantern house, quay and warning station use local vector artwork and native DOM controls. There are no remote runtime assets, sound requirements, backend calls or added package dependencies. Color is accompanied by labelled controls and textual observations. Reduced-motion settings retain the outcome without requiring animation.

An image-generation call produced a concept image during development. The connector refused its transfer to the repository because the file host was outside its trusted-host list. That image and its proposed portrait crops are **not included** in the application, and the concept mockup is not evidence of implemented gameplay. The playable scene artwork is the original SVG source described above.

## Persistence and compatibility

`model.ts` implements typed transitions and replay. Saves contain validated actions and reading settings under `campaign: asterfall-illustrated`, version 1. Imports replay the actions in order, reject unsupported fields/versions and impossible transitions, and reject gameplay changes after completion. The 250 KB / 1,000-action bounds are import and local action limits, not timers.

The storage key begins `se_learning_quest_illustrated_v1:` and is scoped to the deployment path. Classic's `se_learning_quest_asterfall_v1:` key is untouched. Malformed stored bytes are preserved, storage failure allows in-memory play and export, and observed cross-tab changes pause writes until the player explicitly reconciles. Import and restart require confirmation. As in Classic, this is stale-snapshot detection, not atomic multi-tab synchronization.

Completed opening saves continue into the Brass Quarter without a schema change. Chapter two retains a validated copy of the original history in its own save and export. Both illustrated chapters retain unsaved progress across hash-route navigation using tab memory; a full page reload or browser closure still needs storage or an export. See [continuation compatibility](BRASS_QUARTER.md).

## Review and verification

A separate read-only review checked the q01/q02 source scenario and then the illustrated implementation. Corrections keep the old-bell observation separate from the diagnosis until the crew is inspected, make the beacon/lookout handover match its tested arrangement, and prevent imported actions after completion. The review did not test engagement with human learners.

Functional regressions cover both successful equipment routes, prerequisites, failed perception versus failed action, claim/evidence mismatch, configuration invalidation, preserved imports, replay, input immutability, and save namespaces. The browser suite exercises the actual rendered chapter, optional static motion, complete routes, repeated selection after an incorrect evidence placement, keyboard focus, 390/320 px layouts, larger text, accessibility-rule checks, export/import/reset, corrupt originals, denied storage, stale tabs and the Classic return route.

```sh
npm run check
npm test
npm run curriculum -- --check
npm run build
npm run test:e2e
```

Browser results are generated at `test-results/acceptance.json`. Screenshots under `output/asterfall/illustrated-*` are exercised application views. Automated checks establish behavior in those states; they do not establish novice engagement, real-device usability or human screen-reader performance.

Original opening-release acceptance on 13 September 2026: **92/92 unit/content tests and 33/33 production-browser scenarios passed**, with no skipped, unexpected or flaky browser results in that release's final run. The browser total comprises five illustrated-chapter scenarios and six existing Classic scenarios on each of Chromium, Firefox and WebKit. TypeScript, curriculum consistency and production build checks passed. The independent review reported no remaining actionable finding in its bounded recheck. Continuation changes and their additional checks are recorded in [BRASS_QUARTER.md](BRASS_QUARTER.md).

Earlier development checks found a low-contrast caption, missing accessible names when mobile navigation labels were hidden, and accidental card deselection after a failed placement. Those were corrected before the passing run. The archived Classic runtime, content and existing tests were not edited.

The first Linux CI run additionally exposed a result-scope caption with contrast 4.41:1 against its background. Its text color was darkened, and the browser check now scrolls the result region into view before scanning it so offscreen clipping cannot hide the caption from that check.

## Continuing the story

The Brass Quarter keeps the characters and short objectives while varying the activity: moving people into hearing seats, arranging relief or confirming a written account, and assembling a promise from graphical tiles. The next archive lead is narrative only; no third illustrated chapter is claimed. The rejected network-builder direction remains separate.
