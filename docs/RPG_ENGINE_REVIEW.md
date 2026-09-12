# Asterfall content, engine and save review

Review date: 2026-09-12. Working branch: `feat/asterfall-rpg`.

## Scope and status

Worker 1 authored `src/rpg/quests-one.ts`, checked its contract against the
production campaign, and independently read `quests-two.ts`, `engine.ts` and
`persistence.ts`. `types.ts`, `campaign.ts`, `world.ts`, `validation.ts`, the
curriculum identifiers and relevant `App.tsx` callers were also inspected.
This is a code and scenario review. The author did not independently assess
the educational effectiveness of their own q01–q12 material with learners.

The new engine and persistence tests use the actual 24-quest campaign. The
final reconciliation run has **76 passing tests and zero failures**. All 24
engine tests and all 31 persistence tests pass. Worker 1 reported the defects
below without changing the runtime files; the prime agent corrected them and
reran the affected and full suites.

## Content and continuity

The first half contains 12 quests across acts 1–3, 24 required story decisions,
one conditional decision, 75 choices, 12 persistent artifacts and 10 puzzles.
The q02/q03 parallel route joins at q04; subsequent quests use their immediate
predecessor. Earlier artifact references use quest IDs, not invented artifact
references. Strongest choices occupy positions one, two and three 8, 8 and 9
times respectively. Every choice includes a response, contextual feedback and
a cost or limitation.

The six shared decisions set a value on every option: `voices`, `alarm-target`,
`topology`, `storm-risk`, `baseline` and `integration`. The q04 additional
field-account decision is visible only after `voices=none`. Static artifacts
retain case evidence and link to the player's decisions; they do not silently
record an unchosen option as an accomplished repair.

The balanced q04 target is a perceivable warning at every inhabited quay within
90 seconds of the authenticated storm order, during a 40-knot west squall with
one inter-island link unavailable. The fast alternative promises only the
central quay within 30 seconds. The later q14, q16 and q21 passages distinguish
these targets from a component receipt trial and from residents' complete
response. A passing component test therefore does not overwrite the original
target's population, endpoints or conditions.

The q12 offline trace establishes that Lower Quay is classified as auxiliary
and filtered before the core's delivery queue. Its green tally counts only
admitted destinations. Sera's preserved notes show an attempted correction.
The later content continues that mechanism through measurement, validation,
maintenance, recovery of her recording, live confirmation of her whereabouts,
change and retirement. It preserves the distinction between evidence of
exclusion and an unsupported claim of deliberate sabotage.

The q01 speaker is Pip. Sera appears there through a recorded voice, so
completing the opening quest does not add the still-missing mentor to the
UI's speaker-derived travelling party. Her confirmed live return remains in
the later story. The q01 scene uses “you” rather than hardcoding the player's
default name.

The later governance alternatives deliberately have context-dependent merits.
Tests choose the nearest available quality when a decision does not offer
all three quality labels; they do not require an artificial weak option or
claim one governance form is universally strongest.

## Puzzle evidence

Select puzzles check the expected evidence set; match puzzles check all named
relationships without relying on object-key order; order puzzles use explicit
case gates rather than a universal lifecycle sequence. The three trade puzzles
use positive weights and higher-is-better benefit columns.

| Quest | Calculated totals | Unique declared winner |
| --- | --- | --- |
| q08 | Copper 75; Glass 73; Reed 80; Runner 75 | Reed |
| q18 | Standard spares 20; independent unit 22; shore crew 19 | Independent unit |
| q22 | Extend yard 26; broad expansion 19; modular pilot 27 | Modular pilot |

The q08 uncertainty case also recalculates Reed's total as 70 if its reach
benefit falls from 8 to 6, with a tie at reach 7. Its nominal preference is
separate from mandatory compatibility and storm-service evidence.

## Findings and regression tests

