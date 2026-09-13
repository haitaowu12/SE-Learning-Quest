# Asterfall: a visual-first direction

13 September 2026. Design exploration following the owner's playtest: too much reading, too little graphical interaction for people new to systems engineering. Engagement improvements below are hypotheses, not observed learner outcomes.

## Preserve the first campaign

The released story campaign is **Asterfall Classic 1.1.0**, tagged at `93891497a298459c0ab395a6c910b998dbf19cd1`. PR #1 is merged; no older merge work remains. The [release](https://github.com/haitaowu12/SE-Learning-Quest/releases/tag/v1.1.0) contains a static-site archive, a manifest identifying every static file, and SHA-256 checksums. The tagged source remains available through GitHub.

Static ZIP SHA-256: `67cc984d8cbd6b2368bc1ec6de6483b6dc9108150236e277a91c0c7d53e9866a`. The release was rebuilt and checked against the public HTML and five built JS/CSS assets, followed by a fresh live opening quest, reload/export and legacy return check. This supplements the previous 81 unit/content tests and 18 production-browser scenarios.

Exploration takes place on `design/asterfall-visual-play`. The existing application, deployment workflow, campaign and saves are unchanged. A separately authored experiment is in [`experiments/signal-lab/index.html`](../../experiments/signal-lab/index.html). It opens directly in a browser and does not access storage or fetch runtime dependencies.

## What is making the current version feel like reading

The current scene assembles the quest brief, objective, decision context, three sentence-length options, the chosen reply, explanation and trade-off, then a Continue control. Every quest has two unconditional dialogue decisions before its workbench; the campaign has 48 such decisions plus seven conditional decisions. Nineteen quests have a workbench. The map selects quests and regions; its graphics do not express the installed warning network or the consequences of a design change.

A reproducible count of q01's core source fields gives **191 whitespace-delimited words at the first decision** and **412 words along the strong-choice route before the workbench**. This excludes onboarding, navigation, sidebars, buttons, echoes and puzzle text; it counts the repeated quest introduction only once. It measures presented text, not how many words someone reads or how long they take. See `src/rpg/quests-one.ts` and `src/rpg/App.tsx`.

The current indicators are authored narrative deltas. A trust increase or explanation tells a player a decision mattered, while the visible world remains largely the same. The new design should let players produce and inspect consequences: a signal stops, a queue grows, a crew continues working, a spare restores service, or a changed component invalidates a previous result.

## Three directions worth considering

| Direction | Principal actions | What it offers this project | Principal risk |
| --- | --- | --- | --- |
| **Living network builder** | Place, connect, configure, run, break, repair | A persistent world that makes system relationships and consequences visible; supports architecture, integration, use and operations | Becoming only a wiring or throughput game, with people reduced to counters |
| **Field investigation adventure** | Explore a scene, observe a shift, interview briefly, collect and connect evidence | Gives stakeholder needs, hidden boundaries and conflicting accounts a physical setting; preserves the existing characters and mystery | Replacing long dialogue with arbitrary hotspots and another scripted sequence |
| **Component workshop puzzler** | Assemble modules, reconcile ports and signals, test designs, compare trade-offs | Gives immediate manipulation and repeatable experiments; can expose interface failures and several valid solutions | Overemphasizing hardware and neglecting organizational, operational and human dimensions |

**Recommendation:** a mission-based systems adventure with the living network as its main board, short field investigations to discover constraints, and workshop views only when a component needs attention. Keep one evolving world and a small set of reusable actions. Avoid making 24 unrelated minigames or starting with an open-world production scope.

The core loop is:

**Notice a problem → inspect people and dependencies → change the system → run a test → observe consequences → decide what evidence or change is needed next.**

Give the player agency through construction, investigation, prediction and trade-offs. The game can then name the engineering idea after the player has used it. Story advances through changed places, objects and short character exchanges; deeper explanations remain in an optional notebook.

## Patterns borrowed from public examples

These are design references, not proposed code or asset imports, and they do not prove this game will engage beginners.

