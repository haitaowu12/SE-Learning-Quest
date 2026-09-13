# GitHub Pages publishing

## Requirements

The deployable artifact is `dist/`. It contains static HTML, JavaScript, CSS and local assets. There are no server functions, secrets, API keys, remote databases, external fonts or runtime package downloads. Reference links require internet only when a player elects to visit them.

The tested toolchain baseline is Node 22.18 and the committed npm lockfile. `npm ci` is the supported reproducible installation command. A browser must support JavaScript modules, modern DOM APIs and (for automatic persistence) local storage. Export remains available when storage is restricted.

## Publish this repository or a fork

1. In the repository’s **Settings → Pages**, select **GitHub Actions** as the source.
2. Push or merge the reviewed change to `main`. The workflow also supports a manual run on `main`.
3. Unit/content checks, production build and Chromium/Firefox/WebKit acceptance must pass. Pull requests execute those checks without deployment.
4. The deployment job uploads `dist/` and publishes it through the `github-pages` environment. Use the URL reported by that successful workflow run.

Vite uses `base: './'`. The generated entry and chunks resolve under `/SE-Learning-Quest/`, a renamed project path, or a custom-domain root without a source change. Only hash fragments select the optional earlier episodes, so refreshing does not require server-side route rewrites. Serve the directory with a trailing slash, as GitHub Pages does.

Local implementation and local acceptance do not establish that a new version has been published. Publication is complete only when the remote workflow succeeds and the deployed URL has been checked. This change does not change account settings or claim an unobserved live deployment.

## Reproduce production behavior

```sh
npm ci
npm test
npm run build
npm run preview:pages
```

The preview prints `http://127.0.0.1:4173/SE-Learning-Quest/`. It also exposes the same immutable build at `/renamed-project/` and `/` for path-isolation tests. The browser suite uses this preview with strict static-file serving: missing files return 404 rather than an HTML fallback masquerading as a script.

```sh
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
```

`test-results/acceptance.json` records browser outcomes; failing tests retain traces and screenshots. Representative screenshots are in `output/asterfall/`. CI uploads evidence per browser engine, even when a run fails. Those generated outputs are not required to host the game.

## Assets, storage and updates

The RPG loads separately from the legacy Phaser episode chunk. That optional chunk remains larger than Vite’s default 500 KB warning threshold; it does not load for the Asterfall campaign. The default game includes its complete campaign content so play after load has no content-fetch dependency.

Saves are local to browser and deployment path. Moving a project or changing its URL does not automatically transfer browser storage; players should export at the old location and import at the new one. The runtime does not register a service worker, so it makes no promise of a first-time offline launch. After the app and its chunks load, campaign actions do not need a backend.

When changing a published content/schema version, implement and test migration or retain an explicit unsupported-version recovery message. Do not silently erase or reinterpret a player’s history. Test both legacy entry routing and the RPG after CSS or shell changes.

## Primary deployment references

- [Vite static deployment](https://vite.dev/guide/static-deploy.html)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

The project’s relative-base and subpath behavior is also exercised against the actual production output in its own browser tests.
