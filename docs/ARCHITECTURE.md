# Runtime architecture

## Static application

Vite emits an HTML entry point and relative JavaScript/CSS assets into `dist/`. The default route lazily loads the Asterfall React application. `#episodes` lazily loads the two existing educational episodes and their Phaser shell. Asterfall does not load Phaser or the earlier episodes’ image assets during its normal journey. No runtime request to a third-party service is needed to play.

The public reference links open only when a player follows them. Downloading an export creates a local browser Blob; importing reads a local user-selected file. The preview server in `scripts/` is for development and automated acceptance, not part of production deployment.

## Content and transitions

`Quest` data holds the story and educational material. The engine does not embed individual quest answer keys or title-specific transitions. The campaign array is in topological order; prerequisites determine which quests are open. q02 and q03 can be completed in either order after q01, and q04 waits for both. Later quests form a connected chain.

`storyDecisions()` resolves each conditional beat from choices that occurred earlier in canonical story order. Flags produced later cannot rewrite a past conversation. `choose()` accepts only the currently visible unanswered decision. Completing a quest requires its visible conversation and, where present, its successful bench evidence.

The UI displays the reply, pedagogical explanation, context-dependent trade-off and metric effects before continuing. Failed puzzle responses retain their feedback; after two recorded failed/reconsidered attempts, Pip’s walkthrough offers a guided solution. A quest can be reconsidered before it is sealed. Sealed outcomes remain fixed for that expedition; a new expedition explores alternative histories.

## Deterministic progression

The save stores choices and evidence, not trusted XP, level, inventory, flags or unlocks. `derive()` replays records to calculate those values. Applying completion again returns the same state, and retry removes the active unsealed quest’s prior effects. There is no clock or random number in gameplay state.

Each sealed quest earns 100 XP plus 25/15/5 XP for each strong/context-dependent/weak decision, respectively. A bench earns 40 XP for an independent solution or 20 for a guided solution. Failed attempts do not deduct XP. Every 400 XP increases level; every second level grants a training point. One point adds two to a chosen competency; a competency of three unlocks additional quest insight. Hints and recovery remain available without those insights.

The trust, resilience and supplies meters are bounded narrative indicators, not probabilities, real-world project estimates or spendable currencies. They show consequences without preventing a low-scoring player from finishing. Narrative flags create additional consequences through echoes and conditional dialogue. Ending families use the mean of 1.0/0.6/0.1 for strong/context-dependent/weak choices; thresholds are 0.8 and 0.45. Governance, support and retirement decisions add specific ending text. These values are pedagogical game rules, not a validated competence assessment.

## Persistence and recovery

The v1 save contains the campaign/content versions, player, onboarding status, active quest, quest records, trained competencies and reading settings. Its key is scoped to the game and deployment path, preventing collisions with other projects on the same GitHub Pages origin.

Import enforces a 500 KB limit, exact known fields, readable bounded names, valid enum values, known quest/decision/item identifiers, prerequisite order, reachable conditions, valid bench response shapes, earned training-point limits and evidence sufficient for each completion. It reconstructs a canonical save in story order. Imported strings are rendered through React text, never HTML injection. Unsupported versions are rejected with the original retained; this release does not invent a migration for a schema that has never shipped. Add an explicit migration and fixtures before changing a shipped content/save contract.

Automatic writes compare the stored raw value with the last observed value. Another tab’s update or a browser storage exception pauses automatic writes and tells the player to export or load the stored copy. A malformed save is not auto-reset. Reset/import are explicit replacement operations with confirmation. This is conflict detection for a local game, not distributed synchronization; simultaneous writes in the same instant are outside the guarantee of a non-transactional `localStorage` store.

## Presentation and accessibility

All controls are native DOM elements. The artwork is decorative SVG/CSS and never the only way to locate a quest. Mobile replaces island overlay buttons with a labelled region grid. Native dialogs provide focus containment and Escape cancellation. Scene navigation focuses the main heading, skip navigation targets the adventure, feedback is readable alongside its consequence, and the UI has no countdowns or reflex-dependent interactions.

Text scaling uses relative units and collapses layouts as text grows. System and user reduced-motion preferences disable the decorative cloud movement. Browser tests inspect keyboard operation, axe findings and layout at narrow widths and 200% application text size. These are not a substitute for human screen-reader, actual device or browser-zoom observations.

## Extending safely

A later campaign can reuse the typed quest, decision, puzzle and derived-state patterns. It needs a separate campaign identifier/storage namespace, its own ordered content/catalog, a defined progression policy, and evidence of save compatibility. The current entry point intentionally assembles one complete campaign rather than exposing an unimplemented campaign selector. Split substantial new UI features into components instead of growing the existing screen module indefinitely.

Content integrity, pure transition tests, save replay tests and browser playthroughs cover different failure modes. Keep all four. A passing identifier map does not demonstrate correct or sufficient teaching; curriculum changes also require a review of actual scenario evidence, conclusions and trade-offs.
