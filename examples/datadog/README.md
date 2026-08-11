# Datadog instrumentation (adobe-demo)

Browser RUM + Logs for the React Spectrum **demo apps** in this fork, targeting Datadog site **US5** (`us5.datadoghq.com`).

## Service name

**`adobe-demo`** — confirmed no existing `DD_SERVICE` / Datadog service tag in this repository before this change. Use the same value for RUM and browser logs.

## What is instrumented

| Surface | Signal | Notes |
|---|---|---|
| `examples/rsp-cra-18` | RUM + browser logs | `@datadog/browser-rum` + `@datadog/browser-logs`, bootstrapped in `src/index.tsx` |
| `examples/rsp-webpack-4` | RUM + browser logs | Same SDKs, bootstrapped in `src/index.js`; env injected via webpack `DefinePlugin` |
| Shared helper + unit tests | Config / init contracts | `observability.js` + `observability.test.js` |

## What was skipped (and why)

| Skipped | Why |
|---|---|
| Node / server APM (`dd-trace`, `trace.http.request.*`) | This monorepo’s runnable demos are static CRA/webpack SPAs. There is no meaningful long-lived Node HTTP API to patch. Inventing fake backend metrics would mislead the post-deploy dashboard. |
| Storybook (`.storybook`) | Primary Storybook build has no clean client-token injection path without heavier root toolchain changes; demo apps above are the user-facing surfaces called out for this work. |
| Datadog dashboard edits | Out of scope — dashboards are owned separately. |

### What *is* emitted (with credentials)

- RUM: views, resources, long tasks, user interactions, errors — tagged `service:adobe-demo`
- Browser logs: startup info, forwarded `console.error`, explicit `reportError` / `window.__adobeDemoReportError()` — tagged `service:adobe-demo`
- **Not** emitted: APM `trace.http.request.hits` / `.errors` / latency (no server)

## Required env vars

Copy [`.env.example`](./.env.example). Never commit real tokens.

| Variable | Purpose | Example |
|---|---|---|
| `DD_SERVICE` / `REACT_APP_DD_SERVICE` | Unified service name (**must** be `adobe-demo`) | `adobe-demo` |
| `DD_ENV` / `REACT_APP_DD_ENV` | Environment tag | `dev` / `staging` / `prod` |
| `DD_VERSION` / `REACT_APP_DD_VERSION` | Version tag | `1.0.0` |
| `DD_SITE` / `REACT_APP_DD_SITE` | Datadog site | `us5.datadoghq.com` |
| `DD_APPLICATION_ID` / `REACT_APP_DD_APPLICATION_ID` | RUM application id | from US5 RUM → Add Application |
| `DD_CLIENT_TOKEN` / `REACT_APP_DD_CLIENT_TOKEN` | Browser client token | from the same RUM app |

CRA requires the `REACT_APP_` prefix (see `examples/rsp-cra-18/.env.example`).

## Run locally

1. In Datadog US5, create a RUM application (**Digital Experience → Applications → New Application → JavaScript**). Copy application id + client token.
2. Install example deps and start with credentials:

```bash
# CRA demo
cd examples/rsp-cra-18
cp .env.example .env   # fill REACT_APP_DD_APPLICATION_ID + REACT_APP_DD_CLIENT_TOKEN
yarn install
yarn start
```

```bash
# Webpack 4 demo
cd examples/rsp-webpack-4
export DD_SERVICE=adobe-demo DD_ENV=dev DD_VERSION=1.0.0 DD_SITE=us5.datadoghq.com
export DD_APPLICATION_ID=... DD_CLIENT_TOKEN=...
yarn install
yarn start
```

3. Open the app, click around, then in the browser console:

```js
window.__adobeDemoReportError('adobe-demo verification error')
```

Without credentials the apps still run; init logs a one-line skip message in development.

## Verify in Datadog US5

1. **RUM** → [US5 RUM Explorer](https://us5.datadoghq.com/rum/explorer) → filter `@session.type:user service:adobe-demo` (or Application = your RUM app)
2. **Logs** → `service:adobe-demo` (and `status:error` after `__adobeDemoReportError`)
3. **APM Services** → do **not** expect `trace.http.request.*` for this SPA-only instrumentation
4. Post-deploy dashboard (if pointed at `service:adobe-demo`) should light up on RUM/log panels that query that service tag

## Tests

```bash
cd examples/datadog && yarn test
# or: node --test examples/datadog/observability.test.js
```