| Primary reference | Observed pattern | Proposed adaptation |
| --- | --- | --- |
| [Mini Metro, developer description](https://dinopoloclub.com/games/mini-metro/) | Draw connections, observe moving traffic, and revise a network under limited resources and changing demand | Let players alter a visible service and inspect flows; use paused, untimed experiments during onboarding |
| [LOOPY, creator's project](https://ncase.me/loopy/) | Sketch a system and perturb its behavior interactively | Make the question “what happens if this changes?” an action on the board; use a model suited to the mission rather than treating causal-loop diagrams as physical network physics |
| [PhET research: Podolefsky, Moore and Perkins, 2014 revision](https://arxiv.org/abs/1306.6544v3) | A framework using affordances, constraints, cues and feedback to support exploration; illustrated through simulation design and interview evidence | Start with a few tools and a visible gap; let the interface guide the first experiment without a terminology lesson. This is a design rationale, not evidence about Asterfall's learners |
| [Bret Victor, Explorable Explanations](https://worrydream.com/ExplorableExplanations/) | Manipulable examples, consequences that update, and contextual information | Put explanations beside the observed result and offer deeper detail when a player needs it |
| [W3C, Understanding Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) | Dragging functionality needs a non-drag single-pointer alternative; keyboard equivalence is a separate consideration | Support tap-source/tap-destination and keyboard actions as first-class controls. A later drag gesture can be an additional convenience |

## Make graphics carry the reasoning

Use a bright illustrated archipelago with readable islands, workshops, docks and crews. Signals, people, weather and equipment should each have distinct visual roles. The art should show states that a player can distinguish while acting: a device receives a packet; a warning is presented; a person perceives it; an assigned action begins. Those are different events.

Pip can point to a stopped signal or demonstrate one move on request. Sera's account can be discovered through a physical ledger, a recording and changed infrastructure rather than several screens of exposition. Character art can convey a role or task without relying on portraits as the only graphical change.

Use paired visual and textual cues for states: a broken cable has a visible gap/cross and a label; an untested design has a pending badge; a crew that missed the warning remains at its work station. Animation explains movement and causality. Essential evidence remains readable with motion disabled. Sound is optional reinforcement, never the only warning channel for the player.

### A reusable mechanic vocabulary

| Mechanic | Concrete player action and visible consequence | Engineering reasoning |
| --- | --- | --- |
| Follow one warning | Click a real event and inspect the transmitter, each hop, local cue and crew response | Mission, boundaries, interfaces; a successful part can coexist with a failed outcome |
| Visit an overlooked quay | Observe night work, hearing protection or an inaccessible route; attach that observation to a need | Stakeholders and human factors; records do not replace field evidence |
| Assemble and reconcile | Connect devices, match actual port meanings, set timing or message handling, then run the combination | Architecture, design, implementation and integration |
| Try two builds | Run both against the same declared conditions; compare coverage, support effort and resource use | Trade-offs, analysis, uncertainty and decision management; several designs can meet the goal |
| Introduce a specific fault | Remove a link, shared feed or responder and inspect which services fail | Risk and resilience; extra components may share a common dependency |
| Plan the watch | Assign qualified people, scarce tools and service windows on a visual board; overlapping duties expose gaps | Planning, human resources, infrastructure, operations and organizational capacity |
| Release a changed configuration | Prepare a candidate, inspect a before/after view, test affected behavior, stage the cutover and retain rollback | Configuration management, verification, transition and evidence applicability |
| Repair and eventually retire | Restore service, test the repair, trace old dependencies, isolate equipment and obtain custody acceptance | Maintenance, disposal, supply and lifecycle obligations |
| Govern a shared service | Allocate duties/resources and choose a review arrangement; residents and operating organizations can challenge unowned outcomes | Agreement, portfolio, ethics and governance; institutional form has contextual trade-offs |

The final two mechanics should not become a row of “good governance” answer buttons. Their challenge is making commitments work with actual capacity, ownership and exceptions. Some policy judgments still need a short explanation and cannot be reduced to a single visual score.

## The first five minutes: design target

These times are targets for a formative playtest, not measured completion times.

**First 20 seconds:** place the player on a partly connected island board. “Send a warning. Then connect all three quay receivers.” Pressing Send lights one receiver; the other two remain waiting. No character creation, glossary or lengthy briefing is required first.

**20–90 seconds:** build a route by tapping two locations, run it, and see the signal reach the remaining devices. Several topologies work. Removing a cable and Undo are available from the beginning.

**90–180 seconds:** meet the crew. Lower Quay's workshop uses hearing protection. The board can show three receiving devices but only two responding crews. Fit a visible cue, run again and observe the third crew respond. Name the distinction between delivery evidence and useful operation after this experience.

**180–300 seconds:** cut the named northern cable. Reroute or use another design, then test both calm and cut-cable conditions. Changing the layout clears its current test badges. Finishing requires two observations for the same layout; it does not claim survival of every fault.

The study implements this sequence. It intentionally models only reachability, the stated cue and the named fault. Full simulation of timing, evacuation, environmental propagation, safety or a complete lifecycle is outside this experiment. This prevents the picture from suggesting an engineering guarantee that the model cannot establish.

## What the playable study proves and leaves open

The study has a computed connectivity model, building/removal, a parts budget, selectable warning beacons, animated signals, response states, reversible changes and condition-bound evidence. It is not a movie or a prescribed click-through: alternate valid topologies can succeed. The models are deterministic, so changing the design has a reproducible effect.

The direct-file browser harness checks model outcomes, a complete three-experiment UI journey, keyboard connection controls, budget rejection, editing/undo invalidation, narrow layouts, accessibility rules, animation cancellation and reset. It blocks network calls and browser storage to check independence from Classic and hosted services. Results and source digest are generated in `.release-check/signal-lab/acceptance.json` by:

```sh
node experiments/signal-lab/acceptance.mjs
```

Observed on 13 September 2026: **Chromium, Firefox and WebKit each passed all eight recorded check groups with no recorded errors**. The checked HTML's SHA-256 is `5e5ade1acad1975dedd86f63602d4156a514e79ca731f248d5cf6217f023366c`. The first-action control is in the top toolbar, and the concise current goal stays above the board. The animation check observes a visible signal after page load and verifies cancellation when the layout changes.

A separate read-only design reviewer found no additional actionable prototype defect after those interaction corrections. The reviewer recommended preserving visible causal evidence and varying the full successor's activities through incident diagnosis and workshop modes, with novice prediction and transfer checks. That review is not a learner study.

Those checks establish implemented behavior in the exercised browser states. They do not establish engagement, novice comprehension, human assistive-technology usability or learning transfer. SVG drawings are functional placeholders for art direction, not a finished character/sprite library.

## Beginner-experience acceptance proposal

Before scaling the campaign, run a small formative session with five people new to systems engineering. Use an unseen second layout for transfer and retain the mistakes, moderator interventions and abandonment points. Five people provide design feedback, not an efficacy estimate.

| Proposed criterion | How to observe it |
| --- | --- |
| First meaningful action within 30 seconds for at least 4 of 5 players | Time the first test run or system edit, not the first Next click; record any prompting |
| At least 4 of 5 complete the first three challenges within 8 minutes without a moderator explaining controls | Count hint use separately from moderator intervention; identify where players stop |
| At least 4 of 5 distinguish message receipt from a crew responding | Ask them to explain the observed mismatch in their own words before displaying the concept explanation |
| At least 3 of 5 adapt to a new layout/changed cue without copying the first solution | Observe actions and reasoning in an unseen scenario; do not reuse the same answer arrangement |
| More experimenting than advancing dialogue | Record time spent changing/observing the system and time in required prose; target at least 60% of active mission time in the former |
| Short mandatory instructions | Keep each opening objective card at 45 words or fewer; expand detail through requested hints, inspections and the notebook |
| Functional access | All essential actions work with keyboard and tap-only input, and evidence remains available without color discrimination or animation |

Also record whether anyone voluntarily tries another design. Enjoyment ratings alone will not explain whether the mechanic is readable or teaches the intended distinction. Compare the old and new openings with counterbalanced order or separate equivalent scenarios when comparing interaction friction; avoid treating a practiced second attempt as a design improvement.

## Build sequence and reuse boundary

First evaluate this interaction study and choose the core loop. Next make **one finished island mission**, targeting 10–15 minutes of play, with a field visit, a build/test challenge, one actual trade-off and a small operational handover. This is a content duration target, not a development estimate. Use original character/environment art and state animations there, then test with beginners before producing the remaining regions.

After that gate, expand into six connected world missions. Do not mechanically turn each of the current 24 text quests into another graphical quiz. Keep the 30-process/18-concept map as a curriculum planning tool, with traceability to demonstrated actions, observations and later assessments. Depth and repeated application matter more than putting every label in the first session. The current complete catalog remains available in Classic.

Reuse the setting, characters, evidence distinctions, source register, meaningful cases, browser acceptance patterns and pure-state discipline. Create a separate simulation state and outcome evaluator. A successful build should be judged against declared outcomes, not the old `strong/mixed/weak` option labels or a fixed sequence of clicks. Resource and human-response models must state their simplifying assumptions.

Keep `src/rpg/` and its save contract stable during exploration. A future combined release can expose Classic at `#classic` on the same pathname so the current path-scoped save key remains usable; the new campaign gets its own identifier and storage key. Preserve `#episodes`. That routing is a proposal, not implemented by this branch. No automatic conversion of Classic choices into simulation competence or new-campaign progress is justified.

**Decision proposed:** retain Asterfall's story as motivation and use a visible, manipulable service as the main game. Validate a short mission before commissioning the full campaign or expanding the simulation engine.
