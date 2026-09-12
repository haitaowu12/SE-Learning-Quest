# Asterfall curriculum review

Review date: 12 September 2026. Branch: `feat/asterfall-rpg`. Working-tree review; the base commit `865efe94cab5462925e799fd5bd4aadf909186cd` alone does not identify the uncommitted RPG content.

## Finding and review scope

The combined campaign contains all **30 declared process areas and 18 supporting concepts**. Each process occurs in at least one quest's primary `processes` field; no declared concept is left without a gameplay mapping. The reviewed scenarios generally require a decision about supplied evidence, resources, interfaces or affected people. Four semantic findings were sent to the implementing agent for correction, recorded below. Topic presence is established; exhaustive coverage of a standard, instructional effectiveness and learner competence are not established by these checks.

**Independence:** worker-2 authored q13–q24 before this assignment. Independent review in this document applies to **q01–q12, the catalog, engine and UI**, which this reviewer did not author. Findings about q13–q24 are explicitly **author self-review**, including comparisons involving those quests. This is not an independent review of the entire campaign or an external subject-matter sign-off.

The assignment was read-only for application and test files. Only this document and [`RPG_SOURCES.md`](RPG_SOURCES.md) were created. Implementation findings were communicated to prime for changes in the owned source files.

The reviewer read all content in [`quests-one.ts`](../src/rpg/quests-one.ts), [`quests-two.ts`](../src/rpg/quests-two.ts), [`curriculum.ts`](../src/rpg/curriculum.ts), [`engine.ts`](../src/rpg/engine.ts), [`App.tsx`](../src/rpg/App.tsx), [`validation.ts`](../src/rpg/validation.ts), and the generated [`RPG_CURRICULUM.md`](RPG_CURRICULUM.md); the `Quest` contract, campaign assembly and content tests were also inspected. The review checked dialogue premises, options, feedback, tradeoffs, artifact wording, puzzle evidence and solutions, prerequisites, revisits, conditional flags and the learning flow. UI findings below are source inspection, not a new browser, accessibility or learner study.

Public source identity, conceptual checks and licensing limits are recorded in [RPG_SOURCES.md](RPG_SOURCES.md). Full ISO and INCOSE licensed texts were not reviewed. The counts below refer to the game's declared catalog, not a verified clause-by-clause task inventory.

## Semantic findings sent to the implementing agent

| ID | Scope and source | Observed problem | Required correction and acceptance condition | Disposition at initial review |
| --- | --- | --- | --- | --- |
| CR-01 | Independent: q05 conclusion, `quests-one.ts` | The unconditional conclusion says the schedule now fits the yard even when the overtime choice retains resource conflicts and missing infrastructure. | The conclusion must preserve the unresolved plan and readiness state on that path, or be conditional on a choice that resolves it. | Reported to prime; source correction to be verified. |
| CR-02 | Author self-review: q13 timing context, `quests-two.ts` | The common context claims sixty timely receipts inside four minutes, while the inherited rushed-integration challenge says comparable timing is unavailable. | Identify the numerical data as a separate instrumented reference drill or keep rushed-trial timing unknown. The four-minute observation must not replace q04's warning requirement. | Reported to prime; source correction to be verified. |
| CR-03 | Author self-review: q17 alarm-policy decision, `quests-two.ts` | The decisive reason not to mute a channel—other instruments cannot observe the same landing—was supplied only in feedback after selection. | Put that coverage limitation into the decision context before the player chooses. Feedback should apply stated evidence rather than introduce the fact that makes an answer wrong. | Reported to prime; source correction to be verified. |
| CR-04 | Independent: q03 delivery cycle versus catalog `life-cycle-model` | q03 practices selection of this project's cycle; the catalog also promises organizational maintenance and improvement of common models. That organizational action was not explicit. | Name an owner for the reusable guild model, its applicability, and how trial evidence informs review or revision. Preserve the distinction between a common model and a tailored project plan. | Reported to prime; source correction to be verified. |