| Finding | Observable failure | Status |
| --- | --- | --- |
| Runtime accepted malformed puzzle responses | An unknown item or wrong response shape could enter a `Save` that the importer rejected on reload. | Prime added a shared answer-shape check. The engine regression and valid incomplete-answer tests now pass. |
| Active quest accepted inherited property names | A fresh save with `activeQuestId="toString"` passed a truthy lookup on the history object's prototype despite having no recorded quest. | Closed. Import now requires an own quest-history property with `Object.hasOwn`; the regression passes. |
| Guided assistance could precede its conversation | A fresh q01 record with `assisted=true`, `attempts=2` and `puzzleAnswer=null` passed import, although no engine action can create that combination. | Closed. Assisted imports require a puzzle, at least two attempts, a stored result and a passing guided result; the regression passes. |
| Failed answer could have zero failed attempts | A q01 bench record with an incorrect empty answer and `attempts=0` passed import even though submitting that answer increments attempts. | Closed. A stored unsuccessful answer now requires at least one recorded failed attempt; the regression passes. |

The regression test names retained for these cases are:

- `active quest must be an owned history entry, including prototype-like names`
- `guided assistance cannot appear before the conversation or without a submitted answer`
- `an incorrect submitted response must have at least one recorded failed attempt`

The runtime-input issue was an API-boundary defect; normal UI controls already
restricted selectable items and categories. The import findings concerned the
consistency of untrusted save data. Their corrections are validated by the
focused persistence suite and the full suite.

## Functional coverage

`tests/rpg-engine.test.ts` exercises onboarding, both sides of the q02/q03 join,
conversation order, choice membership, all 24 quests under strong-, mixed- and
weak-preference policies, all three epilogues, and all seven authored conditional
branches. It checks historical flag scope, all puzzle types, exact trade totals,
failed attempts, guided work, retry state restoration, bounded attempts,
training and input/content immutability. Repeated completion and revisiting a
completed quest cannot earn another reward or rewrite the completed choices.

`tests/rpg-persistence.test.ts` replays exported saves after every choice and
completion along three full campaigns. It covers partial conversations,
incomplete and incorrect puzzle answers, assistance, retries, training and
canonical quest/decision ordering. Targeted hub and partial-baseline histories
also exercise q18 and q23 branches absent from the three preference routes.
Invalid JSON, unsupported versions, missing
prerequisites, hidden or skipped decisions, unsupported fields, fabricated
derived state, malformed answers and excessive training are rejected. The
byte limit is tested with multibyte text rather than treating characters as
bytes.

Storage-port tests verify that missing saves do not cause writes, corrupt or
future saves retain their original bytes, read/write failures return an
exportable in-memory state, and only the deployment's selected key is touched.
An observed newer save or deleted stored snapshot prevents a stale tab from
overwriting it. Loading the current stored version permits a later write.

The storage comparison is a check before `setItem`, not an atomic transaction
across simultaneous browser tabs. These tests establish rejection of a stale
observed snapshot, not a cross-tab linearizability guarantee. The separate
browser acceptance matrix covers rendered keyboard paths, storage events and
two-tab conflict behavior. Physical-device use, human screen-reader sessions
and truly simultaneous writes remain outside the automated evidence. The
scenario tests establish playable and internally consistent content, not
measured learning outcomes or standards certification.

## Reproduction commands

```sh
node --experimental-strip-types --test tests/rpg-engine.test.ts tests/rpg-persistence.test.ts
npm test
npm run check
```

The pre-existing full suite passed 21/21 before these two test files were added.
The final reconciliation run reports 76 tests, 76 pass, with no skipped or
cancelled tests. The focused persistence suite reports 31/31 passing, and the
engine suite reports 24/24 passing. `npm run check` returns exit 0.
The production content validator returned no errors for 24 quests, 55 decisions,
seven conditional branches and 19 puzzles.

The normal TypeScript check covers the application's configured sources. The
Node test files execute through Node 22's TypeScript stripping support rather
than the application's `tsc --noEmit` project. The reported engine/import
findings are closed; browser behavior and accessibility evidence are recorded
separately in `RPG_ACCEPTANCE.md`.
