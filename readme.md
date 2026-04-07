# Playwright E2E - AutomationExercise

This repository contains practice automation tests for the demo store [AutomationExercise](https://automationexercise.com).

## Purpose

- A learning project for Playwright E2E and API testing.
- Demonstrates code organization patterns (Page Object).
- Covers edge cases, infrastructure challenges, and UI/API inconsistencies.

## CI/CD Integration

The project is integrated with **GitHub Actions** for automated test execution:
- **Smoke Tests**: Triggered on every `push` to the `main` branch to ensure core functionality is intact.
- **Full Regression**: Can be triggered manually via `workflow_dispatch` or on a schedule.
- **Artifacts**: Playwright reports are generated and stored for failed runs to facilitate debugging.

## 🐞 Bug Tracking & QA Documentation

- **[Test Plan] (./Automation Test Cases Plan.md)**: test plan with priority and automation status
- **[Issues List](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues)**:  bug reports 
- **[QA Questionnaire] (./qa_questions.md)**:  questions for the development team and risk assessments.

## Project Structure

- /api # API-level tests
- /e2e # full E2E scenarios using Playwright
- /utils # helper functions, fixtures, data generators
- playwright.config.ts # Playwright configuration
- package.json # dependencies and scripts
- Automation Test Cases Plan.md # test cases lists with priority
- qa_questions.md # questions to developers and notes


## How to Run

Install dependencies:


npm install


Run all tests:


npx playwright test


Run interactive UI mode:

npx playwright test --ui

## Network Capture

Use the network capture utility to investigate cart, checkout, and payment flows without copying requests one by one from DevTools.

Start the helper:

`npm run capture:network -- --label checkout-payment --path /view_cart`

How it works:
- The browser opens in headed mode.
- Manually prepare the page state.
- Press `Enter` in the terminal to start recording.
- Perform the target action in the browser.
- Press `Enter` again to stop recording and save the results.

Output:
- JSON capture: `artifacts/network-captures/*.json`
- Markdown summary: `artifacts/network-captures/*.md`

Useful flags:
- `--label <name>`: adds a readable name to the output files
- `--path <relative-path>`: opens a specific page before capture starts
- `--include-scripts`: keeps first-party script requests in the capture
- `--slowmo <ms>`: slows browser actions for debugging