These are teaching-consistency findings, not findings that the executable campaign is blocked. They matter because players should not receive an achieved outcome after declining the work needed to achieve it, or be judged against hidden case evidence.

### Correction verification

Prime corrected all four findings after the initial review. The reviewer re-inspected the changed passages and reran the content and engine suites.

| Finding | Verified correction |
| --- | --- |
| CR-01 | q05 now records the yard plan with its resource conflicts, reservations and readiness limits still visible instead of asserting that every selected schedule fits the yard. |
| CR-02 | q13 identifies the four-minute result as a separate counting-house drill with a working common clock and explicitly says that its observation window does not replace q04's warning-time requirement. The inherited rushed-integration branch retains unknown timing for the earlier trial. |
| CR-03 | q17 now states before the alarm-policy choice that the uncertain channel is the only instrument observing one landing; feedback no longer introduces the fact that decides whether muting removes coverage. |
| CR-04 | q03 now names the workshop council as owner of the reusable guild life-cycle model, distinguishes this project's tailored approach, and sends trial, failure and gate evidence back to the storm-season model review for retention or revision. |

Post-correction SHA-256: `quests-one.ts` `03d5f2842d43f71188db913e8173354884ad4fd36dbf124a8ebb5a267b4ae4fa`; `quests-two.ts` `d0907ce18cb19049486a4f61b05e5eadbe1d91855c3c7ea951c8a6114ab1084b`. The other four snapshot files were unchanged by these corrections. After the edits, `tests/rpg-content.test.ts` passed 2/2 and `tests/rpg-engine.test.ts` passed 24/24.

## Coverage of the 30 process areas

The IDs and groupings below are those implemented in `curriculum.ts`. Quest references include both primary practice and later tagged reinforcement; each ID was separately checked for at least one **primary** occurrence. Evidence descriptions are original summaries of the game, not copied process definitions. An entry means introductory application in this case, not mastery of all activities in the corresponding process area.

