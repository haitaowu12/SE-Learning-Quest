# Signal Lab: visual gameplay study

Open `index.html` in a browser. It is self-contained and works directly from `file://`, with no install, server, network requests or save access. Refreshing starts the study again. This is a separate three-experiment prototype; Asterfall Classic remains at [release v1.1.0](https://github.com/haitaowu12/SE-Learning-Quest/releases/tag/v1.1.0).

Send a warning and watch its route. Tap two islands along a dotted path to add or remove a cable. Later, select Beacons and tap a quay to add its visible warning. Undo reverses the last change. In the final experiment, test both calm and north-cable-cut conditions on the same layout. Edits require new results. Tab and Enter provide the same building actions; Less motion removes the animated signal.

The first challenge checks message receipt, the second checks the stated crew response, and the third checks one named failure. A pure graph model computes reachability. Multiple layouts can succeed. The study does not model timing, other failure modes or real-world safety, and it has no full-campaign progression or persistent saves.

The [design brief](../../docs/design/VISUAL_PLAY_DIRECTION.md) compares three directions, outlines broader visual mechanics, records design references and proposes beginner playtest criteria.

## Verification

With the repository's development dependencies and browser engines installed:

```sh
node experiments/signal-lab/acceptance.mjs
```

The harness closes every launched browser and writes evidence and screenshots to `.release-check/signal-lab/`. It exercises Chromium, Firefox and WebKit directly from the HTML file, checks computed outcomes and complete playthroughs, rejects unexpected network/storage use, tests keyboard controls, checks 320px/390px overflow and runs axe in selected states. These are automated behavior checks, not a beginner-engagement or accessibility-conformance study.

No production application, dependency, route, save schema or deployment workflow is changed by this experiment.
