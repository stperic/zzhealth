# zzhealth

A small Next.js HTTP health monitor and everyday sample for zztrace. Checks run on page load and manual refresh. The default local demo includes healthy, slow and unavailable services.

With Node 26.7.0:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. To monitor your own services, copy `.env.example` to `.env.local`, set `ZZHEALTH_TARGETS` and restart the server. Only trusted server configuration supplies URLs; the browser cannot choose targets. The server binds to loopback by default. This sample has no authentication, historical uptime, scheduler or alert delivery.

For a production build, run `npm run build` then `npm start`. [Development and verification](docs/development.md) covers the tests. [Traceability](docs/traceability.md) covers the shared installer, MCP, requirements and evidence workflow.