| Group / process ID | Quest evidence | Substantive practice and depth boundary |
| --- | --- | --- |
| Agreement — `acquisition` | q06 | Choose the purchase basis, trial commitment and acceptance route across two makers. Specific negotiated roles are given; this is not a general procurement-law lesson. |
| Agreement — `supply` | q06, q23, q24 | Distinguish supplied unit evidence from keeper acceptance, resolve substitutions, and transfer support and retirement obligations. q23 introduces a limited return offer rather than inventing universal take-back duties. |
| Organizational — `life-cycle-model` | q03, q22, q24 | Select evidence cycles and live-service gates, then consider support and retirement. Organizational ownership and improvement of the common model required CR-04. |
| Organizational — `infrastructure` | q05, q22 | Provide the rig, isolation platform, access and support yard that make work possible; later weigh their continuing capacity against a new mission. |
| Organizational — `portfolio` | q03, q22 | Allocate eight maker-days across competing proposals; later compare shared support investment and a bounded water-system pilot. Project merit alone does not create capacity. |
| Organizational — `human-resource` | q05 | Resolve scarce qualified crew capacity and demonstrate restoration competence. This introduces capability provision through a project example; it does not cover a complete organizational workforce strategy. |
| Organizational — `quality-management` | q11 | Use observed build defects to improve the workshop's work and evidence rules. This is distinguished from independently evaluating their application in q14. |
| Organizational — `knowledge-management` | q19 | Preserve source, context and uncertainty; turn a lesson into a usable change in practice. An archive's existence alone is not treated as learning. |
| Technical management — `planning` | q05 | Build a resource- and dependency-feasible yard sequence, with access and weather conditions. The conclusion must not override a player's unresolved conflicts; see CR-01. |
| Technical management — `assessment-control` | q13 | Respond to coverage evidence with corrective work, revised resource allocation and review. CR-02 addresses conflicting timing claims. |
| Technical management — `decision-management` | q08 | Use agreed weights, separate mandatory conditions and test an uncertainty capable of reversing the preferred alternative. |
| Technical management — `risk` | q09, q15, q17, q24 | Identify cause, consequence, exposed people, control evidence, residual acceptance and stopping conditions; carry responsibilities into operations and handover. |
| Technical management — `configuration` | q10, q21, q23 | Identify the actual behavior-defining set, preserve the restore set, assess change impact, limit old evidence and identify retirement dependencies. |
| Technical management — `information` | q10, q19, q20 | Issue usable role-specific information linked to its authority; preserve provenance, uncertainty, access boundaries and current instructions. |
| Technical management — `measurement` | q13 | Choose a population and denominator that expose omitted recipients; distinguish counts, timing and reasons for a missed outcome. The exercise window is not an acceptance threshold. |
| Technical management — `quality-assurance` | q14 | Evaluate evidence scope, configuration identity and review competence. Independence without relevant competence, or signatures without applicable evidence, does not establish assurance. |
| Technical — `mission` | q01 | Trace a warning service's purpose beyond a green transmitter lamp to people who can act; bound the intervention and its external dependencies. |
| Technical — `stakeholder` | q02, q16 | Include affected crews and residents, preserve absent voices and disputed occupancy, then test needs with representative use. One visit is not declared a complete consultation. |
| Technical — `requirements` | q04, q21 | Define endpoints, timing, destinations and degraded conditions; link needs and planned evidence; authorize changed coverage without relabeling the old promise. |
| Technical — `architecture` | q07, q18 | Compare hub, mesh and retained local arrangements; expose common power and contact dependencies; assess changes against the selected arrangement. |
| Technical — `design` | q07 | Reconcile functions, allocations, pulse meanings, direction and units across connected views. This is an introductory design-consistency task, not a complete detailed engineering design. |
| Technical — `analysis` | q08 | Compare weighted benefits and sensitivity using supplied case estimates; distinguish numerical preference from acceptance. |
| Technical — `implementation` | q11 | Realize the decoder, retry behavior and maintainer display in bounded increments; reproduce defects and retain behavior evidence. |
| Technical — `integration` | q12 | Investigate combined message behavior, acknowledgements and the population filter. Individually passing parts can still exclude recipients or interact incorrectly. |
| Technical — `verification` | q14, q21 | Match evidence to the specified component card and configuration, without inheriting the full mission claim; revisit applicability after shared logic changes. |
| Technical — `transition` | q15 | Coordinate entry evidence, trained crews, fallback, cutover, observation and handover; retain deferred or emergency conditions as conditions. |
| Technical — `validation` | q16, q21 | Test whether users can interpret and act on a received warning in the available time; change the need and re-evaluate use when the original specification is insufficient. |
| Technical — `operation` | q17, q20 | Observe demand outcomes, workload and degraded service; coordinate independent operating organizations and authoritative messages. |
| Technical — `maintenance` | q18 | Choose restoration and root-cause work under access and staffing limits; plan spares, monitoring and bounded bypass removal. |
| Technical — `disposal` | q23 | Find remaining dependencies, control isolation and transfer custody of materials and records; distinguish retired equipment from a retained reserve. |

## Coverage of the 18 supporting concepts

These are a project-selected set of supporting topics, not a claimed exhaustive list from any publication. The display title `Human systems integration` maps to `human-factors`; `Reliability and availability` maps to `reliability`.

