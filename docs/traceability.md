# Traceability workflow

zzhealth uses released zztrace v0.1.0 for its first everyday workflow. Requirements and exact TypeScript/Vitest links live in `trace/requirements.yaml`; `trace.yaml` names the policy and `trace.lock` records inspected links. Four initial draft requirements cover configuration, health classification, timeouts and redirects. Playwright supplies separate browser checks; its identities are not interpreted as Vitest tests.

## Install once

Use the authenticated [zztrace v0.1.0 installation guide](https://github.com/stperic/zztrace/blob/v0.1.0/docs/installation.md). The repository and release downloads are private. Sign in with an account that can read `stperic/zztrace`; verify the exact release's Sigstore checksum manifest and archive before executing its installer. Choose the project-local prefix `$PWD/.tools/zztrace`, or use an existing verified installation.

The released `zztrace-install` already uses `common` for verification, extraction, staging and activation. This project adds no installer implementation, Go dependency or sibling source requirement. npm installs the web application using its lockfile. `.tools/` and `.zztrace/` are ignored and must not be committed.

For the project-local installation:

```sh
export PATH="$PWD/.tools/zztrace/bin:$PATH"
zztrace version
zztrace-trace version
npm run trace:check
```

Start the MCP host with this PATH and the project root as its working directory. `.mcp.json` registers `zztrace-trace --repo .` for hosts that read that format. Other hosts can register the same executable and arguments. Tool results and CLI queries read the same committed source and working graph.

## Make a scoped change

```sh
zztrace-trace find health
zztrace-trace scope R-CHECK
zztrace-trace policy --base main --scope R-CHECK
# Edit the requirement proposal, implementation and regression tests.
zztrace-trace impact --base main --scope R-CHECK
npm run verify
zztrace-trace stamp R-CHECK
zztrace-trace check
```

Run all commands suggested by `scope` or `impact` as well as full verification. Shared `checkTarget` logic affects several requirements: inspect and restamp all affected links after checking them. Keep the proposed text, code, tests and stamps in the same commit. The R-CHECK lock asks the maintainers to review changes to health semantics. A missing approval is expected to block the forge policy check; never substitute local approval flags.

## Capture evidence

After committing, keep the checkout unchanged while running and recording tests:

```sh
zztrace --db .zztrace/authority.sqlite init
zztrace graph import --repo . --commit HEAD --actor agent --request-key initial-graph
npm run test:evidence
```

Use the returned graph snapshot ID to create `.zztrace/run.json`:

```json
{"graphSnapshotId":"GRAPH_ID","repository":".","runId":"initial","format":"junit","configuration":{"command":"npm run test:evidence"}}
```

```sh
zztrace graph record --file .zztrace/run.json --report .zztrace/unit.xml --actor agent --request-key initial-results
zztrace graph status --id GRAPH_ID
git tag trace-start
```

Create `.zztrace/baseline.json` with that snapshot ID:

```json
{"graphSnapshotId":"GRAPH_ID","repository":".","tag":"trace-start","product":"zzhealth","module":"monitor","variant":"default"}
```

```sh
zztrace graph baseline --file .zztrace/baseline.json --actor owner --request-key baseline-start
zztrace baseline document --id BASELINE_ID --output .zztrace/requirements.md
zztrace bundle export --id BASELINE_ID --output .zztrace/evidence-start
zztrace bundle verify --dir .zztrace/evidence-start
```

The tag establishes a history boundary, not retrospective review. Use fresh request keys for new operations. A failed test report is evidence too; retain it. A bundle can be intact but incomplete: inspect findings and exit codes. Later changes need actual forge-review captures before merge and fresh merged-source tests. Follow the remaining sequence in the [MVP guide](https://github.com/stperic/zztrace/blob/v0.1.0/docs/mvp-setup.md).

Generate requirements and the matrix with the released tools and their authenticated Word templates. Review the actual documents and retain the judgment. Owner-authorized Codex reviews must be labelled delegated; agent time is not human usability evidence.

## Hosted review checks

The owner authorized publishing this sample and a standalone Linux CI checker; common and zztrace source repositories and full releases remain private. The `checker-v0.1.0` release contains only the compiled checker and required license notices. It was extracted from the authenticated zztrace v0.1.0 Linux archive. The policy workflow pins the checker SHA-256; it reads candidate source without executing the application. The separate read-only CI job executes the application tests.

`Trace policy` runs from the trusted default branch for PR updates. After a review is submitted or dismissed, dispatch that workflow on `main` with the PR number to refresh its decision. Its bounded `open_trial=runner` input opens the prepared integration change as the Actions bot, so the owner account can submit a delegated review with explicit provenance. Because bot-created PRs do not trigger other workflows, dispatch `CI` on the candidate branch and `Trace policy` on `main` after opening it.

Required checks are `test` and `zztrace/policy`. Enable the `ZZTRACE_REQUIRED_CHECK` repository variable only after verifying main's required-check protection. A changed head requires new tests and a fresh review; local approval flags never replace forge evidence.

## Qualification status

The local starter and trace setup are being qualified. Hosted PR enforcement, the ordinary-change review and final reproducible baseline remain pending. A workflow file or a local passing policy preview alone does not prove an enforced merge gate.
