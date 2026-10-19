# zzhealth agent instructions

This is a small Next.js software health monitor and the owner-selected everyday sample for zztrace. Keep it easy to run from a fresh checkout. Read README.md and docs/development.md first. Keep target URLs in trusted server configuration; never accept a browser-supplied probe destination.

Use released zztrace v0.1.1 tools on PATH for evidence capture, with the project root as the MCP working directory. `.mcp.json` registers the trace server. `trace.yaml` and `trace/requirements.yaml` are the source of truth for the linked probe requirements. They remain drafts until their review is recorded. Browser coverage is retained separately in Playwright; the released trace runner supports Vitest/Jest identities, not Playwright commands.

Before a change, use `zztrace-trace find`, `scope`, `code` and `policy --base main` to understand the affected items and owners. For new behavior propose its requirement change first. After editing, use `impact --base main --scope ID`, run its suggested tests and `npm run verify`, recheck and stamp affected links, and run `check`. Never edit trace.lock by hand. Include code, tests, requirement revisions and stamps in the same focused commit.

An approve decision requires the named owners at merge; deny stops the change. Local CLI approval flags are not forge review evidence. Capture real test results and review provenance as documented in docs/traceability.md. Never invent a human review, passing test or enforced GitHub rule. Additional input formats, connectors and protection changes remain outside this goal.

The owner authorized this sample and its pinned CI checker to be public. Keep common and zztrace source repositories and full releases private. Avoid em dashes in user-facing strings and documentation. Run `npm run verify` before each commit. Use the existing common-backed zztrace installer and npm's lockfile; do not build another installer or introduce Go into this application.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