| Concept ID | Quests | What the player reasons about |
| --- | --- | --- |
| `systems-thinking` | q01, q13, q22, q24 | The difference between optimizing a component or included population and achieving the wider service purpose, including continuing stewardship. |
| `emergence` | q12 | Combined retry, identity and acknowledgement behavior that individual unit seals cannot establish. |
| `boundary` | q01, q13 | What the warning service owns and whom the measurement population silently omits. |
| `conops` | q02, q15, q16 | Who receives a warning during a shift, what it means, who acts, and how transition and actual use differ from a bench demonstration. |
| `traceability` | q04, q14, q19, q21 | Connect need, requirement, design allocation, evidence and change; retain evidence provenance instead of counting links as proof. |
| `interfaces` | q07, q18, q20 | Shared meanings, units, directions, failure dependencies, and boundaries between organizations that retain authority. |
| `mbse` | q07 | Use connected function, structure and interface relationships to expose contradictions. No modeling-language syntax proficiency or executable model is assessed. |
| `tailoring` | q03, q24 | Adapt delivery and handover effort to uncertainty, reversibility and consequences while retaining explicit obligations. |
| `agile` | q11, q21 | Deliver bounded increments, learn from behavior and revise evidence after change; uncontrolled edits to a live baseline do not count as agility. |
| `ethics` | q02, q16, q19, q20, q24 | Representation, exclusion, privacy, evidence-based accountability and allocation of lasting authority. Resource pressure explains decisions without erasing responsibility. |
| `human-factors` | q02, q15, q16, q17 | Perception, interpretation, ability to act, rehearsal, workload and alarm fatigue. The case introduces part of human systems integration; it is not a full specialty curriculum. |
| `safety` | q09, q14, q23 | Common-cause exposure, applicable failure evidence and dependency-aware retirement. Game scores are not hazard probabilities or a safety case. |
| `security` | q20 | Distinguish source authentication, freshness and authority; reject obsolete or over-authoritative cross-network instructions. No security certification or penetration test is represented. |
| `resilience` | q09, q18 | Survive the stated cause through independent fallback, detection and restoration; count dependencies rather than spare devices. |
| `reliability` | q17, q18 | Separate equipment uptime, service demands, automatic delivery and restoration support; a short observation does not establish lifetime performance. |
| `sustainability` | q22, q23, q24 | Account for continuing support, resource use, reuse limits, waste custody and who inherits obligations. No quantitative life-cycle assessment is supplied. |
| `systems-of-systems` | q20 | Agree interfaces among ferry, warning and gate organizations that keep their own missions and operating authority. |
| `uncertainty` | q08, q13, q14, q17, q19 | Distinguish unknown from failed, preserve limited evidence, avoid fabricated precision and obtain information that could change a decision. |

## Requirement continuity: q04 → q14 → q16 → q21

The following comparison uses the actual story wording and endpoints. The q13–q24 portions are author self-review.

| Quest | Claim or evidence being considered | Continuity judgment |
| --- | --- | --- |
| q04 | For the balanced target, an authenticated storm order must lead to a **perceivable warning at every inhabited quay within 90 seconds**, in the stated **40-knot west squall with one inter-island link unavailable**. The fast alternative promises a **central-quay warning within 30 seconds**. The vague alternative leaves a measurable threshold unresolved. | These are different selected promises. The inclusive evidence puzzle is explicitly a proposed claim reviewed regardless of the chosen target; solving it does not prove the claim or silently select that target. |
| q14 | A **candidate component test card** considers relay receipt within 30 seconds under rain and a lost path, with no duplicate evacuation command. It requires an approved allocation to q04. Configuration-specific records may support, contradict or remain insufficient for that component card. | Relay receipt is not local warning perception. Rain alone is not the 40-knot storm condition. The echoes explicitly preserve both the balanced and fast target's missing end-to-end evidence. The vague path requires its own clarification, not retrospective acceptance of an invented target. |
| q16 | A relay can meet the bounded receipt card while people cannot recognize its tone or reach the shelter in the remaining time. The exercise supplies a ten-minute interval from detection to impact, a thirty-second delivery delay and an eleven-minute route after receipt. | With the exercise's thirty-second delay, only **9.5 minutes** remain for the eleven-minute route: a **1.5-minute shortfall**. Receipt success therefore cannot establish the needed outcome. Even a perceivable signal does not establish comprehension or ability to act. The balanced-target echo says *even if* the original promise were verified; it does not assert that q14 verified it. |
| q21 | A recipient change, local indication and shared retry behavior affect the target, design and evidence applicability. The new candidate baseline needs assessed impact, authorization and affected regression/use evidence. | Preserve old results as historical evidence for the old set. Mark affected claims pending; do not inherit passing status merely by changing a file or label. Unchanged evidence can be reused only with a recorded applicability basis. The fast and vague paths must resolve their own scope rather than be rewritten as if they had selected the inclusive target. |

