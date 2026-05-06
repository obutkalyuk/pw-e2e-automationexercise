# Test Report — AutomationExercise

**Product:** [automationexercise.com](https://automationexercise.com) — demo e-commerce store  
**Scope:** Independent black-box QA analysis based on externally observable behavior  
**Testing period:** March – May 2026  
**Tester:** Olga Butkaliuk  
**Repository:** [obutkalyuk/pw-e2e-automationexercise](https://github.com/obutkalyuk/pw-e2e-automationexercise)

---

## Executive Summary

AutomationExercise is a publicly available demo store intended for QA practice. From a product quality standpoint, the application has significant defects across security, data integrity, and accessibility layers. Most findings would be release-blocking in a commercial context.

The site functions adequately as a learning target — core purchase flows are reachable, and the API surface is wide enough to support multi-layer test coverage. However, the quality bar reflects its demo purpose: bugs are not fixed, and several behaviors that would be unacceptable in production are present by design or by neglect.

---

## Coverage Summary

| Layer                    | Tracked scenarios | Implemented | Intentionally not implemented |
| ------------------------ | ----------------- | ----------- | ----------------------------- |
| E2E (UI flows)           | 26                | 23          | 3 (E2E-7, E2E-25, E2E-26)     |
| API tests                | 28                | 28          | —                             |
| Transport tests          | 17                | 17          | —                             |
| Chain tests              | 9                 | 9           | —                             |
| Accessibility (static)   | 8                 | 8           | —                             |
| Accessibility (keyboard) | 2                 | 2           | —                             |
| Monitoring / concurrency | 2                 | 2           | —                             |

**94 tracked scenarios: 91 implemented, 3 intentionally not implemented.**  
Of the 91 implemented: **59 passing** | **25 known defect / xfail** (documented via `test.fail()` with issue references).

The repository contains **76 logical automated tests**, expanded to **138 Playwright test executions** by the configured browser and project matrix (Chromium, Firefox, WebKit, API, A11Y, Monitoring projects).

**CI pipeline:** PR validation runs changed tests, smoke, and a11y-smoke on every pull request. Nightly regression runs the full suite with artifact collection, failure analysis, and email summary with test statistics and branch context.

### Not implemented — rationale

| #                            | Reason                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------- |
| E2E-7 Verify Test Cases Page | Low-value navigation check; no state mutation, no assertion beyond page load |
| E2E-25/26 Scroll Up/Down     | UI cosmetic behavior; not connected to purchase or auth flows                |

---

## Defect Summary

**Total issues filed: 31** (29 open, 2 closed as resolved)  
Full list: [GitHub Issues](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues)

### By severity

| Severity    | Count | Areas                                                                   |
| ----------- | ----- | ----------------------------------------------------------------------- |
| Critical    | 6     | Payment guardrails, auth/session, accessibility blocker, security       |
| High        | 8     | API contract, session management, silent UI failures, security exposure |
| Medium      | 11    | Data validation, API design, accessibility (WCAG)                       |
| Low / Infra | 6     | UI stability, viewport issues, test environment noise                   |

### By layer

| Layer                   | Count | Representative issues                                             |
| ----------------------- | ----- | ----------------------------------------------------------------- |
| Payment / checkout flow | 6     | Broken guardrails, missing order ID, arbitrary success page       |
| Auth / session          | 4     | Anonymous access, stale session after logout and account deletion |
| Security                | 2     | Unauthenticated PII endpoint, exposed debug page                  |
| UI / data integrity     | 7     | Silent failures, weak validation, field naming inconsistency      |
| API contract            | 3     | Fake 200 OK, invalid data accepted and persisted                  |
| Accessibility           | 7     | WCAG violations site-wide, keyboard blocker at checkout           |
| Infra / stability       | 2     | Third-party ad interference, intermittent signup failure          |

### Notable findings

**[#46](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/46) — Stale session persists after account deletion**  
A deleted account retains an active UI session. The user can continue through checkout and complete a payment after their account no longer exists. Found through a chain test that combined API account deletion with transport-level checkout access — not reproducible through normal UI navigation.

**[#24](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/24) — Payment success page accepts arbitrary amounts**  
`/payment_done/{overall_amount}` uses the purchase total as the URL identifier rather than a unique order ID. Any value renders a generic success page. This is an architectural issue: `POST /payment` produces no unique order artifact, making order tracking impossible at the transport layer ([#22](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/22)).

**[#38](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/38) — Full user PII returned without authentication**  
`GET /api/getUserDetailByEmail` returns name, address, and phone number for any email address, with no session or token required. No authentication check exists at this endpoint.

**[#15](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/15), [#41](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/41), [#43](https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/43) — Silent failure pattern**  
Three separate UI flows — product review submission, Contact Us form, and newsletter subscription — display a success message without sending any network request. The user receives confirmation of an action that did not occur. This is a recurring pattern rather than isolated bugs, suggesting the success feedback is disconnected from actual server communication.

---

## Key Risk Areas

### Purchase flow integrity

The checkout and payment chain has multiple broken guardrails: anonymous users can reach payment, logout does not invalidate checkout state, and the "Proceed To Checkout" button is unreachable by keyboard. In a real store, these would represent revenue risk and legal exposure.

### Payment artifact design

`/payment_done/{overall_amount}` uses the purchase total as the URL parameter rather than a unique order ID. This means any user can navigate to `/payment_done/500` and see a generic success page. `POST /payment` produces no unique identifier, making order tracking impossible at the transport layer.

### Security surface

`/api/getUserDetailByEmail` returns full PII — name, address, phone — without authentication. Combined with the public Django debug page (#25) that exposes internal URL patterns, the security posture is poor for any public-facing deployment.

### Accessibility

All 8 scanned pages have critical or serious WCAG violations. The keyboard journey is blocked at checkout (#60). The site is not usable without a mouse for core purchase flows.

### Silent failures

Three separate UI flows — product review, newsletter subscription, and Contact Us form — show success messages without sending any data to the server. Users have no indication that their action had no effect.

---

## Verdict

| Area                     | Assessment                                             |
| ------------------------ | ------------------------------------------------------ |
| Core purchase flow       | Reachable but not guarded                              |
| Authentication & session | Multiple broken guardrails                             |
| API contract quality     | Poor — non-standard status codes, no unique order IDs  |
| Data validation          | Weak — invalid inputs accepted and persisted           |
| Accessibility            | Fails WCAG at critical and serious levels site-wide    |
| UI feedback              | Misleading — success shown without server confirmation |

As a commercial product this site would not pass QA sign-off. As a practice target it serves its purpose well: the defects are real, varied, and testable across multiple layers.
