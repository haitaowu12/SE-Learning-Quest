# Asterfall: sources and content boundaries

Reviewed 12 September 2026. This record concerns the Asterfall curriculum in `src/rpg/`, not the separately retained legacy episodes.

## What this project supplies

Asterfall uses an original fictional warning-network case to introduce 30 named life-cycle process areas and 18 supporting concepts. The dialogue, decisions, evidence cards, numerical examples, puzzles, rewards and artifacts are teaching material for this game. Their numbers and acceptance conditions describe the supplied fictional cases; they are not values prescribed by a standard.

The catalog in [`curriculum.ts`](../src/rpg/curriculum.ts) contains short teaching explanations and examples. Its source keys are **reading pointers**, not quotations, clause citations or evidence of publisher review. At this review, the 30 process entries point to the ISO overview and the 18 supporting entries to the SEBoK overview. The handbook is a supplementary reference exposed through the source list. No entry has a claim-by-claim handbook citation.

The [curriculum map](RPG_CURRICULUM.md) documents where the game's declared topics appear. The [curriculum review](RPG_CURRICULUM_REVIEW.md) checks the substance of those examples and states its independence limits. Neither is a reproduction of a licensed task inventory or a finding of normative conformance.

## Official reference register

| Reference | Official public URL | What was inspected and what it supports |
| --- | --- | --- |
| ISO/IEC/IEEE 15288:2023, *Systems and software engineering — System life cycle processes* | <https://www.iso.org/standard/81702.html> | Public title, edition/date information and abstract. The page identifies the 2023 publication and describes life-cycle processes applicable to systems and systems of systems. It does not prescribe one development model or technique. The full standard was not accessed for this review. |
| INCOSE Systems Engineering Handbook, fifth edition | <https://www.incose.org/resources-publications/technical-publications/se-handbook/> | INCOSE's public handbook page identifies version 5 and its relationship to ISO/IEC/IEEE 15288:2023. It describes coverage of concepts, life-cycle processes, methods, tailoring and application. This review did not inspect the complete handbook, purchased text or member materials. |
| SEBoK, *Systems Engineering Overview* | <https://sebokwiki.org/wiki/Systems_Engineering_Overview> | Public introductory discussion of systems engineering in its wider context. Used for orientation, not as an authoritative restatement of every 2023 process requirement. Inspected revision: `oldid=77971`. |
| SEBoK, *System Verification* | <https://sebokwiki.org/wiki/System_Verification> | Public discussion of evidence against specified references and verification throughout development. Used to check the game's distinction between component evidence and wider claims. Inspected revision: `oldid=78226`. |
| SEBoK, *System Validation* | <https://sebokwiki.org/wiki/System_Validation> | Public discussion of intended use, stakeholder needs and operational conditions. Used to check q16's receipt-versus-use distinction and the need to revisit validity after a change. Inspected revision: `oldid=78411`. |
| SEBoK, *Life Cycle Model Selection and Adaptation* | <https://sebokwiki.org/wiki/Life_Cycle_Model_Selection_and_Adaptation> | Public orientation to selecting and adapting models in an organizational context. Inspected revision: `oldid=77940`. |
| SEBoK, *Adapting the Life Cycle Model* | <https://sebokwiki.org/wiki/Adapting_the_Life_Cycle_Model> | Public discussion of project adaptation, organizational guidance and responsibilities across stages. Used when checking whether q03 goes beyond selecting an isolated project sequence. Inspected revision: `oldid=77362`. |

The SEBoK pages inspected identify themselves with release 2.14. A current wiki release does not mean that every cited reference uses the newest edition: the inspected verification and validation articles still cite ISO/IEC/IEEE 15288:2015 and an earlier INCOSE handbook. Their discussion supports conceptual comparison; it does **not** establish a complete comparison against ISO/IEC/IEEE 15288:2023 or handbook edition 5. The editions named in the first two rows remain the project's intended reference editions. See the references sections of the linked SEBoK articles.

For a reproducible SEBoK reading, its permanent-link pattern is `https://sebokwiki.org/w/index.php?title=PAGE_TITLE&oldid=REVISION`. Preserve the title, revision and access date when using a passage in a future review. Links and live pages may change after the date of this record.

## Access and licensing scope

**ISO and INCOSE/Wiley.** The public pages above are used for identification and limited scope checks. The ISO site includes a rights reservation; INCOSE provides a route to obtain the handbook through its publisher. This repository does not supply those publications or grant rights to reproduce them. The review did not download licensed chapters, standards text, handbook figures, process tables, certification questions or learning-objective handouts. Edition and scope statements here rest on the accessible official overview pages, not on an examination of the complete publications. See the [ISO entry](https://www.iso.org/standard/81702.html) and [INCOSE handbook entry](https://www.incose.org/resources-publications/technical-publications/se-handbook/).

**SEBoK.** Public readability is separate from permission to redistribute text or images. The site's current **Copyright Information** route resolves to <https://sebokwiki.org/wiki/SEBoK%3ACopyright>; the page identifies its underlying revision as `oldid=34030` and contains a 2011 rights notice and conditions of use, with separately owned images. Its age is material: this review does not treat that page as confirmation of a Creative Commons license or as blanket permission for new imports. This review links to articles and records short conceptual comparisons; it does not import their bodies, figures or tables.

**Project material.** The repository's [MIT license](../LICENSE) remains the project license. A source link does not place another publisher's material under that license. The fictional case, original wording and calculated exercise data should remain distinguishable from material attributed to an external author. This review checked the supplied RPG files; it did not conduct a full-text similarity comparison against unavailable licensed publications or clear rights for unrelated legacy content.

## Boundaries for future curriculum changes

Keep the reference role visible when adding material. An original explanation may link to an appropriate public source, while an adopted quotation, figure or table needs its own source, edition or revision, attribution and applicable reuse basis. Do not treat the game's existing license or this reference list as permission for a new import.

Prefer original cases that make a learner use supplied evidence: compare two configurations, identify a missing population, test a common-cause assumption or explain the limits of a handover. Process names may organize those cases without reconstructing all normative activities, tasks, outcomes or handbook detail. The dialogue's feedback must derive from facts available in the case rather than from an unavailable licensed passage.

Preserve the distinction between topic exposure and assessed proficiency. The game awards experience, skill points and journal access after gameplay; those mechanisms do not establish professional competence, standard compliance or examination readiness. No reviewed evidence supports publisher endorsement, an approved training status, certification equivalence or a promise that completion prepares a learner for a certification exam. The application's source-and-scope text already describes an original learning adventure rather than a complete standard, handbook or certification assessment; retain that boundary when editing product copy.

The concrete coverage and execution findings, including which material received independent review and which received author self-review, are recorded in [RPG_CURRICULUM_REVIEW.md](RPG_CURRICULUM_REVIEW.md).
