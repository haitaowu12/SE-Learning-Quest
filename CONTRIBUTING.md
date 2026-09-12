# Contributing

Use Node 22.18 or a supported newer LTS, run `npm ci`, and create a branch for your change. Read the architecture and content model before changing the engine or campaign.

Keep changes focused. Preserve the two earlier episodes and their save namespaces. Put original story, feedback, puzzles and mappings in the typed content data. Do not introduce external services or required secrets into the static runtime.

For a behavioral change, add a test that demonstrates the problem and its correction. Run `npm run check`, `npm test`, `npm run build`, and the affected production browser paths. Run all three browser engines for release changes. For curriculum changes, regenerate the map with `npm run curriculum` and ask another reviewer to inspect the actual reasoning and all affected branches.

Review requirements and feedback for context. A choice is not weak merely because it differs from the preferred approach. Name the omitted evidence, unmet need, unowned consequence or condition that makes it inadequate in the case. Avoid arbitrary puzzle ordering, ambiguous matching keys and imported real-world claims that the supplied evidence cannot support.

Public content must be original or have a compatible license with attribution. Do not commit purchased standards, handbook scans, licensed paragraphs, personal learner exports, credentials, generated browser profiles or test traces. Reference the authoritative publication instead. A new save or content version requires explicit compatibility handling and migration/rejection fixtures.

A pull request should explain the player-visible change, why it is needed, the validation performed and any remaining observed limits. Do not claim complete handbook mastery, standards conformity or production publication from automated tests alone.
