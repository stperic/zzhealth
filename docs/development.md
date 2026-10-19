# Development

Use the pinned Node version in `.nvmrc` and install the locked dependencies with `npm ci`. Next.js uses its App Router, TypeScript and plain CSS. Biome handles formatting and lint checks. There is no database or external demo service.

The core lives in `src/lib/config.ts` and `src/lib/health.ts`. Server configuration is validated before any request. Checks run concurrently, stop after two seconds and never follow redirects. Latency measures time to response headers; bodies are canceled. Only service names, origins and results reach the dashboard; query strings and connection-error internals stay on the server.

`/api/health` reports this process's liveness. `/api/checks` returns a fresh report for the server's configured services, ignoring caller URL parameters. `/api/demo/healthy`, `/api/demo/slow` and `/api/demo/down` provide local examples. The dashboard's timestamp belongs to the last completed report and remains unchanged when refresh fails.

## Verification

```sh
npm ci
npx playwright install chromium
npm run verify
```

Verification runs type generation, TypeScript, Biome, Vitest, a production build and Playwright against that build on loopback port 3100. On Linux CI, install the browser's system dependencies with `npx playwright install --with-deps chromium`. The browser suite uses desktop and mobile Chromium viewports; it does not qualify WebKit or Firefox.

Vitest tests use real local HTTP servers for successful, slow, failed, redirect and timed-out requests. Browser tests exercise rendering, refresh, failed refresh and the API boundary. Focused commands are `npm test` and `npm run test:e2e` after building. `npm run test:evidence` saves the unit report to ignored `.zztrace/unit.xml`; the browser run saves `.zztrace/browser.xml`.

For visual inspection, use `npm run dev`. The health demo sends real requests to itself, so the first development page load may include Next.js route compilation time. Production verification tests the built application. If you choose another development port, set `ZZHEALTH_DEMO_ORIGIN` to that loopback origin too.

Keep the sample small. Authentication, scheduled probes, alerts, persistent uptime history and deployment orchestration need an explicit next goal.
