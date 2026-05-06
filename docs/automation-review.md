# Automation Review — pw-e2e-automationexercise

**Type:** Personal learning project / portfolio piece  
**Stack:** Playwright · TypeScript · GitHub Actions  
**Target:** [automationexercise.com](https://automationexercise.com)  
**Period:** March – May 2026  
**Author:** Olga Butkaliuk

---

## What This Project Was

An independent end-to-end QA automation project built from scratch — without a team, without backend access, and without a developer to explain how things work under the hood.

The goal was not to tick off a list of test cases, but to practice the full QA cycle: understand what the application actually does, decide what is worth testing and why, build the automation, investigate what breaks, and document findings in a way that would be useful to a real team.

---

## What Was Built

| Layer                | Count      | Notes                                                                 |
| -------------------- | ---------- | --------------------------------------------------------------------- |
| E2E tests (UI flows) | 22         | Covers 22 of 26 author-proposed scenarios                             |
| API tests            | 28         | Includes chain, transport, and contract tests                         |
| Accessibility tests  | 10         | 8 static WCAG scans + 2 keyboard journeys                             |
| Monitoring           | 2          | Network throttling probe + concurrency stress test                    |
| **Total test cases** | **94**     |                                                                       |
| Page Objects         | 15 classes | POM with section extraction                                           |
| GitHub Issues filed  | 31         | 6 critical, 8 high, 11 medium, 6 low/infra                            |
| QA documents         | 5          | Test plan, API inventory, QA questionnaire, bug template, this review |

CI runs on GitHub Actions with PR validation (changed tests + smoke + a11y-smoke) and a full nightly regression with email reporting.

---

## What I Learned

### 1. Testing from scratch changes how you think about coverage

When there is no existing suite to extend, every test needs a reason to exist. Writing the API inventory before writing tests forced a question I had not asked explicitly before: what kind of assertion does this endpoint actually support? Not every request is a JSON contract. Some are redirects. Some are HTML documents. The answer shaped the entire test architecture — separate layers for API, transport, chain, and E2E rather than one generic "API test" bucket.

### 2. API testing has QA value when you know why you are doing it

Previously, API testing felt mechanical — call an endpoint, check a status code. Here, the reason for each layer became clear:

- Chain tests cover state transitions that are too slow or brittle to verify through the browser
- Transport tests cover redirect and session behavior that is invisible in UI flows
- API contract tests catch structural regressions before they reach the UI

The question "why not just test this through the UI?" has a real answer for each test, and that changed how the work felt.

### 3. Configs grow from necessity, not from templates

Playwright configuration accumulated incrementally: one project at a time, one reporter when the output became unreadable, workers adjusted when CI started timing out. Starting from a minimal config and adding only what was needed produced something understandable rather than something copied and hoped for the best.

### 4. Working with AI tooling as a collaborator

The workflow that emerged — Codex as implementation agent, Claude as reviewer and architecture consultant — was more effective than either alone. Codex handles renaming, boilerplate, and implementation tasks. Claude provides independent review without the context bias of having written the code. The distinction matters: a reviewer who also wrote the code tends to see what they intended rather than what is there.

One less obvious effect: AI tooling lowers the cost of documentation enough to change what gets documented. The ad interference investigation — 150 test runs, HAR analysis, controlled baseline comparison, cross-environment validation — would normally exist as "we tried blocking ads and it helped." With Codex available to help structure findings, it became a proper spike with methodology, evidence, and a traceable conclusion in the issue tracker. The investigation itself was the same. What changed was the threshold for writing it down.

### 5. "Done" is a real state

The project reached a point where there was nothing left to test within the defined scope. That felt unusual. The instinct is to keep finding more edge cases, more scenarios. But test coverage has diminishing returns, and knowing when to stop is part of the skill.

---

## What Was Hard

**No developer feedback loop.** Filing 31 issues knowing none will be fixed removed half the value of defect reporting. Bug reports are written for someone who will read them, prioritize them, and eventually act on them. Writing into a void tests the documentation habit without the reward.

**Understanding utilities written by an agent.** Some helpers were generated by Codex with guidance on what the output should be. The outputs were correct and verified, but full internal understanding came later — through reading, debugging, and occasionally rewriting. This is a real constraint of AI-assisted development: you can verify behavior faster than you can build mental models of implementation.

**Third-party ad interference.** The site serves interstitial ads that intercept clicks, redirect navigations, and interfere with test assertions in non-deterministic ways. This was not a test design problem — it was an infrastructure problem that required proper investigation.

The investigation ran 150 isolated test executions across 5 flows, 3 browsers, and 2 network modes (standard and baseline). HAR analysis identified the specific ad-serving domains most strongly correlated with `#google_vignette` redirects and overlay events. A blanket third-party block was tested and rejected — it improved ad stability but introduced unrelated failures, which meant the fix was not understood, only applied. The final mitigation used a narrowed domain shortlist validated on both Windows and WSL to cover the Linux-based CI environment.

The outcome was specific: ad-driven failures were separated from browser timing failures, which made the remaining instability easier to attribute and address. This is different from the common approach seen across other automation projects targeting the same site — most use a static `route.abort()` blocklist without investigation into which domains actually cause instability or whether the block has side effects.

The cost of doing this properly was higher. The benefit was a mitigation that was understood rather than copied.

---

## Testability Assessment

AutomationExercise is a useful practice target, but its testability has real limitations.

### What works well

- Wide API surface with documented endpoints
- Consistent HTML structure for most page objects
- Stable enough for transport and chain tests

### What creates friction

| Issue                               | Impact                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| No `data-testid` attributes         | Selectors rely on CSS classes and text content; fragile to markup changes                                           |
| "Fake 200 OK" for business errors   | Every API assertion needs a custom response body check; status codes alone are not reliable                         |
| Third-party ads                     | Non-deterministic UI interruptions require active mitigation in every E2E test                                      |
| No test mode or ad-free environment | Cannot distinguish product defects from infrastructure noise without network interception                           |
| HTML responses for non-UI endpoints | Several flows that look like APIs return HTML documents; JSON contract testing does not apply                       |
| No unique order IDs                 | Payment completion produces no trackable artifact; order state can only be inferred from cart and redirect behavior |

### What is missing at the product level

The site has broken guardrails that make certain scenarios untestable as correctness checks — they can only be documented as known defects. Anonymous checkout access, stale session after logout, and deleted-account session persistence are all present and documented, but cannot be "fixed" by the tests. The tests assert the broken behavior explicitly using `test.fail()` with issue references, which is the correct approach: document what is, not what should be.

---

## What I Would Do Differently

**Start the API inventory earlier.** The request inventory was built partway through the project. Building it first — before writing any tests — would have shaped the layer decisions from the start rather than requiring some restructuring mid-project.

**Let documentation grow from investigation, not from a template.** The project produced a QA questionnaire, a test plan, and an API request inventory — each emerged from a different phase of the work rather than being set up in advance. That was the right order: structuring documents before knowing what you will find means structuring around assumptions. On the next project the shape of the documentation will be different, because the application will be different. The lesson is not "plan the documents earlier" but "let the investigation tell you what documents you need."

**Set explicit scope boundaries before starting.** The 26 author-proposed test cases were the anchor, but the project expanded beyond them — transport tests, chain tests, accessibility, monitoring. This expansion was intentional and valuable, but defining it upfront rather than organically would have made prioritization easier.

---

## What Transferred from Commercial Work

The project was built using an approach informed by real Playwright automation experience. The patterns that transferred most directly:

- Fixture-based lifecycle management over `beforeEach`/`afterAll`
- API setup for preconditions that would be slow or flaky through the browser
- Separate helper files with single responsibilities
- Defensive cleanup that survives 404s and partial failures
- CI design that gives fast feedback on PRs and full regression overnight

The main difference from a team context is that all decisions were made unilaterally. In practice, many of these choices would be discussed — what layers to cover, where to draw the scope boundary, how to handle known defects. Working solo makes the decisions faster but removes the pressure-testing that comes from defending them to someone else.

---

## Summary

This project answered the question of what it looks like to build QA automation independently, end to end. The technical output — 94 tests, a CI pipeline, documented defects, and supporting QA documentation — is visible in the repository.

The less visible output is a clearer sense of why each layer exists, what trade-offs are made when choosing how to test something, and where the limits of automation are. Those are harder to show in a repository, but they informed every decision in this one.
