# Changelog

## Illustrated RPG preview

Adds a separate `#adventure` opening chapter with three illustrated scenes, object inspection, a source-labelled evidence satchel, short character exchanges, tool selection, visible crew responses, claim/evidence placement and a contextual handover. The chapter retains Asterfall's characters and story; the Signal Lab network-builder direction is set aside. Classic remains the default and is preserved at `v1.1.0`.

Adds event-replayed chapter saves with a separate namespace, confirmation-based import/reset, corruption preservation, stale-tab detection, in-memory play when storage fails, and reduced-motion/reading settings. Original SVG scenes and native controls require no new dependencies or external runtime assets. This preview covers one complete chapter, not all 24 Classic quests.

## 1.1.0 — Asterfall: The Last Relay

Introduces an original, complete 24-quest roleplaying campaign as the default experience. The story spans six regions and the engineering lifecycle, with 55 authored dialogue decisions, 165 choices, 19 workbench puzzles, 24 artifacts and keepsakes, eight badges, five trainable skills and three ending families with governance/support variants.

Adds conditional consequences, active feedback, guided recovery, a decision/evidence journal, character progression, export/import/reset, versioned save validation, stale-tab conflict detection and recovery when browser storage is unavailable. Responsive DOM controls, keyboard operation, 100–200% text scaling, contrast and reduced-motion settings replace canvas dependency for the new campaign.

Preserves the earlier Coffee Lab and Harbour Line episodes under `#episodes` and defers their Phaser chunk. Removes external font requests from the entry page. Relative production assets support the repository path, renamed projects and domain roots.

Adds process/concept traceability, original-source boundaries, content/architecture/contribution/deployment documentation, pure engine/persistence/content tests, and production browser acceptance across three engines. GitHub Pages publication is gated on those checks; local completion is distinct from a remote deployment.

Dependency audit remediation updates the lockfile’s Vite, PostCSS and Nano ID resolutions. The supported toolchain baseline is Node 22.18 and `npm ci`.

The campaign covers all 30 lifecycle process areas at an introductory gameplay level plus 18 supporting concepts. It does not reproduce or claim exhaustive coverage of licensed standards/handbook content, validated learning effectiveness or certification readiness.

Final review fixes separate dialogue reconsideration from failed bench submissions, reject impossible no-puzzle attempt imports, and protect accepted bench evidence from inconsistent resubmission. Keyboard focus follows feedback and the next challenge. The retirement conclusion retains unresolved choices and confirms refuge cover before Sera returns. Source documentation now records the current SEBoK licensing scopes. Acceptance passes 81 unit/content tests and 18 production-browser scenarios across three engines.