Two companion distinctions matter. First, q13's four-minute measurement window is a supplied observation window, **not** a relaxation of q04's 90-second or central 30-second promise. CR-02 was closed by identifying it as a separate counting-house drill with a working common clock while retaining the rushed integration trial's unknown timing. Second, verification and validation are not taught as processes that occur only once, at adjacent late stages: q01–q04 question needs and evidence early, q11–q12 exercise implementation and integration, and q21 reopens evidence after change. This interpretation is consistent with the public discussions in [SEBoK Verification](https://sebokwiki.org/wiki/System_Verification) and [SEBoK Validation](https://sebokwiki.org/wiki/System_Validation); those articles are not used here as substitutes for the full 2023 standard.

## Story, artifacts and learning mechanics

The first half builds a causal investigation: q01's transmitter success differs from shore action; q02 disputes the population roll; q04 fixes the promise's endpoints; q06 separates unit supply from combined acceptance; q07 exposes shared dependencies; q08 reveals a denominator assumption; q10 preserves the actual route table; q12 observes exclusion in the integrated behavior. The cost-saving filter is an explainable local optimization, not evidence by itself of malicious intent. Later recordings and decisions preserve that difference between impact, responsibility and intent.

Previously earned artifacts return through `revisits`, especially q04 in q14/q16/q21, q07 in q18, and q06/q10 in q23. Artifact text is a fixed case record; the journal additionally displays the choices, feedback and tradeoffs from the saved expedition. Reading the static artifact alone must not be mistaken for a dynamically approved operational record. Many artifacts make this limit explicit by retaining the selected decision and open evidence separately.

The player encounters two unconditional decisions in every quest, with three options each. Seven additional decisions appear only for relevant inherited gaps. These add playable work, not just cosmetic remarks. Weak decisions affect feedback and story indicators without permanently blocking access to the remaining curriculum. Resources are explicitly labeled story indicators in the UI, not engineering probabilities.

The engine resolves conditions in story order and takes echoes from preceding history. Learning entries unlock after tagged quests are complete. Puzzle hints and case feedback are available, with guided repair after two unsuccessful submissions; this lowers the puzzle experience bonus but still permits progression. Trade benches can display calculated totals. Consequently, completion is an opportunity for supported practice, not a controlled examination of unassisted performance.

The current ending calculation credits strong choices as 1, mixed as 0.6 and weak as 0.1, then uses the average and the recorded governance, support and retirement branches. The mixed-choice playthrough received the middle ending rather than the failure-like result reported before the correction. All three q24 governance options are mixed, with different institutional costs; selecting one is not presented as a universal engineering theorem. These authored weights and qualitative labels are game-design judgments, not measured educational or engineering outcome models.

The review found explicit feedback on plausible mixed choices: q06's trial lot preserves options but risks split-delivery delay; q09's authorized narrower trial retains accepted exposure; q18's interim replacement can restore service before root-cause improvement; q23's cold reserve retains maintenance obligations. These are more useful distinctions than treating every nonpreferred choice as reckless. There remains an untested risk that option length and references to evidence make preferred answers recognizable without understanding. A learner study would be needed to evaluate transfer and such answer cues; no effectiveness claim is made here.

## Executed checks and observed results

Read-only checks ran on 12 September 2026. No application, test, package or generated-map file was changed by this reviewer.

