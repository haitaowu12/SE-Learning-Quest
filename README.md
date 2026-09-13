# Asterfall: The Last Relay

A browser RPG about rebuilding a world by understanding its connections. Play as **Iona Vale**, a keeper in training whose mentor disappears after the storm-warning relays fall silent. Cross six floating-island regions, assemble a travelling crew, expose an exclusion hidden inside a successful-looking network, and decide what the next generation will inherit.

Part of **SE Learning Quest**. The existing Coffee Lab and Harbour Line episodes remain under **Other episodes**.

## The game

The complete first campaign has **24 connected quests**, **55 authored dialogue decisions** (48 regular and 7 conditional), **165 choices**, **19 workbench puzzles**, 24 evidence artifacts, 24 keepsakes, eight badges, five trainable skills, and three ending families. Earlier choices change later conversations and recovery challenges. The final support and governance decisions also change the epilogue.

You investigate a warning failure, listen to excluded communities, negotiate with a maker, define a testable promise, design interfaces, compare alternatives, integrate and prove the relay, bring it into service, validate its usefulness, operate and repair it, manage a changed mission, and retire the old core. Mistakes expose gaps; they do not consume lives or permanently block the story. Puzzles use evidence selection, matching, sequencing and weighted trade studies.

The field journal unlocks original explanations and your own decision/evidence history. XP, levels, skills and rewards derive from that history. Character backgrounds grant one starting skill point; training grants additional field insights without locking essential help behind progression.

## Play locally

Use **Node.js 22.18 or newer within Node 22**, or a supported newer LTS, and npm. Node 22.18 is the tested baseline; older Node 20 releases are not supported by this build/toolchain.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. The RPG is the default page. `#episodes` opens the two earlier learning episodes.

For the production build under a GitHub Pages-style project path:

```sh
npm run build
npm run preview:pages
```

Open `http://127.0.0.1:4173/SE-Learning-Quest/`. The preview also serves `/renamed-project/` and `/` to exercise relative asset paths. `npm run preview` remains available for a standard Vite preview. The preview server is a development utility; the deployed game requires **only the static files in `dist/`**, without a backend, API keys, analytics or hosted fonts.

## Saves and controls

Progress saves in browser storage scoped to this game and the hosting path. The previous episodes have separate storage. Clearing browser data removes that local copy; **Settings → Export expedition** creates a portable JSON backup. Import validates the complete history before asking to replace the current expedition. Unsupported versions and corrupted data are preserved for recovery rather than silently overwritten. A changed save in another tab pauses automatic saving until you choose how to reconcile it.

Use Tab and Shift+Tab to move between controls, Enter or Space to activate them, and the labelled move buttons to order a workbench sequence. The skip link goes to the adventure. Settings offer 100–200% text size, increased contrast and reduced decorative motion; the operating system’s reduced-motion preference is respected. All challenges are untimed.

## Verification

```sh
npm run check
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
npm run curriculum -- --check
npm audit
```

On Linux CI, install browser dependencies with `npx playwright install --with-deps chromium firefox webkit`. For one engine, run `npm run test:e2e -- --project=chromium` (or `firefox` / `webkit`). Tests serve the **production build**, not the development server. Build before running browser tests after changes.

Browser acceptance plays complete strong and weak campaigns through the UI, including conditional consequences, guided repair, level/skill progression, journal, reload, import/export, reset, rejected input, storage restrictions, stale tabs, and the legacy-episode return route. It also checks 390px and 320px layouts, 200% text reflow, keyboard interactions, runtime errors and accessibility using axe. The human-observation limits of those checks are recorded in [acceptance evidence](docs/RPG_ACCEPTANCE.md).

## GitHub Pages

The repository workflow validates unit/content tests and browser acceptance across Chromium, Firefox and WebKit. Successful runs on `main` build and deploy `dist/` to Pages. Pull requests validate without deploying.

In **Settings → Pages → Build and deployment**, choose **GitHub Actions**. Push or merge the reviewed change to `main`, or run the workflow manually on `main`. Vite uses `base: './'`; no repository name is embedded in runtime asset URLs. A renamed fork or custom-domain root uses the same build. See [deployment](docs/DEPLOYMENT.md) for the full publishing path and evidence boundaries.

## Educational scope

The shipped campaign maps **all 30 ISO/IEC/IEEE 15288:2023 lifecycle process areas** and **18 supporting systems-engineering concepts** to original scenarios, choices, feedback and unlocked field notes. [The curriculum map](docs/RPG_CURRICULUM.md) links those identifiers to the actual quest objectives, mechanics, decisions and recurring artifacts.

This is a playable introduction to lifecycle thinking, **not the complete ISO standard, the full INCOSE Handbook, or a certification assessment**. No licensed passages were copied into the game. Public process/topic descriptions do not establish exhaustive coverage of every normative task, outcome, handbook method or application-specific chapter. [Source provenance and limits](docs/RPG_SOURCES.md) distinguish what the original campaign teaches from what requires access to the licensed publications and further subject-matter validation.

## Repository guide

| Area | Contents |
| --- | --- |
| `src/rpg/quests-one.ts`, `quests-two.ts` | Campaign story, decisions, puzzles, feedback and rewards |
| `src/rpg/types.ts`, `campaign.ts` | Typed content contracts and campaign assembly |
| `src/rpg/engine.ts` | Deterministic transitions, conditions, derived progression and endings |
| `src/rpg/persistence.ts` | Strict import schema, replay validation and storage conflict handling |
| `src/rpg/curriculum.ts`, `validation.ts` | Original field guide, process/topic map and integrity checks |
| `src/rpg/App.tsx`, `rpg.css`, `world.ts` | DOM interface, original SVG world, character presentation and responsive styles |
| `src/AppRouter.tsx`, `src/app/LegacyApp.tsx` | Hash entry routing and deferred loading of existing episodes |
| `tests/`, `tests/e2e/` | Engine, persistence, content and production browser acceptance |
| `scripts/` | Production preview and generated curriculum documentation |

See [architecture](docs/ARCHITECTURE.md), [content authoring](docs/CONTENT_MODEL.md), [contributing](CONTRIBUTING.md), [earlier episodes](docs/LEGACY_EPISODES.md), the [independent curriculum review](docs/RPG_CURRICULUM_REVIEW.md), and the [recent plan reconciliation and acceptance](docs/RPG_COMPLETION.md).

## License

MIT for this project’s code and original content. Referenced standards and publications remain the property of their respective rights holders; this repository does not grant access to or reproduce their licensed contents.
