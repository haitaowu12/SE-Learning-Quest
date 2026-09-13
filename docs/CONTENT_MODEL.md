# Authoring a quest

Read `src/rpg/types.ts` and an adjacent shipped quest first. Content changes belong in the quest data; engine changes should add reusable behavior rather than title-specific exceptions.

A quest identifies its act, location, speaker, prerequisites and core objective. Its `brief` presents the immediate story situation. `processes` and `concepts` connect to the field guide. `revisits` names earlier **quest IDs**, so the UI can bring their earned artifacts back into view. Its `artifact` describes the evidence structure; the ledger adds the player’s actual decisions and bench result. A reward is a named keepsake plus its story significance.

## Dialogue

Each decision supplies enough context to evaluate its alternatives. Choices need a character reply, an explanation of the reasoning, a trade-off and bounded narrative effects. `strong` means well-supported by the stated case; `mixed` means a defensible alternative with conditions or limits; `weak` identifies a concrete gap. Do not make every decision an obvious virtue-versus-carelessness choice or declare a governance form universally best.

Choices may set one named flag. Later `echoes` reveal narrative consequences, and `when: { flag, value }` introduces a playable conditional decision. Conditions must reference a reachable earlier choice. Avoid unnecessary flags when an ordinary recorded choice is sufficient.

The completion paragraph must remain true across every reachable alternative. Do not claim that all interfaces passed, every resident was represented, or a hazard was closed solely because the quest is sealed. A solved bench exercise demonstrates its own stated case; it does not silently repair all earlier decisions.

## Bench mechanics

| Kind | Response/solution | Authoring obligation |
| --- | --- | --- |
| `select` | Array of selected item IDs | State how many or which evidence criteria apply; justify inclusion/exclusion from the scene |
| `match` | Object mapping each item ID to a category ID | Use discriminating evidence and categories, not arbitrary labels |
| `order` | Array of all item IDs in order | State dependencies that make the required order meaningful; do not reject equally valid unstated orders |
| `trade` | Single winning item ID in an array | Provide numeric benefit scores, positive weights, scale and assumptions; explain sensitivity and ensure a unique optimum |

Every puzzle has a hint, failure feedback and a successful worked explanation. `trade` scores are higher-is-better benefits; convert costs to an explained benefit scale instead of multiplying raw costs as if high cost were desirable. The calculator is available to the player; arithmetic is not the learning goal.

Keep puzzles untimed and keyboard-operable. The walkthrough after two unsuccessful workbench submissions is an intended learning route. Reconsidering dialogue does not count as a failed submission. Guided work earns less bench XP but unlocks the same journey.

## Field guide and process mapping

Use a process ID only where a player makes or evaluates a relevant action, sees its consequences, or produces meaningful evidence. Linking an unused glossary term is not curriculum coverage. For broader topics, explain the chosen introductory boundary and what remains outside it. Recurring artifacts should make an earlier decision useful or contestable in a later stage.

`src/rpg/curriculum.ts` contains original definitions, examples and source entry points. Do not paste standard clauses, handbook passages, protected diagrams or answer-key material from a licensed source into public content. A licensed reviewer can validate original explanations without copying the source into the repository. Public metadata alone is insufficient for an exhaustive normative/handbook coverage claim.

## Validation and compatibility

Run `npm test`, `npm run build` and the affected browser journeys. `validateRpgContent()` checks IDs, prerequisites, branches, acts, process/topic coverage and puzzle contracts. Independent review still checks the educational reasoning.

Generate the traceability document with `npm run curriculum`; CI uses `npm run curriculum -- --check` to reject drift. A changed answer key, prerequisite, flag or decision ID can invalidate a previous save. Before changing shipped content, decide whether to preserve compatibility or introduce a new `contentVersion` with an explicit tested migration. Do not silently reinterpret old choices.
