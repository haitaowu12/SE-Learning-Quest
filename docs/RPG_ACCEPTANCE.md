# Asterfall acceptance evidence

Acceptance date: 2026-09-12. Local production-build verification used Node 22.18.0 and Playwright 1.63.0.

## Automated release evidence

The browser suite serves the built `dist/` directory through `scripts/serve-production.mjs`; it does not exercise Vite's development server. The final complete run used:

```sh
npm run test:e2e
```

Result: **18/18 tests passed**, with zero unexpected, skipped or flaky results. Each of Chromium, Firefox and WebKit passed the same six production-browser scenarios.

| Scenario | Evidence exercised |
| --- | --- |
| Clean strong campaign | All 24 quests through the rendered UI, strong-choice feedback and focus on each new feedback/decision/bench, every required bench, quest rewards, level progression, training, journal access, reload persistence, all 48 field-guide entries, final badge and strong ending. The route blocks external network requests and fails on page errors, console errors or HTTP error responses. |
| Weak campaign and recovery | Weak-choice route across all 24 quests, inherited conditional consequences, two failed q01 bench attempts, Pip's guided repair, assisted reward state, completion without a resource soft lock and the weak ending. |
| Responsive keyboard and save controls | 390 px and 320 px viewports, skip-link keyboard order/activation, keyboard choice and feedback focus, two dialogue reconsiderations plus reload without inventing puzzle failures, no premature guided answer after one real failed submission, 200% **application text size**, contrast and reduced-motion settings, axe scans, no horizontal overflow, export, rejected malformed import, reset confirmation/Escape, valid import and the legacy-episode return path. |
| Storage conflict and path isolation | Preserves an unreadable stored save, requires explicit reset, observes a second tab's storage change, blocks a stale-tab overwrite, and isolates saves at `/SE-Learning-Quest/`, `/renamed-project/` and `/`. |
| Storage unavailable | Runs an in-memory expedition when `localStorage` throws, completes q01 and exports a replay-valid save. |
| Imported mid-campaign bench | Imports a replay-valid q15 active state at 390 px, completes its conversation and evidence bench, passes axe/no-overflow checks and records the reward. |

Automated axe checks use the `wcag2a`, `wcag2aa` and `wcag21aa` rule tags at onboarding, campaign/journal states, responsive settings/dialog states and a mid-campaign bench. They reported no violations in the exercised states. This is an automated-rule result, not a claim of WCAG conformance.

The final JSON reporter output is generated at `test-results/acceptance.json`; screenshots are generated under `output/asterfall/`. Both are ignored working evidence and CI uploads them per browser engine. The durable evidence is the test source, this report and the CI workflow that reruns the matrix.

## Core and content gates

The final local reconciliation also recorded:

- `npm test`: **81/81 passed**, including 27 engine and 33 persistence tests plus legacy/content coverage.
- `npm run curriculum -- --check`: generated map matches **30 process areas and 48 total field-guide entries** (30 process areas plus 18 supporting concepts).
- `npm run check`: passed.
- `npm run build`: passed against the production Vite configuration. The optional legacy Phaser chunk remains above Vite's size-warning threshold and is lazy-loaded outside the default Asterfall route.
- `npm audit --audit-level=high`: zero reported vulnerabilities at the time of the run.

## What this evidence does not establish

The browser matrix uses Playwright desktop browser engines on the development machine. It does not substitute for testing on physical phones/tablets, a human screen-reader session, switch/voice input, operating-system high-contrast modes, or a manual accessibility review.

The 200% scenario uses the game's own text-size setting. It is **not** a test of the browser's manual zoom control. The layouts also pass narrow viewport checks, but no claim is made that those emulated viewports constitute real-device testing.

No learner study was run. Completion, XP, choice quality and puzzle success are game mechanics and practice evidence; they do not demonstrate professional competence, learning transfer, standards conformance or certification readiness.

The local production preview verifies static assets and repository-subpath behavior. It does not establish that a new commit has been deployed to the public GitHub Pages URL. Remote publication is evidenced separately by a successful repository workflow and a check of the resulting deployed URL; see the [plan reconciliation and release record](RPG_COMPLETION.md).
