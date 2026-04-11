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
- **Framework design from scratch**: the project shows how test structure, helpers, and coverage strategy can be shaped in an independent codebase

## Architecture Decisions

### Page Object Model

UI flows use Page Object Model to keep selectors and page-specific behavior isolated from test intent.

### Hybrid setup where it improves signal

Some flows use API or transport setup before UI validation. This keeps preconditions faster and less brittle while preserving meaningful feature coverage in the browser.

### Transport-level checks for web flows

Not every important behavior in this app is a JSON API. Some risks live in redirects, HTML documents, cookies, CSRF handling, and download responses, so those flows are tested directly.

### Custom API helper for non-standard responses

The target application may return HTTP 200 even when the business operation fails. Helpers validate response body codes and messages to reduce false-positive passes.

### Schema contracts with Zod

Structured JSON endpoints use reusable Zod schemas for contract validation.

This keeps response-shape checks centralized, lets tests focus on business intent, and makes contract failures point directly to the invalid field path.

## Project Structure

```text
pages/                 Page Object classes
tests/api/             API, chain, and transport-level scenarios
tests/e2e/             Browser E2E scenarios
tests/monitoring/      Monitoring, throttling, and concurrency experiments
utils/                 API helpers, fixtures, and utility functions
data/                  Test data models and constants
scripts/               Supporting scripts, including network capture
artifacts/             Generated outputs such as network capture files
Automation Test Cases Plan.md
api_request_inventory.md
qa_questions.md
```

## QA Documentation

| Document | Description |
| --- | --- |
| [Automation Test Cases Plan](./Automation%20Test%20Cases%20Plan.md) | Test cases with priority, coverage intent, and automation mapping |
| [API / Request Inventory](./api_request_inventory.md) | Observed requests, response behavior, and recommended assertion strategy |
| [QA Questionnaire](./qa_questions.md) | Product, risk, and investigation questions identified during QA analysis |
| [GitHub Issues](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues) | Defects and inconsistencies found during exploratory and automated testing |

## Notable Findings

- **Non-standard error handling**: some API endpoints return HTTP 200 even for negative business outcomes
- **Broken UI confirmations**: some UI flows show success messages without sending any network request
- **Transport-specific risks**: checkout and payment flows depend on redirects, cookies, and CSRF token handling
- **Third-party interference**: overlays can affect browser automation and need dedicated handling
- **Known product defects**: for example, invoice download flow can return an incorrect total amount

## CI/CD

GitHub Actions is used for regular execution and feedback:

- smoke tests run on push and pull request events to catch regressions early
- changed test files are executed in regular CI runs when relevant
- full suite execution is available through scheduled and manual runs
- reports are published through JUnit summaries, Playwright HTML artifacts, and email notifications

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
npm run test:report
```

Run Playwright directly:

```bash
npx playwright test
npx playwright test --ui
```

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