| Check | Observed result |
| --- | --- |
| `node --experimental-strip-types --test tests/rpg-content.test.ts` | Exit 0; two tests passed, zero failed. The suite includes deliberate malformed-content checks. |
| `node --experimental-strip-types --test tests/rpg-engine.test.ts` | Exit 0 on final recheck; 24 tests passed, zero failed. This includes full strong/mixed/weak campaign traversal, the seven conditional conversations, puzzle semantics, epilogue reachability, retry/reward behavior and runtime puzzle-input rejection. |
| Independent set/count audit against the requested ID lists | 24 quests; exactly 30 primary process IDs and 48 total catalog IDs; no missing or unknown declared coverage; 24 unique artifact IDs. |
| Decision and puzzle audit | 55 authored decisions: 48 unconditional and seven conditional; 165 choices. 19 puzzles: seven select, five match, four order and three trade. A single route need not display every conditional decision. |
| Weighted totals recomputed from case data | q08: Reed 80, Copper 75, Glass 73, Runner 75. q18: independent unit 22, standard spares 20, shore crew 19. q22: modular pilot 27, extended yard 26, broad expansion 19. Every stored solution is the unique maximum under its stated positive benefit weights. |
| Engine traversal using strong, mixed and weak choice preferences | All three runs completed all 24 quests and unlocked all 48 entries. They made 48, 50 and 53 decisions respectively. Expected ending tiers were observed for each. |
| Conditional challenge union across those traversals | All seven exercised: q04 missing field account; q13 rushed trial; q14 vague target; q16 missing participation; q18 hub isolation; q21 missing baseline; q23 unidentified retirement item. |
| Puzzle completion gates | Empty answers blocked completion, and canonical solutions passed, for all 19 puzzles in each traversal. This checks the curriculum's executable answer contract, not every malicious input or every possible wrong answer. |
| Content immutability observation | Serializing the quest data before and after the traversals produced the same value. |

The engine traversals used the live implementation and read-only assertions. They did not create test files or add persistence to the repository. A document audit also confirmed all 48 matrix rows match the current campaign's quest mappings, every relative Markdown link resolves, and all three required official reference URLs and the independence statement are present. The first two versions of that document-checking command counted prose references as matrix data; those checking-command errors were corrected by restricting the audit to the coverage sections and quest-reference column. They were not failing application tests or missing curriculum entries. Browser, accessibility, persistence and learner-effectiveness work remains separate unless explicitly cited here.

### Snapshot for the initial findings

SHA-256 values captured at `2026-09-12T08:16:30.170Z` identify the content on which the initial findings and count audit were made. Later edits require targeted re-review of the changed material; the final disposition section must state any recheck rather than silently replacing these historical identities.

| File under `src/rpg/` | SHA-256 |
| --- | --- |
| `quests-one.ts` | `3e9ea258a4753a8ffadcb04ae4020ef3fd68d48a603093a736572cbdfbab39b6` |
| `quests-two.ts` | `037739df3e9edcad81cd83b976ce0c483c9f949d487693b18018ba832da1d27c` |
| `curriculum.ts` | `73eacebe4840f641be1635c3622ad435ff4e0b4be68f26f24293a7d2f52c3ac7` |
| `engine.ts` | `1cc41acf356976db68512cb3e7b73d285194a21ba556fbd179727dab9d08c1fc` |
| `App.tsx` | `a01f01dff55941a0730d388d801f05315073b8a21e55c9adf9fb938a18a3d1eb` |
| `validation.ts` | `e13e9fab570ac6c8382972dab457e624e400f790a92b0713f84f87e3eab75459` |

## Disposition and practical limits

Coverage and the executable progression checks pass for the declared introductory scope. CR-01 through CR-04 are closed by the prime-owned corrections recorded above, with affected source reinspection and passing content/engine tests. The fixes preserve the campaign's intended scope and do not expand the game into a reproduction of the source publications.

The acceptance boundary is a coherent, playable introduction with visible evidence and consequences. There is no finding of professional qualification, normative conformance, certified training, independent review of the author's own quests, accessibility conformance or demonstrated learning effectiveness. The source catalog and UI already state the narrower learning scope; retain it in release descriptions.
