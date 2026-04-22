# Playwright E2E - AutomationExercise

Independent QA automation project for the demo store [AutomationExercise](https://automationexercise.com), built with Playwright and TypeScript using an approach informed by commercial Playwright work.

The project covers UI, API, hybrid, transport-level, and monitoring scenarios, with supporting QA documentation for test planning, risk analysis, and bug tracking.

The emphasis is on QA thinking: why tests are structured the way they are, what the application actually does under the hood, and where it breaks.

## Project Context

This repository was built from scratch against a public demo application.

That naturally creates some limitations:

- no access to backend logs, infrastructure, or internal monitoring tools
- no collaboration with developers on defect triage or fixes
- analysis is limited to externally observable behavior in the browser and API responses

Within that scope, the project focuses on the QA work that can still be done well:

- test architecture and maintainable automation design
- API and web-flow behavior analysis
- contract-aware assertions
- exploratory findings and bug documentation
- CI execution and reporting

## What This Project Shows

- **Coverage beyond basic UI paths**: separate API, E2E, hybrid, transport, chain, and monitoring coverage
- **Contract-aware testing**: API and web requests are analyzed by response type, not treated as one generic layer
- **Schema contract validation with Zod**: structured JSON endpoints are validated against reusable schemas, while tests keep only business-specific assertions
- **Handling imperfect systems**: tests account for non-standard behavior such as business failures returned with HTTP 200
- **QA analysis, not only automation**: repository includes a test plan, QA questionnaire, API/request inventory, and documented defects
- **Investigation tooling**: custom network capture utility for checkout and payment flow research
- **Failure analysis tooling**: archived Playwright report workflow and grouped failure parser for spotting recurring browser-specific and flaky failure patterns across runs
- **Framework design from scratch**: the project shows how test structure, helpers, and coverage strategy can be shaped in an independent codebase

## Architecture Decisions

### Page Object Model

UI flows use Page Object Model to keep selectors and page-specific behavior isolated from test intent.

### Hybrid setup where it improves signal

Some flows use API or transport setup before UI validation. This keeps preconditions faster and less brittle while preserving meaningful feature coverage in the browser.

### Transport-level checks for web flows

Not every important behavior in this app is a JSON API. Some risks live in redirects, HTML documents, cookies, CSRF handling, and download responses, so those flows are tested directly.

Broken purchase-state transitions are also probed at this layer, because guardrail defects are easier to localize through direct session and redirect checks than through UI-only symptoms.

### Custom API helper for non-standard responses

The target application may return HTTP 200 even when the business operation fails. Helpers validate response body codes and messages to reduce false-positive passes.

### Schema contracts with Zod

Structured JSON endpoints use reusable Zod schemas for contract validation.

This keeps response-shape checks centralized, lets tests focus on business intent, and makes contract failures point directly to the invalid field path.

### Targeted UI stability mitigation

The shared Playwright UI setup applies targeted mitigation for third-party ad traffic and consent overlays served by `automationexercise.com`.

This is intentionally narrow:

- known ad-serving hosts are blocked at the network layer
- consent overlays are neutralized in the DOM to reduce screenshot noise and click interception
- broad third-party blocking is avoided to preserve normal site behavior

This keeps the suite focused on product behavior rather than external advertising artifacts.

## Project Structure

```text
pages/                 Page Object classes
tests/api/             API, chain, and transport-level scenarios
tests/e2e/             Browser E2E scenarios
tests/monitoring/      Monitoring, throttling, and concurrency experiments
utils/                 API helpers, fixtures, and utility functions
data/                  Test data models and constants
scripts/               Supporting scripts, including network capture and report-analysis helpers
artifacts/             Generated outputs such as network captures and archived Playwright reports
Automation Test Cases Plan.md
api_request_inventory.md
qa_questions.md
```

## QA Documentation

| Document                                                                        | Description                                                                |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Automation Test Cases Plan](./Automation%20Test%20Cases%20Plan.md)             | Test cases with priority, coverage intent, and automation mapping          |
| [API / Request Inventory](./api_request_inventory.md)                           | Observed requests, response behavior, and recommended assertion strategy   |
| [QA Questionnaire](./qa_questions.md)                                           | Product, risk, and investigation questions identified during QA analysis   |
| [GitHub Issues](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues) | Defects and inconsistencies found during exploratory and automated testing |

