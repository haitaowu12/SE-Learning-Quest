## Publication

Firebase Hosting is the primary destination for future public releases: https://asterfall.web.app/. Run `npm test`, `npm run check`, the existing browser acceptance checks and `npm run build`; publish `dist/`. Keep Vite’s relative asset base.

Deploy from the repository root with `firebase deploy --only hosting --project tony-wu-projects`. The checked-in `firebase.json` pins this site and its public output. Keep the shared project on the no-cost Spark plan. The `Firebase Hosting` workflow publishes successful `main` revisions after checks; pull requests do not deploy. Google federation and repository variables must be configured before it is active; retain the existing hosts unless their retirement is requested. Exercise the main journey and any worker, download or nested page on the published address.

The Firebase browser jobs use the official Playwright image. Keep its image version in `firebase-hosting.yml` aligned with the locked `@playwright/test` version when updating dependencies.