## Notable Findings

- **Non-standard error handling**: some API endpoints return HTTP 200 even for negative business outcomes
- **Broken UI confirmations**: some UI flows show success messages without sending any network request
- **Transport-specific risks**: checkout and payment flows depend on redirects, cookies, and CSRF token handling
- **Broken purchase guardrails**: anonymous checkout/payment access and stale purchase state after logout are covered as known-defect transport checks
- **Weak purchase artifacts**: known defect `#24` shows `/payment_done/{value}` can render a generic success page for arbitrary integer values
- **Third-party interference**: external ad and consent layers can affect browser automation and require dedicated mitigation
- **Security/configuration exposure**: known defect `#25` shows public Django debug pages exposing internal route patterns
- **Known product defects**: for example, replayed payment completion can expose invalid purchase artifacts such as `payment_done/0`

## CI/CD

GitHub Actions is used for regular execution and feedback:

- PR validation runs three fast checks: `changed-tests`, `smoke`, and `a11y-smoke`
- PR validation also includes a lightweight guard for report-helper scripts so import-time side effects are caught before merge
- `changed-tests` executes only changed spec files when relevant
- `smoke` covers lightweight API and browser smoke scenarios for core flows
- `a11y-smoke` is reserved for lightweight accessibility checks without duplicating full E2E coverage
- full regression runs in a separate `Nightly` workflow on schedule or manual dispatch
- reports are published through GitHub job summaries, Playwright HTML artifacts, and nightly email notifications
- the nightly workflow also uploads structured Playwright logs for later failure analysis:
  - `results*.xml`
  - `test-results.json`
  - `test-results/`
  - `artifacts/history/`

## How to Run

Install dependencies:

```bash
npm install
```

Run the main suites:

```bash
npm run test:full
npm run test:api
npm run test:smoke
npm run test:full:archive
npm run test:report
```

Run Playwright directly:

```bash
npx playwright test
npx playwright test --ui
```

## Archived Reports And Failure Analysis

The repository includes small helper scripts for preserving Playwright reports across runs and building a grouped failure summary.

Useful commands:

```bash
npm run archive:reports
npm run check:report-tools
npm run parse:failures
npm run parse:failures:dir -- <directory>
```

Recommended local workflow for repeated debugging:

```bash
npm run test:full:archive
npm run parse:failures
```

What these commands do:

- `npm run test:full:archive` runs the full suite and stores the current `results.xml` and `test-results.json` under `artifacts/history/<timestamp>/`
- `npm run archive:reports` archives the current root-level Playwright reports without starting a new test run
- `npm run check:report-tools` verifies that the report helper modules can be imported without accidental top-level execution
- `npm run parse:failures` scans `artifacts/history/` recursively and builds a grouped Markdown summary
- `npm run parse:failures:dir -- <directory>` lets you analyze a different folder, for example a local collection of CI artifacts

Generated outputs:

- archived reports: `artifacts/history/<timestamp>/results.xml`
- archived Playwright JSON: `artifacts/history/<timestamp>/test-results.json`
- grouped failure summary: `artifacts/history/playwright-failure-summary.md`

The failure parser groups repeated issues by test name, browser, and simplified error signature so that recurring flaky patterns are easier to spot across many runs.

## Network Capture Utility

The repository includes a helper script for investigating first-party network activity without manually copying requests from DevTools.

Example:

```bash
npm run capture:network -- --label checkout-payment --path /view_cart
```

Useful flags:

- `--label <name>` for readable output file names
- `--path <relative-path>` to open a specific page before recording
- `--include-scripts` to keep first-party script requests
- `--slowmo <ms>` to slow browser actions during investigation

Output:

- JSON capture: `artifacts/network-captures/*.json`
- Markdown summary: `artifacts/network-captures/*.md`
